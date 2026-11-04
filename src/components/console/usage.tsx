// Console: usage stats, credits and billing for widgets. Talks to /api/console/{usage,rates,statement}.
import { useEffect, useState } from "react";
import { Coins, Download, Loader2, Plus, Settings2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DailyUsage, LedgerEntry, Rates, UsageTotals } from "@/lib/widget/usage";

export type ApiFn = <T>(method: string, path: string, body?: unknown) => Promise<{ ok: boolean; status: number; data: T & { error?: string } }>;
export type WidgetUsage = UsageTotals & { balance: number };

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

const num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const fmtCredits = (n: number) => num.format(n);
const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const fmtTs = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const minutes = (secs: number) => num.format(Math.round(secs / 6) / 10);

// Chart colours: categorical slots 1-2 of the validated reference palette (light / dark steps), checked with the
// palette validator in both modes. Text never uses these; they only fill marks and legend swatches.
export const VIZ_CSS = `
.viz{--s1:#2a78d6;--s2:#eb6834}
.dark .viz{--s1:#3987e5;--s2:#d95926}
@media (forced-colors: active){.viz{--s1:CanvasText;--s2:GrayText}}
`;

export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="inline-flex rounded-full border border-border p-0.5" role="group" aria-label="Period">
      {PERIODS.map((p) => (
        <button key={p} type="button" aria-pressed={value === p} onClick={() => onChange(p)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition", value === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          {p} days
        </button>
      ))}
    </div>
  );
}

// ---------- billing rates (global) ----------
export function RatesCard({ api, rates, onSaved }: { api: ApiFn; rates: Rates | null; onSaved: (r: Rates) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Rates | null>(rates);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => setForm(rates), [rates]);
  if (!form) return null;
  const field = (k: "chat" | "voiceMinute" | "load" | "startingCredits", label: string, hint: string) => (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <Input type="number" min={0} step="0.1" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="mt-1" />
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </label>
  );
  const save = async () => {
    setBusy(true); setMsg("");
    const r = await api<{ rates?: Rates }>("PUT", "/api/console/rates", form);
    setBusy(false);
    if (!r.ok || !r.data.rates) return setMsg(r.data.error ?? "Could not save");
    onSaved(r.data.rates); setMsg("Saved. New rates apply to usage from now on.");
  };
  return (
    <section className="card-premium p-5">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex items-center gap-2 font-semibold"><Settings2 className="size-4" aria-hidden />Billing rates</span>
        <span className="text-xs text-muted-foreground">{fmtCredits(rates?.chat ?? 0)} / chat · {fmtCredits(rates?.voiceMinute ?? 0)} / call min</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("chat", "Credits per chat conversation", "Charged when a visitor starts a typed conversation.")}
            {field("voiceMinute", "Credits per voice minute", "Every started minute of a call.")}
            {field("load", "Credits per widget load", "Each page view that shows the widget. Usually 0.")}
            {field("startingCredits", "Starting credits", "Given to every new widget.")}
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
            <span><span className="font-medium">Stop widgets with no credits</span><span className="block text-xs text-muted-foreground">Off: widgets keep working and the balance goes negative.</span></span>
            <Switch checked={form.enforce} onCheckedChange={(v) => setForm({ ...form, enforce: v })} aria-label="Stop widgets with no credits" />
          </label>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="hero" onClick={save} disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Save rates</Button>
            {msg && <span className="text-xs text-muted-foreground" role="status">{msg}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- per-widget usage, credits and billing ----------
type Detail = { configured: boolean; daily: DailyUsage[]; balance: number; ledger: LedgerEntry[] };

export function UsagePanel({ api, widgetId, period, onPeriod, onBalance }: { api: ApiFn; widgetId: string; period: Period; onPeriod: (p: Period) => void; onBalance: (b: number) => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [table, setTable] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    let live = true;
    setErr("");
    void api<Detail>("GET", `/api/console/usage/${widgetId}?days=${period}`).then((r) => {
      if (!live) return;
      if (!r.ok) return setErr(r.data.error ?? "Could not load usage");
      setD(r.data);
    });
    return () => { live = false; };
  }, [api, widgetId, period]);

  if (err) return <section className="card-premium p-6 text-sm text-destructive" role="alert">{err}</section>;
  if (!d) return <section className="card-premium flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading usage…</section>;
  if (!d.configured) {
    return (
      <section className="card-premium p-6 text-sm">
        <h2 className="text-lg font-semibold">Usage & credits</h2>
        <p className="mt-2 text-muted-foreground">Usage tracking is not configured on this server. Create the D1 database and set <code>WIDGETS_D1_ID</code> (see <code>vite.config.ts</code>).</p>
      </section>
    );
  }

  const t = d.daily.reduce((a, x) => ({ loads: a.loads + x.loads, opens: a.opens + x.opens, chats: a.chats + x.chats, calls: a.calls + x.calls, callSecs: a.callSecs + x.callSecs, used: a.used + x.used }),
    { loads: 0, opens: 0, chats: 0, calls: 0, callSecs: 0, used: 0 });

  const topUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const credits = Number(amount);
    setBusy("credits"); setErr("");
    const r = await api<{ balance?: number; ledger?: LedgerEntry[] }>("POST", `/api/console/usage/${widgetId}`, { credits, note });
    setBusy("");
    if (!r.ok || r.data.balance === undefined) return setErr(r.data.error ?? "Could not add credits");
    setD({ ...d, balance: r.data.balance, ledger: r.data.ledger ?? d.ledger });
    onBalance(r.data.balance);
    setAmount(""); setNote("");
  };

  const download = async () => {
    setBusy("statement");
    const res = await fetch(`/api/console/statement?id=${widgetId}&month=${month}`, { credentials: "same-origin" }).catch(() => null);
    setBusy("");
    if (!res?.ok) return setErr((await res?.json().catch(() => null))?.error ?? "Could not create the statement");
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: `statement-${widgetId}-${month}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tiles: [string, string][] = [
    ["Widget loads", num.format(t.loads)],
    ["Chat opens", num.format(t.opens)],
    ["Chat conversations", num.format(t.chats)],
    ["Voice calls", num.format(t.calls)],
    ["Call minutes", minutes(t.callSecs)],
    ["Credits used", fmtCredits(t.used)],
  ];
  const low = d.balance <= 0;

  return (
    <section className="card-premium space-y-6 p-6">
      <style>{VIZ_CSS}</style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Usage & credits</h2>
        <PeriodPicker value={period} onChange={onPeriod} />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className={cn("rounded-xl border p-4", low ? "border-destructive/50 bg-destructive/5" : "border-border")}>
          <p className="text-xs font-medium text-muted-foreground">Credit balance</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{fmtCredits(d.balance)}</p>
          {low && <p className="mt-1 text-xs font-medium text-destructive">Out of credits: the widget is not shown on the site (when "Stop widgets with no credits" is on).</p>}
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Conversations per day</h3>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="viz flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--s1)" }} />Chat</span>
            <span className="viz flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--s2)" }} />Voice</span>
            <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => setTable(!table)} aria-pressed={table}><Table2 className="size-3.5" aria-hidden />{table ? "Chart" : "Table"}</button>
          </div>
        </div>
        {table ? <UsageTable daily={d.daily} /> : <UsageChart daily={d.daily} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={topUp} className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Coins className="size-4" aria-hidden />Add credits</h3>
          <div className="flex gap-2">
            <Input type="number" step="any" inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Credits to add" className="w-44" />
            <Input placeholder="Note, e.g. invoice #1042" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} aria-label="Note" />
          </div>
          <p className="text-xs text-muted-foreground">Use a negative amount to deduct credits. Add the invoice or payment reference as the note.</p>
          <Button size="sm" variant="hero" type="submit" disabled={!amount || Number(amount) === 0 || busy !== ""}>{busy === "credits" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Add to balance</Button>
        </form>
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Download className="size-4" aria-hidden />Monthly statement</h3>
          <div className="flex gap-2">
            <Input type="month" value={month} max={new Date().toISOString().slice(0, 7)} onChange={(e) => setMonth(e.target.value)} aria-label="Statement month" className="w-44" />
            <Button size="sm" variant="heroOutline" onClick={download} disabled={!month || busy !== ""}>{busy === "statement" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Download CSV</Button>
          </div>
          <p className="text-xs text-muted-foreground">Daily usage, credits used, top-ups and opening/closing balance for the month.</p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Credit history</h3>
        {d.ledger.length === 0 ? <p className="text-sm text-muted-foreground">No top-ups yet.</p> : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 text-right font-medium">Credits</th><th className="px-3 py-2 font-medium">Note</th></tr>
              </thead>
              <tbody>
                {d.ledger.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2">{fmtTs(e.ts)}</td>
                    <td className="px-3 py-2">{e.kind === "topup" ? "Top-up" : "Adjustment"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{e.credits > 0 ? "+" : ""}{fmtCredits(e.credits)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export function UsageTable({ daily }: { daily: DailyUsage[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted text-left text-xs text-muted-foreground">
          <tr>{["Day", "Loads", "Opens", "Chats", "Calls", "Call min", "Credits"].map((h, i) => <th key={h} className={cn("px-3 py-2 font-medium", i > 0 && "text-right")}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {[...daily].reverse().map((r) => (
            <tr key={r.day} className="border-t border-border tabular-nums">
              <td className="px-3 py-1.5">{fmtDay(r.day)}</td>
              <td className="px-3 py-1.5 text-right">{r.loads}</td><td className="px-3 py-1.5 text-right">{r.opens}</td>
              <td className="px-3 py-1.5 text-right">{r.chats}</td><td className="px-3 py-1.5 text-right">{r.calls}</td>
              <td className="px-3 py-1.5 text-right">{minutes(r.callSecs)}</td><td className="px-3 py-1.5 text-right">{fmtCredits(r.used)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Stacked daily columns (chat below, voice above). One axis, recessive grid, hover/focus tooltip per day. */
export function UsageChart({ daily }: { daily: DailyUsage[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 170, L = 28, R = 6, T = 8, B = 22;
  const iw = W - L - R, ih = H - T - B;
  const peak = Math.max(1, ...daily.map((x) => x.chats + x.calls));
  const step = peak <= 4 ? 1 : Math.ceil(peak / 4 / (10 ** Math.floor(Math.log10(peak / 4)))) * 10 ** Math.floor(Math.log10(peak / 4));
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).filter((v, i, a) => a.length <= 5 || i % Math.ceil(a.length / 5) === 0 || v === top);
  const band = iw / daily.length;
  const bw = Math.max(2, Math.min(24, band * 0.68));
  const y = (v: number) => T + ih - (v / top) * ih;
  const GAP = 2;
  // column with rounded data-end (top) and square base
  const col = (x: number, y0: number, y1: number, round: boolean) => {
    const h = y0 - y1;
    if (h <= 0) return "";
    const r = round ? Math.min(4, bw / 2, h) : 0;
    return `M${x},${y0}V${y1 + r}${r ? `Q${x},${y1} ${x + r},${y1}` : ""}H${x + bw - r}${r ? `Q${x + bw},${y1} ${x + bw},${y1 + r}` : ""}V${y0}Z`;
  };
  const labelIdx = [0, Math.floor((daily.length - 1) / 2), daily.length - 1];
  const h = hover !== null ? daily[hover] : null;
  const total = daily.reduce((s, x) => s + x.chats + x.calls, 0);

  return (
    <div className="viz relative" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full text-muted-foreground" role="img"
        aria-label={`Conversations per day over the last ${daily.length} days: ${total} in total. Use the Table view for exact numbers.`}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={v === 0 ? 0.5 : 0.15} strokeWidth={1} />
            <text x={L - 6} y={y(v)} dy="0.32em" textAnchor="end" fontSize="10" fill="currentColor">{v}</text>
          </g>
        ))}
        {daily.map((dd, i) => {
          const x = L + i * band + (band - bw) / 2;
          const yc = y(dd.chats);
          const voiceBase = dd.chats > 0 && dd.calls > 0 ? yc - GAP : yc;
          const yv = y(dd.chats + dd.calls) - (dd.chats > 0 && dd.calls > 0 ? GAP : 0);
          return (
            <g key={dd.day} opacity={hover === null || hover === i ? 1 : 0.45}>
              <path d={col(x, y(0), yc, dd.calls === 0)} fill="var(--s1)" />
              <path d={col(x, voiceBase, yv, true)} fill="var(--s2)" />
            </g>
          );
        })}
        {labelIdx.filter((v, i, a) => a.indexOf(v) === i).map((i) => (
          <text key={i} x={L + i * band + band / 2} y={H - 6} fontSize="10" fill="currentColor"
            textAnchor={i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle"}>{fmtDay(daily[i]!.day)}</text>
        ))}
        {/* hit targets: the whole day band, larger than the mark */}
        {daily.map((dd, i) => (
          <rect key={dd.day} x={L + i * band} y={T} width={band} height={ih} fill="transparent" tabIndex={0}
            aria-label={`${fmtDay(dd.day)}: ${dd.chats} chat, ${dd.calls} voice`}
            onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="outline-none" />
        ))}
      </svg>
      {h && hover !== null && (
        <div className="pointer-events-none absolute top-0 z-10 w-40 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-lg"
          style={{ left: `clamp(5rem, ${((L + (hover + 0.5) * band) / W) * 100}%, calc(100% - 5rem))` }}>
          <p className="font-semibold">{fmtDay(h.day)}</p>
          <p className="mt-1 flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: "var(--s1)" }} />Chat</span><span className="tabular-nums">{h.chats}</span></p>
          <p className="flex items-center justify-between"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: "var(--s2)" }} />Voice</span><span className="tabular-nums">{h.calls}</span></p>
          <p className="mt-1 flex justify-between border-t border-border pt-1 text-muted-foreground"><span>Call minutes</span><span className="tabular-nums">{minutes(h.callSecs)}</span></p>
          <p className="flex justify-between text-muted-foreground"><span>Credits used</span><span className="tabular-nums">{fmtCredits(h.used)}</span></p>
        </div>
      )}
    </div>
  );
}
