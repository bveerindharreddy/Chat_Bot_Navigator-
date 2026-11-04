import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Ban, Bot, Check, Copy, Headset, Loader2, Lock, MessageCircle, Pencil, Phone, Play, Plus, RefreshCw, RotateCcw, Send, Sparkles, Trash2, Wand2, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WIDGET_COLORS, WIDGET_DEFAULTS, widgetInput, type WidgetIcon, type WidgetInput, type WidgetRecord, type WidgetStatus, type WidgetSummary } from "@/lib/widget/shared";
import { onColor } from "@/widget/ui";
import { cn } from "@/lib/utils";
import { LeadsPanel } from "@/components/console/leads";
import { Switch } from "@/components/ui/switch";
import { fmtCredits, RatesCard, UsagePanel, type ApiFn, type Period, type WidgetUsage } from "@/components/console/usage";
import type { Rates } from "@/lib/widget/usage";

export const Route = createFileRoute("/console")({
  head: () => ({ meta: [{ title: "Widget Console — TechThrust" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Console,
});

const ICON_CHOICES: { id: WidgetIcon; label: string; Icon: LucideIcon }[] = [
  { id: "chat", label: "Chat bubble", Icon: MessageCircle },
  { id: "headset", label: "Headset", Icon: Headset },
  { id: "sparkle", label: "Sparkle", Icon: Sparkles },
  { id: "bot", label: "Assistant", Icon: Bot },
  { id: "phone", label: "Phone", Icon: Phone },
];
const ICON_OF = Object.fromEntries(ICON_CHOICES.map((c) => [c.id, c.Icon])) as Record<WidgetIcon, LucideIcon>;

const EMPTY: WidgetInput = { name: "", url: "", extraDomains: [], prompt: "", greeting: "", icon: "chat", color: WIDGET_COLORS[0], position: "right", ...WIDGET_DEFAULTS };

/** The editable part of a stored widget. */
const toForm = (w: WidgetRecord): WidgetInput => {
  const { id: _i, origins: _o, status: _s, created: _c, updated: _u, ...rest } = w;
  return { ...EMPTY, ...rest };
};

type ApiResult<T> = { ok: boolean; status: number; data: T & { error?: string } };
// Admin API calls ride on the HttpOnly session cookie set by /api/console/login; the password is never stored here.
async function api<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null);
  if (!res) return { ok: false, status: 0, data: { error: "Network error, check your connection" } as T & { error?: string } };
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

const snippetFor = (id: string) => `<script src="${location.origin}/widget.js" data-key="${id}" defer></script>`;
const fmtDate = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function Console() {
  const [auth, setAuth] = useState<"checking" | "in" | "out">("checking");
  const [initial, setInitial] = useState<WidgetSummary[]>([]);
  useEffect(() => {
    void api<{ authenticated?: boolean }>("GET", "/api/console/session").then((r) => setAuth(r.data.authenticated ? "in" : "out"));
  }, []);
  const signOut = () => { void api("DELETE", "/api/console/session"); setInitial([]); setAuth("out"); };
  const expired = () => { setInitial([]); setAuth("out"); };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container-site flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-primary" aria-hidden />TechThrust <span className="text-muted-foreground">Widget Console</span></a>
          {auth === "in" && <Button size="sm" variant="heroOutline" onClick={signOut}>Sign out</Button>}
        </div>
      </header>
      {auth === "checking" ? (
        <div className="flex justify-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-label="Loading" /></div>
      ) : auth === "in" ? <Dashboard initial={initial} onDenied={expired} /> : <Login onDone={(list) => { setInitial(list); setAuth("in"); }} />}
    </div>
  );
}

function Login({ onDone }: { onDone: (list: WidgetSummary[]) => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const login = await api("POST", "/api/console/login", { password: v });
    if (!login.ok) { setBusy(false); return setErr(login.data.error ?? "Sign-in failed"); }
    setV("");
    const r = await api<{ widgets?: WidgetSummary[] }>("GET", "/api/console/widgets");
    setBusy(false);
    onDone(r.data.widgets ?? []);
  };
  return (
    <form onSubmit={submit} className="container-site mx-auto max-w-md py-24">
      <div className="card-premium space-y-5 p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lock className="size-5" aria-hidden /></span>
        <h1 className="text-2xl font-semibold">Admin sign-in</h1>
        <Input type="password" autoFocus placeholder="Admin password" value={v} onChange={(e) => setV(e.target.value)} aria-label="Admin password" />
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={!v || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}</Button>
      </div>
    </form>
  );
}

function Dashboard({ initial, onDenied }: { initial: WidgetSummary[]; onDenied: () => void }) {
  const [form, setForm] = useState<WidgetInput>(EMPTY);
  const [extra, setExtra] = useState("");
  const [list, setList] = useState<WidgetSummary[]>(initial);
  const [editing, setEditing] = useState<WidgetRecord | null>(null); // null = creating a new widget
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const [usage, setUsage] = useState<Record<string, WidgetUsage>>({});
  const [leadCount, setLeadCount] = useState<Record<string, number>>({});
  const [usageOn, setUsageOn] = useState(false);
  const [rates, setRates] = useState<Rates | null>(null);
  const [period, setPeriod] = useState<Period>(30);
  const call: ApiFn = useCallback((method, path, body) => api(method, path, body), []);

  const loadUsage = useCallback(async () => {
    const r = await call<{ configured?: boolean; rates?: Rates; widgets?: Record<string, WidgetUsage>; leads?: Record<string, number> }>("GET", `/api/console/usage?days=${period}`);
    if (!r.ok) return;
    setUsageOn(!!r.data.configured); setRates(r.data.rates ?? null); setUsage(r.data.widgets ?? {}); setLeadCount(r.data.leads ?? {});
  }, [call, period]);
  useEffect(() => { void loadUsage(); }, [loadUsage]);

  const refresh = async () => {
    const r = await api<{ widgets?: WidgetSummary[] }>("GET", "/api/console/widgets");
    if (r.status === 401) return onDenied();
    if (r.ok) setList(r.data.widgets ?? []);
    else setErr(r.data.error ?? "Could not load widgets");
    void loadUsage();
  };
  useEffect(() => { if (initial.length === 0) void refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof WidgetInput>(k: K, v: WidgetInput[K]) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); setNotice(""); };
  const fail = (r: ApiResult<unknown>) => { if (r.status === 401) onDenied(); setErr(r.data.error ?? "Something went wrong"); };
  const upsert = (s: WidgetSummary) => setList((l) => [s, ...l.filter((x) => x.id !== s.id)]);

  const draft = async () => {
    setBusy("draft"); setErr("");
    const r = await api<{ prompt?: string }>("POST", "/api/widget/draft-prompt", { url: form.url, name: form.name });
    setBusy("");
    if (!r.ok || !r.data.prompt) return fail(r);
    set("prompt", r.data.prompt);
  };

  const save = async () => {
    setErr(""); setNotice("");
    const check = widgetInput.safeParse({ ...form, extraDomains: extra.split(/[\s,]+/).filter(Boolean), starters: form.starters.map((q) => q.trim()).filter(Boolean) });
    if (!check.success) return setErr(`${check.error.issues[0]?.path.join(".")}: ${check.error.issues[0]?.message}`);
    setBusy("save");
    const r = editing
      ? await api<{ widget?: WidgetRecord; summary?: WidgetSummary }>("PUT", `/api/console/widgets/${editing.id}`, check.data)
      : await api<{ widget?: WidgetRecord; summary?: WidgetSummary }>("POST", "/api/console/widgets", check.data);
    setBusy("");
    if (!r.ok || !r.data.widget || !r.data.summary) return fail(r);
    setEditing(r.data.widget); upsert(r.data.summary); setDirty(false);
    if (!editing) void loadUsage(); // new widget: starting credits
    setNotice(editing ? "Changes saved. Live sites pick them up on their next page load; the embed code stays the same." : "Widget created. Copy the embed code below.");
  };

  const open = async (id: string) => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setErr(""); setNotice(""); setBusy(`open:${id}`);
    const r = await api<{ widget?: WidgetRecord }>("GET", `/api/console/widgets/${id}`);
    setBusy("");
    if (!r.ok || !r.data.widget) return fail(r);
    const w = r.data.widget;
    setEditing(w); setDirty(false);
    setForm(toForm(w));
    setExtra(w.extraDomains.join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startNew = () => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setEditing(null); setForm(EMPTY); setExtra(""); setDirty(false); setErr(""); setNotice("");
  };

  const setStatus = async (s: WidgetSummary, status: WidgetStatus) => {
    if (status === "revoked" && !confirm(`Revoke "${s.name}"? It stops working on ${s.host} right away. You can restore it later.`)) return;
    setErr(""); setBusy(`status:${s.id}`);
    const r = await api<{ widget?: WidgetRecord; summary?: WidgetSummary }>("PATCH", `/api/console/widgets/${s.id}`, { status });
    setBusy("");
    if (!r.ok || !r.data.summary) return fail(r);
    upsert(r.data.summary);
    if (status === "revoked") stopLive(s.id);
    if (editing?.id === s.id && r.data.widget) setEditing({ ...editing, status: r.data.widget.status, updated: r.data.widget.updated });
  };

  const remove = async (s: WidgetSummary) => {
    if (!confirm(`Delete "${s.name}" permanently? Its embed code stops working and this cannot be undone.`)) return;
    setErr(""); setBusy(`delete:${s.id}`);
    const r = await api("DELETE", `/api/console/widgets/${s.id}`);
    setBusy("");
    if (!r.ok) return fail(r);
    setList((l) => l.filter((x) => x.id !== s.id));
    stopLive(s.id);
    if (editing?.id === s.id) { setEditing(null); setForm(EMPTY); setExtra(""); setDirty(false); }
  };

  const copy = async (id: string) => { await navigator.clipboard.writeText(snippetFor(id)).catch(() => {}); setCopied(id); setTimeout(() => setCopied(""), 1500); };

  const [liveId, setLiveId] = useState("");
  /** Removes the widget started with "Try it live" (a revoked or deleted widget should vanish here too). */
  const stopLive = (id?: string) => {
    if (id && id !== liveId) return;
    document.getElementById("techthrust-widget")?.remove();
    setLiveId("");
  };

  const tryLive = (id: string) => {
    setLiveId(id);
    document.getElementById("techthrust-widget")?.remove();
    try { sessionStorage.removeItem("techthrust-widget"); } catch { /* ignore */ }
    const s = document.createElement("script");
    s.src = `/widget.js?t=${Date.now()}`;
    s.dataset.key = id;
    document.body.appendChild(s);
  };

  const label = "mb-2 block text-sm font-medium";
  const revoked = editing?.status === "revoked";

  return (
    <div className="container-site grid items-start gap-8 py-10 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{editing ? `Edit “${editing.name}”` : "Create a widget"}</h1>
            <p className="mt-2 text-muted-foreground">
              {editing
                ? "Changes apply to the live widget without a new embed code."
                : "A chat and call companion for a customer's website. You give the developer only the embed code: the prompt and logic stay on our server."}
            </p>
          </div>
          {editing && <Button variant="heroOutline" onClick={startNew}><Plus className="size-4" />New widget</Button>}
        </div>

        {revoked && (
          <p role="status" className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <Ban className="size-4 shrink-0" aria-hidden />This widget is revoked and does not load on any site. Restore it from the list to switch it back on.
          </p>
        )}

        <section className="card-premium space-y-5 p-6">
          <h2 className="text-lg font-semibold">1. Basics</h2>
          <div>
            <label className={label} htmlFor="w-name">Widget name <span className="font-normal text-muted-foreground">(shown to visitors, set by the customer)</span></label>
            <Input id="w-name" value={form.name} maxLength={40} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aria from Acme" />
          </div>
          <div>
            <label className={label} htmlFor="w-url">Customer website URL</label>
            <Input id="w-url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://www.customer.com" />
            <p className="mt-1.5 text-xs text-muted-foreground">The widget only works on this site. Visitors on any other domain are refused.</p>
          </div>
          <div>
            <label className={label} htmlFor="w-extra">Extra allowed domains <span className="font-normal text-muted-foreground">(optional, comma separated)</span></label>
            <Input id="w-extra" value={extra} onChange={(e) => { setExtra(e.target.value); setDirty(true); }} placeholder="shop.customer.com, staging.customer.com" />
          </div>
        </section>

        <section className="card-premium space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">2. Prompt</h2>
            <Button size="sm" variant="heroOutline" onClick={draft} disabled={!form.url || busy !== ""}>
              {busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" aria-hidden />}Generate from website URL
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Describes the business, what the assistant may say and which pages it can open. Generate a draft from the URL, then edit it freely.</p>
          <Textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} rows={14} maxLength={8000} placeholder="You are the assistant for…" aria-label="Widget prompt" />
          <p className="text-right text-xs text-muted-foreground">{form.prompt.length} / 8000</p>
          <div>
            <label className={label} htmlFor="w-greet">Greeting <span className="font-normal text-muted-foreground">(optional first message)</span></label>
            <Input id="w-greet" value={form.greeting} maxLength={200} onChange={(e) => set("greeting", e.target.value)} placeholder="Hi! How can I help you today?" />
          </div>
        </section>

        <section className="card-premium space-y-6 p-6">
          <h2 className="text-lg font-semibold">3. Look</h2>
          <fieldset>
            <legend className={label}>Icon</legend>
            <div className="flex flex-wrap gap-3">
              {ICON_CHOICES.map(({ id, label: l, Icon }) => (
                <button key={id} type="button" onClick={() => set("icon", id)} aria-pressed={form.icon === id} title={l}
                  className={cn("flex size-14 items-center justify-center rounded-2xl border transition", form.icon === id ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border hover:bg-muted")}>
                  <Icon className="size-6" aria-hidden /><span className="sr-only">{l}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Colour</legend>
            <div className="flex flex-wrap items-center gap-3">
              {WIDGET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("color", c)} aria-pressed={form.color === c} aria-label={`Colour ${c}`} style={{ background: c }}
                  className={cn("size-9 rounded-full border-2 transition", form.color.toLowerCase() === c ? "border-foreground ring-2 ring-offset-2 ring-offset-background ring-foreground/30" : "border-transparent")} />
              ))}
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Custom <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="size-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5" aria-label="Custom colour" />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Position</legend>
            <div className="flex gap-2">
              {(["right", "left"] as const).map((p) => <Button key={p} size="sm" type="button" variant={form.position === p ? "hero" : "heroOutline"} onClick={() => set("position", p)}>Bottom {p}</Button>)}
            </div>
          </fieldset>
        </section>

        <section className="card-premium space-y-5 p-6">
          <h2 className="text-lg font-semibold">4. Engagement & leads</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="w-lang">Assistant language</label>
              <Input id="w-lang" value={form.language} maxLength={30} onChange={(e) => set("language", e.target.value)} placeholder="English" list="w-langs" />
              <datalist id="w-langs">{["English", "Arabic", "Hindi", "Urdu", "French", "Spanish", "German", "Portuguese", "Russian", "Chinese"].map((l) => <option key={l} value={l} />)}</datalist>
              <p className="mt-1.5 text-xs text-muted-foreground">Starts in this language; switches if the visitor clearly uses another.</p>
            </div>
            <div>
              <label className={label} htmlFor="w-teaser">Pop-up greeting <span className="font-normal text-muted-foreground">(optional)</span></label>
              <div className="flex gap-2">
                <Input id="w-teaser" value={form.teaser} maxLength={120} onChange={(e) => set("teaser", e.target.value)} placeholder="Need help choosing? Ask me!" />
                <Input type="number" min={0} max={120} value={form.teaserDelay} onChange={(e) => set("teaserDelay", Math.max(0, Math.min(120, Math.round(Number(e.target.value) || 0))))} className="w-20" aria-label="Seconds before the pop-up greeting" />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Shown next to the button after this many seconds (once per visit).</p>
            </div>
          </div>
          <fieldset>
            <legend className={label}>Suggested questions <span className="font-normal text-muted-foreground">(up to 4, shown as buttons when the chat opens)</span></legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Input key={i} value={form.starters[i] ?? ""} maxLength={60} aria-label={`Suggested question ${i + 1}`}
                  placeholder={["What do you offer?", "How much does it cost?", "Book an appointment", "Talk to someone"][i]}
                  onChange={(e) => { const next = [...form.starters]; next[i] = e.target.value; set("starters", next.slice(0, 4)); }} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Talk to a human <span className="font-normal text-muted-foreground">(optional; shown as a button in the chat)</span></legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input value={form.handoffPhone} maxLength={40} onChange={(e) => set("handoffPhone", e.target.value)} placeholder="Phone, e.g. +971 4 123 4567" aria-label="Handoff phone" />
              <Input value={form.handoffWhatsapp} maxLength={20} onChange={(e) => set("handoffWhatsapp", e.target.value)} placeholder="WhatsApp, e.g. 971501234567" aria-label="Handoff WhatsApp number" />
              <Input value={form.handoffEmail} maxLength={200} onChange={(e) => set("handoffEmail", e.target.value)} placeholder="Email" aria-label="Handoff email" />
            </div>
          </fieldset>
          <div>
            <label className={label} htmlFor="w-hook">Lead webhook <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input id="w-hook" value={form.leadWebhook} maxLength={500} onChange={(e) => set("leadWebhook", e.target.value)} placeholder="https://hooks.zapier.com/…" />
            <p className="mt-1.5 text-xs text-muted-foreground">Every lead the assistant collects is also POSTed here as JSON, so it can go straight into the customer's CRM, sheet or inbox.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="w-privacy">Privacy policy link <span className="font-normal text-muted-foreground">(recommended)</span></label>
              <Input id="w-privacy" value={form.privacyUrl} maxLength={300} onChange={(e) => set("privacyUrl", e.target.value)} placeholder="https://www.customer.com/privacy" />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
              <span><span className="font-medium">Show "Powered by TechThrust"</span><span className="block text-xs text-muted-foreground">Turn off for white-label plans.</span></span>
              <Switch checked={form.showBranding} onCheckedChange={(v) => set("showBranding", v)} aria-label='Show "Powered by TechThrust"' />
            </label>
          </div>
        </section>

        {err && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        {notice && <p role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">{notice}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="hero" size="lg" onClick={save} disabled={busy !== "" || (!!editing && !dirty)}>
            {busy === "save" && <Loader2 className="size-4 animate-spin" />}{editing ? "Save changes" : "Generate widget"}
          </Button>
          {editing && dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
        </div>

        {editing && (
          <section className="card-premium space-y-4 p-6" aria-live="polite">
            <h2 className="text-lg font-semibold">Embed code for “{editing.name}”</h2>
            <p className="text-sm text-muted-foreground">Send this one line to the customer's developer. It goes right before <code>&lt;/body&gt;</code>. It never changes when you edit the widget. Works only on: {editing.origins.join(", ")}.</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs"><code className="whitespace-pre-wrap break-all">{snippetFor(editing.id)}</code></pre>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" onClick={() => copy(editing.id)}>{copied === editing.id ? <Check className="size-4" /> : <Copy className="size-4" />}{copied === editing.id ? "Copied" : "Copy code"}</Button>
              <Button variant="heroOutline" onClick={() => tryLive(editing.id)} disabled={revoked || dirty} title={dirty ? "Save first" : undefined}><Play className="size-4" />Try it live on this page</Button>
            </div>
          </section>
        )}

        {editing && (
          <UsagePanel api={call} widgetId={editing.id} period={period} onPeriod={setPeriod}
            onBalance={(b) => setUsage((u) => ({ ...u, [editing.id]: { ...(u[editing.id] ?? { loads: 0, opens: 0, chats: 0, calls: 0, callSecs: 0, used: 0 }), balance: b } }))} />
        )}

        {editing && <LeadsPanel api={call} widgetId={editing.id} />}
      </div>

      <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">
        <Preview form={form} />
        {usageOn && <RatesCard api={call} rates={rates} onSaved={setRates} />}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Your widgets <span className="font-normal text-muted-foreground">({list.length})</span></h2>
            <Button size="icon" variant="ghost" aria-label="Reload list" onClick={() => void refresh()}><RefreshCw className="size-4" /></Button>
          </div>
          {list.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No widgets yet. Create one with the form.</p>}
          <ul className="mt-3 space-y-2">
            {list.map((s) => {
              const Icon = ICON_OF[s.icon] ?? MessageCircle;
              const off = s.status === "revoked";
              const rowBusy = busy.endsWith(`:${s.id}`);
              return (
                <li key={s.id} className={cn("rounded-xl border p-2.5", editing?.id === s.id ? "border-primary" : "border-border", off && "opacity-70")}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: s.color, color: onColor(s.color) }}><Icon className="size-4" aria-hidden /></span>
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void open(s.id)} title="Edit">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{s.name}</span>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", off ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400")}>{off ? "Revoked" : "Active"}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{s.host} · {fmtDate(s.updated)}</span>
                      {usageOn && (() => {
                        const u = usage[s.id];
                        const bal = u?.balance ?? 0;
                        const out = bal <= 0 && rates?.enforce;
                        return (
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                            <span className={cn("font-medium tabular-nums", out ? "text-destructive" : "text-foreground")}>{fmtCredits(bal)} credits</span>
                            {out && <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">No credits</span>}
                            <span className="text-muted-foreground">{(u?.chats ?? 0) + (u?.calls ?? 0)} conversations · {leadCount[s.id] ?? 0} leads / {period}d</span>
                          </span>
                        );
                      })()}
                    </button>
                    {rowBusy && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-label="Working" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1 pl-12">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void open(s.id)}><Pencil className="size-3.5" />Edit</Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void copy(s.id)}>{copied === s.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}Code</Button>
                    {off
                      ? <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-600 dark:text-emerald-400" disabled={rowBusy} onClick={() => void setStatus(s, "active")}><RotateCcw className="size-3.5" />Restore</Button>
                      : <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" disabled={rowBusy} onClick={() => void setStatus(s, "revoked")}><Ban className="size-3.5" />Revoke</Button>}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" disabled={rowBusy} onClick={() => void remove(s)} aria-label={`Delete ${s.name}`}><Trash2 className="size-3.5" />Delete</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Preview({ form }: { form: WidgetInput }) {
  const Icon = ICON_OF[form.icon];
  const on = onColor(form.color);
  const name = form.name || "Your assistant";
  return (
    <div className="card-premium p-5">
      <h2 className="mb-3 font-semibold">Preview</h2>
      <div className={cn("flex flex-col gap-3 rounded-xl bg-muted/50 p-4", form.position === "right" ? "items-end" : "items-start")}>
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-[#0b1220] text-[#e5e7eb] shadow-lg">
          <div className="flex items-center gap-2 px-3.5 py-3 text-sm font-semibold" style={{ background: form.color, color: on }}>
            <span className="size-2 rounded-full bg-emerald-400" /><span className="flex-1 truncate">{name}</span><X className="size-4" aria-hidden />
          </div>
          <div className="space-y-2 p-3.5 text-sm">
            <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-sm bg-[#1f2937] px-3 py-2">{form.greeting || `Hi! I'm ${name}. Ask me anything.`}</div>
            {form.starters.some((q) => q.trim()) ? (
              <div className="flex flex-wrap gap-1.5">
                {form.starters.filter((q) => q.trim()).map((q) => <span key={q} className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: form.color }}>{q}</span>)}
              </div>
            ) : (
              <div className="ml-auto w-fit rounded-2xl rounded-br-sm px-3 py-2" style={{ background: `color-mix(in srgb, ${form.color} 35%, #0b1220)` }}>What can you help with?</div>
            )}
          </div>
          {(form.handoffPhone || form.handoffWhatsapp || form.handoffEmail) && (
            <div className="border-t border-[#1f2937] px-3.5 py-2 text-xs text-[#9ca3af]">Talk to a human: {[form.handoffPhone && "Call", form.handoffWhatsapp && "WhatsApp", form.handoffEmail && "Email"].filter(Boolean).join(" · ")}</div>
          )}
          <div className="flex items-center gap-2 border-t border-[#1f2937] p-2.5">
            <span className="flex size-9 items-center justify-center rounded-full border border-[#374151] bg-[#1f2937]"><Headset className="size-4" aria-hidden /></span>
            <span className="flex-1 rounded-full border border-[#374151] bg-[#111827] px-3 py-2 text-xs text-[#9ca3af]">Type your message…</span>
            <span className="flex size-9 items-center justify-center rounded-full" style={{ background: form.color, color: on }}><Send className="size-4" aria-hidden /></span>
          </div>
          <p className="px-3.5 pb-2 text-[10px] text-[#9ca3af]">AI assistant · may make mistakes{form.privacyUrl && " · Privacy"}{form.showBranding && " · Powered by TechThrust"}</p>
        </div>
        {form.teaser && <span className="max-w-[80%] rounded-2xl border border-border bg-background px-3 py-2 text-xs text-foreground shadow">{form.teaser}</span>}
        <span className="flex size-14 items-center justify-center rounded-full shadow-lg" style={{ background: form.color, color: on }}><Icon className="size-6" aria-hidden /></span>
      </div>
    </div>
  );
}
