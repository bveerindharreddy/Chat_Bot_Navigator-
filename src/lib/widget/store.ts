// Server-only widget storage.
// Production (Cloudflare Workers): the KV namespace bound as WIDGETS (see vite.config.ts).
// Local dev (`vite dev`, no Worker runtime): a JSON file in .data/, so the console works without Cloudflare.
import { summarize, WIDGET_DEFAULTS, WIDGET_ID, type WidgetRecord, type WidgetSummary } from "./shared";

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts: { prefix: string; cursor?: string }): Promise<{ keys: { name: string; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>;
};

export class StorageNotConfigured extends Error {
  constructor() {
    super("Widget storage is not configured: bind a KV namespace as WIDGETS by setting WIDGETS_KV_ID (see vite.config.ts)");
  }
}

const PREFIX = "w:";

function kv(): KV | null {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  return (env?.WIDGETS as KV | undefined) ?? null;
}

// ---------- dev fallback: .data/widgets.json ----------
const DEV_FILE = ".data/widgets.json";
async function devRead(): Promise<Record<string, WidgetRecord>> {
  const fs = await import("node:fs/promises");
  try { return JSON.parse(await fs.readFile(DEV_FILE, "utf8")); } catch { return {}; }
}
async function devWrite(all: Record<string, WidgetRecord>) {
  const fs = await import("node:fs/promises");
  await fs.mkdir(".data", { recursive: true });
  await fs.writeFile(DEV_FILE, JSON.stringify(all, null, 2));
}

function backend(): "kv" | "dev" {
  if (kv()) return "kv";
  if (import.meta.env.DEV) return "dev";
  throw new StorageNotConfigured();
}

export function newWidgetId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return `wid_${[...bytes].map((b) => chars[b % 62]).join("")}`;
}

export async function getWidget(id: unknown): Promise<WidgetRecord | null> {
  if (typeof id !== "string" || !WIDGET_ID.test(id)) return null;
  if (backend() === "kv") {
    const raw = await kv()!.get(PREFIX + id);
    return raw ? ({ ...WIDGET_DEFAULTS, ...JSON.parse(raw) } as WidgetRecord) : null;
  }
  const w = (await devRead())[id];
  return w ? { ...WIDGET_DEFAULTS, ...w } : null;
}

export async function putWidget(w: WidgetRecord): Promise<void> {
  if (backend() === "kv") {
    await kv()!.put(PREFIX + w.id, JSON.stringify(w), { metadata: summarize(w) });
    return;
  }
  const all = await devRead();
  all[w.id] = w;
  await devWrite(all);
}

export async function deleteWidget(id: string): Promise<void> {
  if (backend() === "kv") return kv()!.delete(PREFIX + id);
  const all = await devRead();
  delete all[id];
  await devWrite(all);
}

export async function listWidgets(): Promise<WidgetSummary[]> {
  let out: WidgetSummary[] = [];
  if (backend() === "kv") {
    let cursor: string | undefined;
    do {
      const page = await kv()!.list({ prefix: PREFIX, cursor });
      out.push(...page.keys.map((k) => k.metadata as WidgetSummary).filter(Boolean));
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  } else {
    out = Object.values(await devRead()).map(summarize);
  }
  return out.sort((a, b) => b.updated - a.updated);
}
