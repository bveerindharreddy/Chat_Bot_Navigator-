// Embeddable voice + chat companion, built to public/widget.js.
// Install: <script src="https://<host>/widget.js" data-key="<widget key>" defer></script>
// The key is just an id. Prompt, tools and model settings are stored and applied on the server.
import type { LiveServerMessage, Session } from "@google/genai";
import type { MicCapture, Player } from "@/lib/voice/audio";
import type { LiveModule } from "./live";
import type { PublicWidgetConfig } from "@/lib/widget/shared";
import { runWidgetTool } from "./tools";
import { STYLES, ICONS, launcherIcon, onColor } from "./ui";
import { fill, isRtl, strings, type Strings } from "./i18n";

type Line = { role: "you" | "bot"; text: string; typed?: boolean };
type Status = "idle" | "connecting" | "live" | "error";
type Resume = { ts: number; voice: boolean; agentNav: boolean };
type Saved = { open: boolean; lines: Line[]; resume: Resume | null };

const script = document.currentScript as HTMLScriptElement | null;
const API = script?.src ? new URL(script.src).origin : location.origin;
const WIDGET_KEY = script?.dataset.key ?? "";
const STORE = "techthrust-widget";
const HOST_ID = "techthrust-widget";
const RESUME_WINDOW_MS = 60_000;

const load = (): Saved => {
  try { return { open: false, lines: [], resume: null, ...JSON.parse(sessionStorage.getItem(STORE) ?? "{}") }; } catch { return { open: false, lines: [], resume: null }; }
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
declare const __WIDGET_BUILD__: string;

// The realtime client and audio code live in widget-live.js and load on first use (see live.ts).
let liveModule: Promise<LiveModule> | null = null;
function loadLive(): Promise<LiveModule> {
  return (liveModule ??= new Promise<LiveModule>((resolve, reject) => {
    const w = window as unknown as { __techthrustWidgetLive?: LiveModule };
    if (w.__techthrustWidgetLive) return resolve(w.__techthrustWidgetLive);
    const s = document.createElement("script");
    s.src = `${API}/widget-live.js?v=${__WIDGET_BUILD__}`;
    s.async = true;
    s.onload = () => (w.__techthrustWidgetLive ? resolve(w.__techthrustWidgetLive) : reject(new WidgetError("failed")));
    s.onerror = () => { liveModule = null; reject(new WidgetError("connection")); };
    document.head.appendChild(s);
  }));
}

/** An error the visitor sees, as a key into the widget's interface strings (shown in the widget's language). */
class WidgetError extends Error {
  constructor(readonly key: "unavailable" | "busy" | "failed" | "connection" | "micBlocked") { super(key); }
}

const post = (path: string, body: unknown) =>
  fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** Usage beacon (open / call_start / call_end). text/plain keeps it a simple request that survives page unload. */
function beacon(type: "open" | "call_start" | "call_end", extra: Record<string, unknown> = {}) {
  const data = JSON.stringify({ key: WIDGET_KEY, type, ...extra });
  const url = `${API}/api/widget/event`;
  try { if (navigator.sendBeacon?.(url, new Blob([data], { type: "text/plain" }))) return; } catch { /* fall back to fetch */ }
  fetch(url, { method: "POST", body: data, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

class Widget {
  private host = document.createElement("div");
  private root = this.host.attachShadow({ mode: "open" });
  private saved = load();
  private lines: Line[] = this.saved.lines;
  private open = this.saved.open;
  private status: Status = "idle";
  private voiceOn = false;
  private needsTap = false;
  private reconnecting = false;
  private agentNav = false; // the assistant (not the visitor) caused the page change
  private muted = false;
  private thinking = false;
  private error = "";
  private secs = 0;
  private timer?: ReturnType<typeof setInterval>;
  private session: Session | null = null;
  private mic: MicCapture | null = null;
  private player: Player | null = null;
  private audioOn = false;
  private needsContext = this.saved.lines.length > 0; // a fresh session after a page change has no memory
  private teaserOn = false;
  private teaserTimer?: ReturnType<typeof setTimeout>;

  /** Interface text in the widget's language. */
  private get t(): Strings { return strings(this.cfg.lang); }

  constructor(private cfg: PublicWidgetConfig) {
    this.host.id = HOST_ID;
    this.host.style.cssText = "all:initial;position:fixed;z-index:2147483000;right:0;bottom:0;";
    document.body.appendChild(this.host);
    this.render();
    // Multi-page sites reload the script on every page change, so a live chat or call reconnects on the next page.
    addEventListener("pagehide", () => { this.endCallSegment(); this.persistLive(); });
    // Escape minimises the panel (keyboard users); the conversation keeps going.
    this.host.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.open) { e.stopPropagation(); this.minimise(); } });
    this.scheduleTeaser();
    const r = this.saved.resume;
    if (r && Date.now() - r.ts < RESUME_WINDOW_MS) void this.connect(r.voice, { resumed: true, speak: r.agentNav });
  }

  // ---------- state ----------
  private persist(resume: Resume | null = null) {
    try { sessionStorage.setItem(STORE, JSON.stringify({ open: this.open, lines: this.lines.slice(-20), resume } satisfies Saved)); } catch { /* storage unavailable */ }
  }

  private persistLive() {
    this.persist(this.status === "live" || this.reconnecting ? { ts: Date.now(), voice: this.voiceOn, agentNav: this.agentNav } : null);
  }

  private addLine(role: Line["role"], text: string, typed = false) {
    const last = this.lines[this.lines.length - 1];
    if (!typed && last && last.role === role && !last.typed) last.text += text;
    else this.lines.push({ role, text, typed });
    this.lines = this.lines.slice(-30);
    this.persistLive();
    this.render();
  }

  /** Recent conversation for a fresh session (it has no memory). `skip` leaves out the newest lines. */
  private context(skip = 0): string {
    const recent = this.lines.slice(0, this.lines.length - skip).slice(-8).map((l) => `${l.role === "you" ? "Visitor" : "You"}: ${l.text}`).join("\n");
    return `[system] The visitor is on ${location.pathname} ("${document.title}"). Keep using the language of the conversation so far. ${recent ? `Earlier in this conversation (context only, do not repeat it):\n${recent}` : ""}`;
  }

  // ---------- connection ----------
  private async connect(withMic: boolean, opts: { resumed?: boolean; speak?: boolean } = {}): Promise<boolean> {
    const resumed = !!opts.resumed;
    this.reconnecting = resumed;
    this.error = ""; this.status = "connecting"; this.render();
    try {
      const res = await post("/api/widget/token", { key: WIDGET_KEY, mode: withMic ? "voice" : "chat", resumed });
      const body = await res.json();
      if (!res.ok) throw new WidgetError(res.status === 429 ? "busy" : res.status === 402 || res.status === 403 ? "unavailable" : "failed");
      const { Client, Speaker } = await loadLive();
      const ai = new Client({ apiKey: body.token, httpOptions: { apiVersion: "v1alpha" } });
      this.player = new Speaker();
      this.session = await ai.live.connect({
        model: body.model,
        config: {}, // prompt, tools and audio settings are locked server-side in the token
        callbacks: {
          onmessage: (m) => { void this.onMessage(m); },
          onerror: () => { this.error = this.t.connection; this.status = "error"; this.render(); },
          onclose: () => { if (this.status !== "error") { this.status = "idle"; this.teardownAudio(); this.render(); } },
        },
      });
      if (withMic) await this.startMic();
      this.status = "live";
      this.reconnecting = false;
      this.render();
      if (resumed) {
        const speak = !!opts.speak;
        const note = speak
          ? "You just moved the visitor to this page as part of the conversation. Say at most ONE short sentence about it and continue helping. Do NOT greet again."
          : "The visitor moved to this page themselves. Do NOT speak now; wait for them. Do NOT greet again.";
        this.session?.sendClientContent({ turns: [{ role: "user", parts: [{ text: `${this.context()} ${note}` }] }], turnComplete: speak });
        this.needsContext = false;
      } else if (withMic) {
        const earlier = this.lines.length > 0;
        this.send(`${earlier ? `${this.context()} ` : ""}[system] The visitor just started a voice call on ${location.pathname} ("${document.title}"). ${earlier ? "Continue the conversation; do NOT greet again." : "Greet them briefly."}`);
        this.needsContext = false;
      } else {
        this.needsContext = this.lines.length > 1; // the typed message that triggered this connect is sent next, with the earlier lines
      }
      return true;
    } catch (e) {
      this.reconnecting = false;
      this.hangup();
      const msg = e instanceof Error ? `${e.name} ${e.message}` : "";
      this.error = e instanceof WidgetError ? this.t[e.key] : /permission|denied|notallowed/i.test(msg) ? this.t.micBlocked : /fetch|network/i.test(msg) ? this.t.connection : this.t.failed;
      this.status = "error"; this.render();
      return false;
    }
  }

  private async startMic() {
    const { Mic } = await loadLive();
    this.mic = new Mic();
    await this.mic.start((data) => !this.muted && this.session?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }));
    this.audioOn = true; this.voiceOn = true;
    this.secs = 0;
    this.timer = setInterval(() => { this.secs++; this.render(); }, 1000);
    // After a page change the browser may keep audio suspended until the visitor taps once.
    await new Promise((r) => setTimeout(r, 250));
    this.needsTap = !(this.player?.running && this.mic.running);
  }

  /** Reports the seconds of voice on this page (billing). Called when a call ends or the page unloads mid-call. */
  private endCallSegment() {
    if (this.voiceOn && this.secs > 0) beacon("call_end", { secs: this.secs });
    this.secs = 0;
  }

  private teardownAudio() {
    this.endCallSegment();
    clearInterval(this.timer);
    this.mic?.stop(); this.mic = null;
    this.player?.close(); this.player = null;
    this.voiceOn = false; this.audioOn = false; this.needsTap = false; this.muted = false; this.thinking = false;
  }

  private hangup() {
    this.persist(null);
    this.teardownAudio();
    this.session?.close(); this.session = null;
    this.status = "idle";
    this.render();
  }

  private send(text: string) {
    this.session?.sendClientContent({ turns: [{ role: "user", parts: [{ text }] }], turnComplete: true });
  }

  private async sendText(raw: string) {
    const text = raw.trim().slice(0, 1000);
    if (!text) return;
    this.error = "";
    // Show the message straight away; if the assistant cannot be reached it stays visible with the error.
    this.addLine("you", text, true);
    this.thinking = true; this.render();
    if (!this.session && !(await this.connect(false))) { this.thinking = false; this.render(); return; }
    const parts = this.needsContext ? [{ text: this.context(1) }, { text }] : [{ text }];
    this.needsContext = false;
    this.session?.sendClientContent({ turns: [{ role: "user", parts }], turnComplete: true });
  }

  private async toggleVoice() {
    if (this.needsTap) { await this.player?.resume(); await this.mic?.resume(); this.needsTap = false; this.render(); return; }
    if (this.status === "connecting") return;
    if (this.voiceOn) { this.hangup(); return; }
    if (!this.session) { await this.connect(true); return; }
    try { await this.startMic(); beacon("call_start"); this.render(); } catch { this.error = this.t.micBlocked; this.render(); }
  }

  private stopTalking() {
    this.player?.interrupt();
    this.send("[system] The visitor pressed 'stop talking'. Stop immediately and stay silent until they speak. Do not announce this.");
  }

  // ---------- model messages ----------
  private async onMessage(m: LiveServerMessage) {
    const sc = m.serverContent;
    for (const p of sc?.modelTurn?.parts ?? []) if (p.inlineData?.data && this.audioOn) this.player?.play(p.inlineData.data);
    if (sc?.interrupted) this.player?.interrupt();
    if (sc?.inputTranscription?.text) this.addLine("you", sc.inputTranscription.text);
    if (sc?.outputTranscription?.text) { this.thinking = false; this.addLine("bot", sc.outputTranscription.text); }
    if (sc?.turnComplete && this.thinking) { this.thinking = false; this.render(); }
    const calls = m.toolCall?.functionCalls;
    if (calls?.length) {
      const functionResponses = await Promise.all(
        calls.map(async (c) => ({
          id: c.id,
          name: c.name,
          response: await runWidgetTool(c.name ?? "", (c.args ?? {}) as Record<string, unknown>, {
            beforeNavigate: () => { this.agentNav = true; this.persistLive(); },
            saveLead: async (lead) => {
              const res = await post("/api/widget/lead", { key: WIDGET_KEY, ...lead }).catch(() => null);
              const body = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
              return res?.ok && body?.ok ? { ok: true } : { ok: false, error: body?.error ?? "could not send the details" };
            },
          }),
        })),
      );
      this.session?.sendToolResponse({ functionResponses });
    }
  }

  // ---------- UI ----------
  // ---------- UI ----------
  /** Pop-up greeting next to the launcher, once per visit, after the configured delay. */
  private scheduleTeaser() {
    const { teaser, teaserDelay } = this.cfg;
    if (!teaser || teaserDelay <= 0 || this.open || this.lines.length) return;
    try { if (sessionStorage.getItem(`${STORE}-teased`)) return; } catch { /* storage unavailable: still show once */ }
    this.teaserTimer = setTimeout(() => {
      if (this.open) return;
      this.teaserOn = true;
      try { sessionStorage.setItem(`${STORE}-teased`, "1"); } catch { /* ignore */ }
      this.render();
    }, teaserDelay * 1000);
  }

  private openPanel() {
    this.open = true; this.teaserOn = false; clearTimeout(this.teaserTimer);
    beacon("open"); this.persistLive(); this.render();
    void loadLive().catch(() => { /* retried when the visitor sends something */ });
    this.root.getElementById("inp")?.focus();
  }

  /** Minimise: the conversation (and a running call) continues. */
  private minimise() {
    this.open = false; this.persistLive(); this.render();
    (this.root.querySelector(".fab") as HTMLElement | null)?.focus();
  }

  /** End the conversation and clear it. */
  private reset() {
    this.hangup(); this.lines = []; this.error = ""; this.persist(); this.render();
    this.root.getElementById("inp")?.focus();
  }

  private handoffLinks(): string {
    const { phone, whatsapp, email } = this.cfg.handoff;
    const links = [
      phone && `<a href="tel:${esc(phone.replace(/[^\d+]/g, ""))}">${ICONS.phone}${esc(this.t.call)}</a>`,
      whatsapp && `<a href="https://wa.me/${esc(whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener noreferrer">${ICONS.chat}${esc(this.t.whatsapp)}</a>`,
      email && `<a href="mailto:${esc(email)}">${ICONS.mail}${esc(this.t.email)}</a>`,
    ].filter(Boolean);
    return links.length ? `<div class="human"><span>${esc(this.t.talkHuman)}</span>${links.join("")}</div>` : "";
  }

  private render() {
    const { name, color, icon, greeting, position, starters, privacyUrl, showBranding } = this.cfg;
    // Re-rendering replaces the DOM: keep what the visitor is typing and where the focus is.
    const prev = this.root.getElementById("inp") as HTMLInputElement | null;
    const draft = prev?.value ?? "";
    const hadFocus = !!prev && this.root.activeElement === prev;
    const caret = prev?.selectionStart ?? draft.length;

    const live = this.status === "live";
    const busy = this.status === "connecting" && !this.voiceOn;
    const mm = `${Math.floor(this.secs / 60)}:${String(this.secs % 60).padStart(2, "0")}`;
    const t = this.t;
    // The frame stays anchored to the chosen corner; only the panel's contents flow right-to-left.
    const dir = isRtl(this.cfg.lang) ? "rtl" : "ltr";
    const hello = greeting || fill(t.greeting, name);
    const chips = !this.lines.length && starters.length
      ? `<div class="chips">${starters.map((q, i) => `<button type="button" data-q="${i}">${esc(q)}</button>`).join("")}</div>` : "";
    const legal = [
      esc(t.disclosure),
      privacyUrl && `<a href="${esc(privacyUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.privacy)}</a>`,
      showBranding && `<a href="${esc(API)}" target="_blank" rel="noopener">${esc(t.poweredBy)}</a>`,
    ].filter(Boolean).join(" · ");
    const chat = this.open ? `
      <section class="panel" role="dialog" aria-modal="false" aria-label="${esc(name)}" dir="${dir}">
        <header><span class="dot ${live ? "on" : ""}" aria-hidden="true"></span><b>${esc(name)}</b>${this.reconnecting ? `<small>${esc(t.reconnecting)}</small>` : ""}
          ${this.lines.length ? `<button data-a="reset" aria-label="${esc(t.clearConv)}" title="${esc(t.newConv)}">${ICONS.trash}</button>` : ""}
          <button data-a="close" aria-label="${esc(t.minimise)}" title="${esc(t.minimise)}">${ICONS.minus}</button></header>
        <div class="log" id="log" role="log" aria-live="polite" aria-label="${esc(t.conversation)}">
          <div class="msg bot">${esc(hello)}</div>
          ${this.lines.map((l) => `<div class="row ${l.role === "you" ? "me" : ""}"><div class="msg ${l.role === "you" ? "me" : "bot"}">${esc(l.text)}</div></div>`).join("")}
          ${this.thinking ? `<div class="msg bot dots" aria-label="${esc(t.typing)}"><i></i><i></i><i></i></div>` : ""}
          ${chips}
        </div>
        ${this.error ? `<div class="err" role="alert">${esc(this.error)}</div>` : ""}
        ${this.handoffLinks()}
        <form data-a="send">
          <button type="button" class="call ${this.voiceOn ? "live" : ""}" data-a="voice" aria-label="${esc(this.voiceOn ? t.endCall : t.startCall)}" title="${esc(this.voiceOn ? t.endCall : t.talk)}">${busy ? ICONS.spin : this.voiceOn ? ICONS.x : ICONS.headset}</button>
          <input id="inp" placeholder="${esc(t.typeHere)}" aria-label="${esc(t.typeHere)}" maxlength="1000" autocomplete="off">
          <button type="submit" aria-label="${esc(t.send)}">${busy ? ICONS.spin : ICONS.send}</button>
        </form>
        <p class="legal">${legal}</p>
      </section>` : "";
    const teaser = !this.open && this.teaserOn
      ? `<div class="teaser" dir="${dir}"><button class="tbody" data-a="open">${esc(this.cfg.teaser)}</button><button class="tx" data-a="dismiss" aria-label="${esc(t.dismiss)}">${ICONS.x}</button></div>` : "";
    const caption = !this.open && this.voiceOn && this.lines.length ? `<div class="toast" dir="${dir}" aria-live="polite">${esc(this.lines[this.lines.length - 1]!.text.slice(-200))}</div>` : "";
    const tap = this.needsTap ? `<button class="toast" dir="${dir}" data-a="voice">${esc(t.tapContinue)}</button>` : "";
    const err = !this.open && this.error ? `<div class="toast err" dir="${dir}" role="alert">${esc(this.error)}</div>` : "";
    const pill = this.voiceOn && !this.open ? `
      <div class="pill"><span class="t" aria-label="${esc(t.callTime)}">${this.status === "connecting" ? ICONS.spin : mm}</span>
        <button data-a="stoptalk" aria-label="${esc(t.stopTalking)}" title="${esc(t.stopTalking)}">${ICONS.volumeX}</button>
        <button data-a="mute" aria-label="${esc(this.muted ? t.unmute : t.mute)}" aria-pressed="${this.muted}">${this.muted ? ICONS.micOff : ICONS.mic}</button>
        <button data-a="end" class="red" aria-label="${esc(t.endCall)}">${ICONS.x}</button></div>` : "";
    const unread = !this.open && this.lines.length && !this.voiceOn ? `<span class="badge" aria-hidden="true"></span>` : "";
    this.root.innerHTML = `<style>${STYLES.replace(/__ACCENT__/g, color).replace(/__ON__/g, onColor(color))}</style>
      <div class="wrap ${position === "left" ? "left" : "right"} ${this.open ? "is-open" : ""}" lang="${esc(this.cfg.lang)}">${chat}${teaser}${tap}${caption}${err}
        <div class="bar">${pill}
          <button class="fab ${this.voiceOn ? "live" : ""}" data-a="${this.open ? "close" : "open"}" aria-expanded="${this.open}" aria-label="${esc(this.open ? t.minimise : fill(t.chatWith, name))}">${this.open ? ICONS.x : launcherIcon(icon)}${unread}</button>
        </div></div>`;
    this.bind();
    const log = this.root.getElementById("log");
    if (log) log.scrollTop = log.scrollHeight;
    const inp = this.root.getElementById("inp") as HTMLInputElement | null;
    if (inp && draft) inp.value = draft;
    if (inp && hadFocus) { inp.focus(); inp.setSelectionRange(caret, caret); }
  }

  private bind() {
    const on = (sel: string, fn: () => void) => this.root.querySelectorAll(`[data-a="${sel}"]`).forEach((el) => el.addEventListener("click", fn));
    on("open", () => this.openPanel());
    on("close", () => this.minimise());
    on("reset", () => this.reset());
    on("dismiss", () => { this.teaserOn = false; this.render(); });
    on("voice", () => { void this.toggleVoice(); });
    on("mute", () => { this.muted = !this.muted; this.render(); });
    on("stoptalk", () => this.stopTalking());
    on("end", () => this.hangup());
    this.root.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((b) =>
      b.addEventListener("click", () => { const q = this.cfg.starters[Number(b.dataset.q)]; if (q) void this.sendText(q); }));
    const form = this.root.querySelector<HTMLFormElement>('form[data-a="send"]');
    const inp = this.root.getElementById("inp") as HTMLInputElement | null;
    inp?.addEventListener("keydown", (e) => { if (e.key !== "Escape") e.stopPropagation(); }); // keep the site's shortcuts out; Esc minimises
    form?.addEventListener("submit", (e) => { e.preventDefault(); const v = inp?.value ?? ""; if (inp) inp.value = ""; void this.sendText(v); });
  }
}

async function boot() {
  if (document.getElementById(HOST_ID)) return;
  if (!WIDGET_KEY) { console.warn("[widget] missing data-key"); return; }
  try {
    const res = await post("/api/widget/config", { key: WIDGET_KEY });
    if (!res.ok) { console.warn("[widget] not available on this site"); return; }
    const cfg = (await res.json()) as PublicWidgetConfig;
    if (!/^#[0-9a-f]{6}$/i.test(cfg.color)) return; // never inject unexpected values into the stylesheet
    if (cfg.privacyUrl && !/^https?:\/\//i.test(cfg.privacyUrl)) cfg.privacyUrl = "";
    cfg.starters = Array.isArray(cfg.starters) ? cfg.starters.slice(0, 4) : [];
    cfg.handoff ??= { phone: "", whatsapp: "", email: "" };
    cfg.lang = typeof cfg.lang === "string" ? cfg.lang : "en";
    new Widget(cfg);
  } catch { /* the host site must never break because of the widget */ }
}

if (document.body) void boot();
else addEventListener("DOMContentLoaded", () => void boot());
