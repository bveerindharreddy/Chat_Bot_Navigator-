// Standalone voice + chat shopping assistant for Shopify storefronts (built to public/shopify-agent.js).
// Install: <script src="https://<your-worker>/shopify-agent.js" defer></script> in theme.liquid.
import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { MicCapture, Player } from "@/lib/voice/audio";
import { runStoreTool, type CartSummary } from "./store-tools";
import { STYLES, ICONS } from "./ui";

type Line = { role: "you" | "thrust"; text: string; typed?: boolean };
type Status = "idle" | "connecting" | "live" | "error";
type Resume = { ts: number; voice: boolean; agentNav: boolean };
type Saved = { open: boolean; lines: Line[]; resume: Resume | null };

const script = document.currentScript as HTMLScriptElement | null;
const API = script?.src ? new URL(script.src).origin : location.origin;
const ACCENT = script?.dataset.accent || "#0e7fae";
const TITLE = script?.dataset.title || "Shopping assistant";
const KEY = "techthrust-shop-agent";
const RESUME_WINDOW_MS = 60_000;

const load = (): Saved => {
  try { return { open: false, lines: [], resume: null, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch { return { open: false, lines: [], resume: null }; }
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

class Assistant {
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
  private toast: { text: string; cart?: CartSummary } | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private session: Session | null = null;
  private mic: MicCapture | null = null;
  private player: Player | null = null;
  private audioOn = false;
  private needsContext = this.saved.lines.length > 0; // a fresh session after a page change has no memory

  constructor() {
    this.host.id = "techthrust-shop-agent";
    this.host.style.cssText = "all:initial;position:fixed;z-index:2147483000;right:0;bottom:0;";
    document.body.appendChild(this.host);
    this.render();
    // The storefront is multi-page: every page change reloads the script, so remember to reconnect on the next page.
    addEventListener("pagehide", () => this.persistLive());
    const r = this.saved.resume;
    if (r && Date.now() - r.ts < RESUME_WINDOW_MS) void this.connect(r.voice, { resumed: true, speak: r.agentNav });
  }

  // ---------- state ----------
  private persist(resume: Resume | null = null) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ open: this.open, lines: this.lines.slice(-20), resume } satisfies Saved)); } catch { /* storage unavailable */ }
  }

  /** Called as the page unloads: a live chat or call should come back on the next page. */
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

  private context(): string {
    const recent = this.lines.slice(-8).map((l) => `${l.role === "you" ? "Visitor" : "You"}: ${l.text}`).join("\n");
    const lang = document.documentElement.lang || "en";
    return `[system] The visitor is on ${location.pathname} ("${document.title}"). The store language is "${lang}": keep using the language of the conversation so far (default ${lang.split("-")[0]}). ${recent ? `Earlier in this conversation (context only, do not repeat it):\n${recent}` : ""}`;
  }

  // ---------- connection ----------
  private async connect(withMic: boolean, opts: { resumed?: boolean; speak?: boolean } = {}): Promise<boolean> {
    const resumed = !!opts.resumed;
    this.reconnecting = resumed;
    this.error = ""; this.status = "connecting"; this.render();
    try {
      const res = await fetch(`${API}/api/live-token?agent=shopify`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not start the assistant");
      const ai = new GoogleGenAI({ apiKey: body.token, httpOptions: { apiVersion: "v1alpha" } });
      this.player = new Player();
      this.session = await ai.live.connect({
        model: body.model,
        config: {}, // prompt, tools and audio config are locked server-side in the token
        callbacks: {
          onmessage: (m) => { void this.onMessage(m); },
          onerror: (e) => { this.error = e.message || "Connection error"; this.status = "error"; this.render(); },
          onclose: () => { if (this.status !== "error") { this.status = "idle"; this.teardownAudio(); this.render(); } },
        },
      });
      if (withMic) await this.startMic();
      this.status = "live";
      this.reconnecting = false;
      this.render();
      if (resumed) {
        // Give the new session its memory back. If the assistant itself changed the page it says one short line;
        // if the visitor browsed on their own it stays quiet until spoken to.
        const speak = !!opts.speak;
        const note = speak
          ? "You just moved the visitor to this page as part of the conversation. Say at most ONE short sentence about it and continue helping. Do NOT greet again."
          : "The visitor moved to this page themselves. Do NOT speak now; wait for them. Do NOT greet again.";
        this.session?.sendClientContent({ turns: [{ role: "user", parts: [{ text: `${this.context()} ${note}` }] }], turnComplete: speak });
      } else if (withMic) this.send(`[system] The visitor just opened the voice assistant on ${location.pathname} ("${document.title}"). Greet them briefly.`);
      this.needsContext = false;
      return true;
    } catch (e) {
      this.reconnecting = false;
      this.hangup();
      const msg = e instanceof Error ? e.message : "Something went wrong";
      this.error = /permission|denied|notallowed/i.test(msg) ? "Microphone access was blocked." : msg;
      this.status = "error"; this.render();
      return false;
    }
  }

  private async startMic() {
    this.mic = new MicCapture();
    await this.mic.start((data) => !this.muted && this.session?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }));
    this.audioOn = true; this.voiceOn = true;
    this.secs = 0;
    this.timer = setInterval(() => { this.secs++; this.render(); }, 1000);
    // After a page change the browser may keep audio suspended until the visitor taps once.
    await new Promise((r) => setTimeout(r, 250));
    this.needsTap = !(this.player?.running && this.mic.running);
  }

  private teardownAudio() {
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
    if (!this.session && !(await this.connect(false))) return;
    this.addLine("you", text, true);
    this.thinking = true; this.render();
    const parts = this.needsContext ? [{ text: this.context() }, { text }] : [{ text }];
    this.needsContext = false;
    this.session?.sendClientContent({ turns: [{ role: "user", parts }], turnComplete: true });
  }

  private async enableVoice() {
    if (this.needsTap) { await this.player?.resume(); await this.mic?.resume(); this.needsTap = false; this.render(); return; }
    if (this.status === "connecting" || this.voiceOn) return;
    if (!this.session) { await this.connect(true); return; }
    try { await this.startMic(); this.render(); } catch { this.error = "Microphone access was blocked."; this.render(); }
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
    if (sc?.outputTranscription?.text) { this.thinking = false; this.addLine("thrust", sc.outputTranscription.text); }
    if (sc?.turnComplete && this.thinking) { this.thinking = false; this.render(); }
    const calls = m.toolCall?.functionCalls;
    if (calls?.length) {
      const functionResponses = await Promise.all(
        calls.map(async (c) => ({
          id: c.id,
          name: c.name,
          response: await runStoreTool(c.name ?? "", (c.args ?? {}) as Record<string, unknown>, {
            beforeNavigate: () => { this.agentNav = true; this.persistLive(); },
            onCart: (cart, added) => this.showToast(added ? `Added ${added}` : "Cart updated", cart),
          }),
        })),
      );
      this.session?.sendToolResponse({ functionResponses });
    }
  }

  private showToast(text: string, cart?: CartSummary) {
    this.toast = { text, cart };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toast = null; this.render(); }, 9000);
    this.render();
  }

  // ---------- UI ----------
  private render() {
    const live = this.status === "live";
    const mm = `${Math.floor(this.secs / 60)}:${String(this.secs % 60).padStart(2, "0")}`;
    const chat = this.open ? `
      <section class="panel" role="dialog" aria-label="${esc(TITLE)}">
        <header><span class="dot ${live ? "on" : ""}"></span><b>${esc(TITLE)}</b>${this.reconnecting ? `<small>Reconnecting…</small>` : ""}<button data-a="close" aria-label="Close chat">${ICONS.x}</button></header>
        <div class="log" id="log">
          ${this.lines.length === 0 ? `<div class="msg bot">Hi! Tell me what you're looking for and I'll help you find it. You can type here or tap the headset to talk.</div>` : ""}
          ${this.lines.map((l) => `<div class="row ${l.role === "you" ? "me" : ""}"><div class="msg ${l.role === "you" ? "me" : "bot"}">${esc(l.text)}</div></div>`).join("")}
          ${this.thinking ? `<div class="msg bot dots"><i></i><i></i><i></i></div>` : ""}
        </div>
        ${this.error ? `<div class="err">${esc(this.error)}</div>` : ""}
        <form data-a="send"><input id="inp" placeholder="Type your message…" aria-label="Type your message" maxlength="1000" autocomplete="off"><button type="submit" aria-label="Send message">${this.status === "connecting" ? ICONS.spin : ICONS.send}</button></form>
      </section>` : "";
    const cart = this.toast ? `
      <div class="toast"><b>${esc(this.toast.text)}</b>${this.toast.cart ? `<span>${this.toast.cart.item_count} item${this.toast.cart.item_count === 1 ? "" : "s"} · ${esc(this.toast.cart.total)}</span>` : ""}
        <div><a href="/cart">View cart</a><a href="/checkout" class="solid">Checkout</a></div></div>` : "";
    const caption = !this.open && this.voiceOn && this.lines.length ? `<div class="toast cap">${esc(this.lines[this.lines.length - 1].text.slice(-200))}</div>` : "";
    const tap = this.needsTap && !this.open ? `<div class="toast cap">Tap the headset to continue talking.</div>` : "";
    const err = !this.open && this.error ? `<div class="toast err">${esc(this.error)}</div>` : "";
    const pill = this.voiceOn ? `
      <div class="pill"><span class="t">${this.status === "connecting" ? ICONS.spin : mm}</span>
        <button data-a="stoptalk" aria-label="Stop talking" title="Stop talking">${ICONS.volumeX}</button>
        <button data-a="mute" aria-label="${this.muted ? "Unmute" : "Mute"}">${this.muted ? ICONS.micOff : ICONS.mic}</button>
        <button data-a="end" class="red" aria-label="End call">${ICONS.x}</button></div>` : "";
    this.root.innerHTML = `<style>${STYLES.replace(/__ACCENT__/g, ACCENT)}</style>
      <div class="wrap">${chat}${cart}${tap}${caption}${err}
        <div class="bar">${pill}
          ${this.open ? "" : `<button class="chat" data-a="open" aria-label="Chat with the assistant" title="Chat">${ICONS.chat}</button>`}
          <button class="fab ${this.voiceOn ? "live" : ""}" data-a="voice" aria-label="${this.needsTap ? "Tap to continue talking" : "Talk to the assistant"}">${this.needsTap ? `<span class="tap">Tap to continue</span>` : ICONS.headset}</button>
        </div></div>`;
    this.bind();
    const log = this.root.getElementById("log");
    if (log) log.scrollTop = log.scrollHeight;
  }

  private bind() {
    const on = (sel: string, fn: () => void) => this.root.querySelector(`[data-a="${sel}"]`)?.addEventListener("click", fn);
    on("open", () => { this.open = true; this.persistLive(); this.render(); });
    on("close", () => { this.hangup(); this.open = false; this.lines = []; this.persist(); this.render(); });
    on("voice", () => { void this.enableVoice(); });
    on("mute", () => { this.muted = !this.muted; this.render(); });
    on("stoptalk", () => this.stopTalking());
    on("end", () => this.hangup());
    const form = this.root.querySelector<HTMLFormElement>('form[data-a="send"]');
    const inp = this.root.getElementById("inp") as HTMLInputElement | null;
    inp?.addEventListener("keydown", (e) => e.stopPropagation()); // keep the theme's keyboard shortcuts out
    form?.addEventListener("submit", (e) => { e.preventDefault(); const v = inp?.value ?? ""; if (inp) inp.value = ""; void this.sendText(v); });
  }
}

if (!document.getElementById("techthrust-shop-agent")) {
  const boot = () => new Assistant();
  if (document.body) boot();
  else addEventListener("DOMContentLoaded", boot);
}
