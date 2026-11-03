// Server-only usage tracking, credits and billing ledger.
// Production: Cloudflare D1 bound as USAGE (see vite.config.ts). Local `vite dev`: Node's built-in SQLite in .data/.
// Credits are stored as integer milli-credits (x1000) so balances never drift from float rounding.

type Stmt = {
  bind(...values: unknown[]): Stmt;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
};
type DB = { prepare(sql: string): Stmt; batch(stmts: Stmt[]): Promise<unknown> };

export type Rates = {
  /** credits per chat conversation */
  chat: number;
  /** credits per started minute of voice */
  voiceMinute: number;
  /** credits per page load showing the widget (usually 0) */
  load: number;
  /** credits given to every new widget */
  startingCredits: number;
  /** stop widgets that have no credits left */
  enforce: boolean;
};
export const DEFAULT_RATES: Rates = { chat: 1, voiceMinute: 2, load: 0, startingCredits: 100, enforce: true };

export type UsageTotals = { loads: number; opens: number; chats: number; calls: number; callSecs: number; used: number };
export type DailyUsage = UsageTotals & { day: string };
export type LedgerEntry = { id: number; ts: number; kind: "topup" | "adjust"; credits: number; note: string };

const M = 1000;
const toM = (credits: number) => Math.round(credits * M);
const fromM = (m: number) => Math.round(m) / M;
export const today = () => new Date().toISOString().slice(0, 10);
const dayOffset = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

// ---------- database ----------
let devDb: Promise<DB> | null = null;

async function openDevDb(): Promise<DB> {
  const spec = "node:sqlite"; // kept out of the Worker bundle: only `vite dev` (Node) reaches this
  const { DatabaseSync } = await import(/* @vite-ignore */ spec);
  const fs = await import("node:fs");
  fs.mkdirSync(".data", { recursive: true });
  const db = new DatabaseSync(".data/usage.sqlite");
  const stmt = (sql: string, params: unknown[] = []): Stmt => ({
    bind: (...v) => stmt(sql, v),
    run: async () => db.prepare(sql).run(...params),
    all: async <T,>() => ({ results: db.prepare(sql).all(...params) as T[] }),
    first: async <T,>() => (db.prepare(sql).get(...params) as T) ?? null,
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (stmts) => {
      db.exec("BEGIN");
      try { for (const s of stmts) await s.run(); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
}

/** null when usage tracking is not configured (production without the USAGE binding). */
async function db(): Promise<DB | null> {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const d1 = env?.USAGE as DB | undefined;
  const base = d1 ?? (import.meta.env.DEV ? await (devDb ??= openDevDb()) : null);
  if (!base) return null;
  await ensureSchema(base);
  return base;
}

let schema: Promise<unknown> | null = null;
function ensureSchema(d: DB) {
  return (schema ??= d
    .batch([
      d.prepare(`CREATE TABLE IF NOT EXISTS usage_daily (
        widget_id TEXT NOT NULL, day TEXT NOT NULL,
        loads INTEGER NOT NULL DEFAULT 0, opens INTEGER NOT NULL DEFAULT 0, chats INTEGER NOT NULL DEFAULT 0,
        calls INTEGER NOT NULL DEFAULT 0, call_secs INTEGER NOT NULL DEFAULT 0, used_m INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (widget_id, day))`),
      d.prepare(`CREATE TABLE IF NOT EXISTS ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT, widget_id TEXT NOT NULL, ts INTEGER NOT NULL,
        kind TEXT NOT NULL, amount_m INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '')`),
      d.prepare(`CREATE INDEX IF NOT EXISTS ledger_widget ON ledger (widget_id, ts)`),
      d.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
    ])
    .catch((e) => { schema = null; throw e; }));
}

export async function usageConfigured(): Promise<boolean> {
  return (await db()) !== null;
}

// ---------- rates ----------
let ratesCache: { at: number; rates: Rates } | null = null;

export async function getRates(): Promise<Rates> {
  if (ratesCache && Date.now() - ratesCache.at < 30_000) return ratesCache.rates;
  const d = await db();
  const row = d ? await d.prepare("SELECT value FROM settings WHERE key = 'rates'").first<{ value: string }>() : null;
  const rates = { ...DEFAULT_RATES, ...(row ? (JSON.parse(row.value) as Partial<Rates>) : {}) };
  ratesCache = { at: Date.now(), rates };
  return rates;
}

export async function setRates(rates: Rates): Promise<void> {
  const d = await db();
  if (!d) throw new UsageNotConfigured();
  await d.prepare("INSERT INTO settings (key, value) VALUES ('rates', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(rates)).run();
  ratesCache = { at: Date.now(), rates };
}

export class UsageNotConfigured extends Error {
  constructor() {
    super("Usage tracking is not configured: bind a D1 database as USAGE by setting WIDGETS_D1_ID (see vite.config.ts)");
  }
}

// ---------- recording (public endpoints) ----------
type Delta = Partial<{ loads: number; opens: number; chats: number; calls: number; callSecs: number; usedCredits: number }>;

/** Adds to today's counters. Never throws: tracking must not break a customer's widget. */
export async function recordUsage(widgetId: string, d: Delta): Promise<void> {
  try {
    const conn = await db();
    if (!conn) return;
    await conn
      .prepare(`INSERT INTO usage_daily (widget_id, day, loads, opens, chats, calls, call_secs, used_m) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(widget_id, day) DO UPDATE SET loads = loads + excluded.loads, opens = opens + excluded.opens,
        chats = chats + excluded.chats, calls = calls + excluded.calls, call_secs = call_secs + excluded.call_secs, used_m = used_m + excluded.used_m`)
      .bind(widgetId, today(), d.loads ?? 0, d.opens ?? 0, d.chats ?? 0, d.calls ?? 0, d.callSecs ?? 0, toM(d.usedCredits ?? 0))
      .run();
  } catch (e) {
    console.error("recordUsage failed", e);
  }
}

export async function balance(widgetId: string): Promise<number | null> {
  const conn = await db();
  if (!conn) return null;
  const row = await conn
    .prepare(`SELECT (SELECT COALESCE(SUM(amount_m), 0) FROM ledger WHERE widget_id = ?1)
      - (SELECT COALESCE(SUM(used_m), 0) FROM usage_daily WHERE widget_id = ?1) AS bal`)
    .bind(widgetId)
    .first<{ bal: number }>();
  return fromM(row?.bal ?? 0);
}

/** Whether a widget may serve visitors under the current billing rules. Fails open if tracking is down. */
export async function hasCredit(widgetId: string): Promise<boolean> {
  try {
    const rates = await getRates();
    if (!rates.enforce) return true;
    const bal = await balance(widgetId);
    return bal === null || bal > 0;
  } catch (e) {
    console.error("hasCredit failed", e);
    return true;
  }
}

// ---------- credits (console) ----------
export async function addCredits(widgetId: string, credits: number, note: string): Promise<number> {
  const conn = await db();
  if (!conn) throw new UsageNotConfigured();
  await conn
    .prepare("INSERT INTO ledger (widget_id, ts, kind, amount_m, note) VALUES (?, ?, ?, ?, ?)")
    .bind(widgetId, Date.now(), credits >= 0 ? "topup" : "adjust", toM(credits), note.slice(0, 200))
    .run();
  return (await balance(widgetId)) ?? 0;
}

export async function ledgerFor(widgetId: string, limit = 50): Promise<LedgerEntry[]> {
  const conn = await db();
  if (!conn) return [];
  const { results } = await conn
    .prepare("SELECT id, ts, kind, amount_m, note FROM ledger WHERE widget_id = ? ORDER BY ts DESC, id DESC LIMIT ?")
    .bind(widgetId, limit)
    .all<{ id: number; ts: number; kind: LedgerEntry["kind"]; amount_m: number; note: string }>();
  return results.map((r) => ({ id: r.id, ts: r.ts, kind: r.kind, credits: fromM(r.amount_m), note: r.note }));
}

// ---------- reporting (console) ----------
type Row = { widget_id: string; day: string; loads: number; opens: number; chats: number; calls: number; call_secs: number; used_m: number };
const totalsOf = (r: Partial<Row>): UsageTotals => ({
  loads: r.loads ?? 0, opens: r.opens ?? 0, chats: r.chats ?? 0, calls: r.calls ?? 0, callSecs: r.call_secs ?? 0, used: fromM(r.used_m ?? 0),
});

/** Totals over the last `days` days plus the current balance, for every widget that has activity or credits. */
export async function summaryAll(days: number): Promise<Record<string, UsageTotals & { balance: number }>> {
  const conn = await db();
  if (!conn) return {};
  const [usage, bal] = await Promise.all([
    conn
      .prepare(`SELECT widget_id, SUM(loads) loads, SUM(opens) opens, SUM(chats) chats, SUM(calls) calls, SUM(call_secs) call_secs, SUM(used_m) used_m
        FROM usage_daily WHERE day >= ? GROUP BY widget_id`)
      .bind(dayOffset(days - 1))
      .all<Row>(),
    conn
      .prepare(`SELECT widget_id, SUM(m) bal FROM (
        SELECT widget_id, amount_m m FROM ledger UNION ALL SELECT widget_id, -used_m m FROM usage_daily) GROUP BY widget_id`)
      .all<{ widget_id: string; bal: number }>(),
  ]);
  const out: Record<string, UsageTotals & { balance: number }> = {};
  for (const b of bal.results) out[b.widget_id] = { ...totalsOf({}), balance: fromM(b.bal) };
  for (const u of usage.results) out[u.widget_id] = { ...totalsOf(u), balance: out[u.widget_id]?.balance ?? 0 };
  return out;
}

/** One row per day (zeros included) for the chart and table, oldest first. */
export async function dailyFor(widgetId: string, days: number): Promise<DailyUsage[]> {
  const conn = await db();
  const rows = conn
    ? (await conn.prepare("SELECT * FROM usage_daily WHERE widget_id = ? AND day >= ?").bind(widgetId, dayOffset(days - 1)).all<Row>()).results
    : [];
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = dayOffset(days - 1 - i);
    return { day, ...totalsOf(byDay.get(day) ?? {}) };
  });
}

/** Month statement for billing: daily usage, top-ups/adjustments, opening and closing balance. month = "YYYY-MM". */
export async function statement(widgetId: string, month: string) {
  const conn = await db();
  if (!conn) throw new UsageNotConfigured();
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const startTs = Date.parse(`${start}T00:00:00Z`);
  const endTs = Date.parse(`${next}T00:00:00Z`);
  const [days, ledger, before] = await Promise.all([
    conn.prepare("SELECT * FROM usage_daily WHERE widget_id = ? AND day >= ? AND day < ? ORDER BY day").bind(widgetId, start, next).all<Row>(),
    conn.prepare("SELECT id, ts, kind, amount_m, note FROM ledger WHERE widget_id = ? AND ts >= ? AND ts < ? ORDER BY ts").bind(widgetId, startTs, endTs)
      .all<{ id: number; ts: number; kind: LedgerEntry["kind"]; amount_m: number; note: string }>(),
    conn
      .prepare(`SELECT (SELECT COALESCE(SUM(amount_m), 0) FROM ledger WHERE widget_id = ?1 AND ts < ?2)
        - (SELECT COALESCE(SUM(used_m), 0) FROM usage_daily WHERE widget_id = ?1 AND day < ?3) AS bal`)
      .bind(widgetId, startTs, start)
      .first<{ bal: number }>(),
  ]);
  const usage = days.results.map((r) => ({ day: r.day, ...totalsOf(r) }));
  const entries = ledger.results.map((r) => ({ id: r.id, ts: r.ts, kind: r.kind, credits: fromM(r.amount_m), note: r.note }));
  const opening = fromM(before?.bal ?? 0);
  const used = usage.reduce((s, u) => s + u.used, 0);
  const added = entries.reduce((s, e) => s + e.credits, 0);
  return { month, opening, added: fromM(toM(added)), used: fromM(toM(used)), closing: fromM(toM(opening + added - used)), usage, entries };
}
