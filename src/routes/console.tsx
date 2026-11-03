import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bot, Check, Copy, Headset, Loader2, Lock, MessageCircle, Phone, Play, Send, Sparkles, Trash2, Wand2, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WIDGET_COLORS, widgetInput, type WidgetIcon, type WidgetInput } from "@/lib/widget/shared";
import { onColor } from "@/widget/ui";
import { cn } from "@/lib/utils";

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

type Saved = { id: string; key: string; origins: string[]; created: number; form: WidgetInput };
const EMPTY: WidgetInput = { name: "", url: "", extraDomains: [], prompt: "", greeting: "", icon: "chat", color: WIDGET_COLORS[0], position: "right" };
const STORE = "tt-console-widgets";
const PW = "tt-console-pw";

const readSaved = (): Saved[] => { try { return JSON.parse(localStorage.getItem(STORE) ?? "[]"); } catch { return []; } };
const writeSaved = (s: Saved[]) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* storage unavailable */ } };

async function api<T>(path: string, pw: string, body: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "x-admin-password": pw }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

const snippetFor = (key: string) => `<script src="${location.origin}/widget.js" data-key="${key}" defer></script>`;

function Console() {
  const [pw, setPw] = useState<string | null>(null);
  useEffect(() => { try { setPw(sessionStorage.getItem(PW)); } catch { /* ignore */ } }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container-site flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-semibold"><Sparkles className="size-5 text-primary" aria-hidden />TechThrust <span className="text-muted-foreground">Widget Console</span></a>
          {pw && <Button size="sm" variant="heroOutline" onClick={() => { try { sessionStorage.removeItem(PW); } catch { /* ignore */ } setPw(null); }}>Sign out</Button>}
        </div>
      </header>
      {pw ? <Dashboard pw={pw} onDenied={() => setPw(null)} /> : <Login onDone={setPw} />}
    </div>
  );
}

function Login({ onDone }: { onDone: (pw: string) => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await api("/api/widget/create", v, {}); // 401 = wrong password, 400 = authorised (empty body is invalid)
    setBusy(false);
    if (r.status === 401 || r.status === 500) return setErr(r.data.error ?? "Sign-in failed");
    try { sessionStorage.setItem(PW, v); } catch { /* ignore */ }
    onDone(v);
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

function Dashboard({ pw, onDenied }: { pw: string; onDenied: () => void }) {
  const [form, setForm] = useState<WidgetInput>(EMPTY);
  const [extra, setExtra] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [current, setCurrent] = useState<Saved | null>(null);
  const [busy, setBusy] = useState<"" | "draft" | "create">("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setSaved(readSaved()), []);

  const set = <K extends keyof WidgetInput>(k: K, v: WidgetInput[K]) => { setForm((f) => ({ ...f, [k]: v })); setCurrent(null); };
  const fail = (r: { status: number; data: { error?: string } }) => { if (r.status === 401) onDenied(); setErr(r.data.error ?? "Something went wrong"); };

  const draft = async () => {
    setBusy("draft"); setErr("");
    const r = await api<{ prompt?: string }>("/api/widget/draft-prompt", pw, { url: form.url, name: form.name });
    setBusy("");
    if (!r.ok || !r.data.prompt) return fail(r);
    set("prompt", r.data.prompt);
  };

  const create = async () => {
    setErr("");
    const payload = { ...form, extraDomains: extra.split(/[\s,]+/).filter(Boolean) };
    const check = widgetInput.safeParse(payload);
    if (!check.success) return setErr(check.error.issues[0]?.path.join(".") + ": " + check.error.issues[0]?.message);
    setBusy("create");
    const r = await api<{ key?: string; origins?: string[] }>("/api/widget/create", pw, check.data);
    setBusy("");
    if (!r.ok || !r.data.key) return fail(r);
    const item: Saved = { id: crypto.randomUUID(), key: r.data.key, origins: r.data.origins ?? [], created: Date.now(), form: check.data };
    const next = [item, ...saved].slice(0, 50);
    setSaved(next); writeSaved(next); setCurrent(item);
  };

  const copy = async (text: string) => { await navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const tryLive = (key: string) => {
    document.getElementById("techthrust-widget")?.remove();
    try { sessionStorage.removeItem("techthrust-widget"); } catch { /* ignore */ }
    const s = document.createElement("script");
    s.src = `/widget.js?t=${Date.now()}`;
    s.dataset.key = key;
    document.body.appendChild(s);
  };

  const edit = (s: Saved) => { setForm(s.form); setExtra(s.form.extraDomains.join(", ")); setCurrent(s); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (id: string) => { const next = saved.filter((s) => s.id !== id); setSaved(next); writeSaved(next); if (current?.id === id) setCurrent(null); };

  const snippet = current ? snippetFor(current.key) : "";
  const label = "mb-2 block text-sm font-medium";

  return (
    <div className="container-site grid items-start gap-8 py-10 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Create a widget</h1>
          <p className="mt-2 text-muted-foreground">A chat and call companion for a customer's website. You give the developer only the embed code: the prompt and logic stay encrypted on our server.</p>
        </div>

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
            <Input id="w-extra" value={extra} onChange={(e) => { setExtra(e.target.value); setCurrent(null); }} placeholder="shop.customer.com, staging.customer.com" />
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

        {err && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
        <Button variant="hero" size="lg" onClick={create} disabled={busy !== ""}>{busy === "create" && <Loader2 className="size-4 animate-spin" />}Generate widget</Button>

        {current && (
          <section className="card-premium space-y-4 p-6" aria-live="polite">
            <h2 className="text-lg font-semibold">Embed code for “{current.form.name}”</h2>
            <p className="text-sm text-muted-foreground">Send this one line to the customer's developer. It goes right before <code>&lt;/body&gt;</code>. Works only on: {current.origins.join(", ")}.</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-xs"><code className="break-all whitespace-pre-wrap">{snippet}</code></pre>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" onClick={() => copy(snippet)}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy code"}</Button>
              <Button variant="heroOutline" onClick={() => tryLive(current.key)}><Play className="size-4" />Try it live on this page</Button>
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6">
        <Preview form={form} />
        <div className="card-premium p-5">
          <h2 className="font-semibold">Your widgets</h2>
          {saved.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Nothing yet. Widgets you create are listed here (stored in this browser).</p>}
          <ul className="mt-3 space-y-2">
            {saved.map((s) => {
              const Icon = ICON_OF[s.form.icon] ?? MessageCircle;
              return (
                <li key={s.id} className={cn("flex items-center gap-3 rounded-xl border p-2.5", current?.id === s.id ? "border-primary" : "border-border")}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: s.form.color, color: onColor(s.form.color) }}><Icon className="size-4" aria-hidden /></span>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => edit(s)}>
                    <span className="block truncate text-sm font-medium">{s.form.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{new URL(s.form.url).hostname}</span>
                  </button>
                  <Button size="icon" variant="ghost" aria-label={`Copy embed code for ${s.form.name}`} onClick={() => copy(snippetFor(s.key))}><Copy className="size-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Remove ${s.form.name} from this list`} onClick={() => remove(s.id)}><Trash2 className="size-4" /></Button>
                </li>
              );
            })}
          </ul>
          {saved.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Selecting a widget loads it into the form. Changing it and generating again issues a new embed code.</p>}
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
            <div className="ml-auto w-fit rounded-2xl rounded-br-sm px-3 py-2" style={{ background: `color-mix(in srgb, ${form.color} 35%, #0b1220)` }}>What can you help with?</div>
          </div>
          <div className="flex items-center gap-2 border-t border-[#1f2937] p-2.5">
            <span className="flex size-9 items-center justify-center rounded-full border border-[#374151] bg-[#1f2937]"><Headset className="size-4" aria-hidden /></span>
            <span className="flex-1 rounded-full border border-[#374151] bg-[#111827] px-3 py-2 text-xs text-[#9ca3af]">Type your message…</span>
            <span className="flex size-9 items-center justify-center rounded-full" style={{ background: form.color, color: on }}><Send className="size-4" aria-hidden /></span>
          </div>
        </div>
        <span className="flex size-14 items-center justify-center rounded-full shadow-lg" style={{ background: form.color, color: on }}><Icon className="size-6" aria-hidden /></span>
      </div>
    </div>
  );
}
