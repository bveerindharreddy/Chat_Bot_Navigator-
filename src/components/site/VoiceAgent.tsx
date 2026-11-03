import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";
import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { Mic, MicOff, X, Sparkles, Loader2, PhoneOff, Headset, VolumeX, MessageSquare, SendHorizontal } from "lucide-react";
import { MicCapture, Player } from "@/lib/voice/audio";
import { runTool } from "@/lib/voice/tools";
import { SLIDES } from "@/lib/presentation/slides";
import { useVoiceUi, voiceUi } from "@/lib/voice/ui-store";
import { useDemo } from "@/components/demo";
import type { ProductOption } from "@/lib/site";

// After each slide the agent asks for questions; if the visitor stays silent this long, the next slide starts.
const QUESTION_WAIT_MS = 8000;

type Status = "idle" | "connecting" | "live" | "error";
type Line = { role: "you" | "thrust"; text: string; typed?: boolean };

export default function VoiceAgent() {
  const router = useRouter();
  const pathname = useLocation({ select: (l) => l.pathname });
  const { pitch, personalization, presentRequest, lead } = useVoiceUi();
  const { openDemo } = useDemo();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [muted, setMuted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [voiceOn, setVoiceOn] = useState(false); // microphone + spoken replies active
  const [thinking, setThinking] = useState(false);
  const audioOnRef = useRef(false); // play the model's audio? (off in text-only chat)
  const logRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  const statusRef = useRef<Status>("idle");
  statusRef.current = status;
  const session = useRef<Session | null>(null);
  const mic = useRef<MicCapture | null>(null);
  const player = useRef<Player | null>(null);
  const advTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heardSinceNarrate = useRef(false);
  const pausedRef = useRef(false); // visitor spoke mid-presentation: wait for them, do not auto-advance

  const addText = useCallback((role: Line["role"], text: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.typed) return [...prev.slice(0, -1), { role, text: last.text + text }];
      return [...prev, { role, text }].slice(-30);
    });
  }, []);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [lines, thinking, chatOpen]);

  useEffect(() => {
    if (status !== "live") { setSecs(0); return; }
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const navigate = useCallback(async (path: string) => { await router.navigate({ to: path }); }, [router]);

  // Messages starting with [system] are instructions from the website to the model, not from the visitor.
  const sendSystem = useCallback((text: string) => {
    session.current?.sendClientContent({ turns: [{ role: "user", parts: [{ text: `[system] ${text}` }] }], turnComplete: true });
  }, []);

  // --- Narrated presentation: the page drives the slides, the model narrates each one. ---
  const narrate = useCallback((i: number) => {
    const slide = SLIDES[i];
    heardSinceNarrate.current = false;
    pausedRef.current = false;
    voiceUi.set({ presentation: { active: true, index: i } });
    sendSystem(`Slide ${i + 1} of ${SLIDES.length} is now on screen: "${slide.title}" (${slide.tagline}). Narrate it in 2-3 short natural sentences, picking only the most important of these facts: ${slide.notes} Then end by asking the visitor exactly: "Do you have any questions for me?" and stop talking.`);
  }, [sendSystem]);

  const advance = useCallback(() => {
    const { active, index } = voiceUi.get().presentation;
    if (!active) return;
    if (index < SLIDES.length - 1) return narrate(index + 1);
    voiceUi.set({ presentation: { active: false, index } });
    sendSystem("That was the last slide. Wrap up warmly in two sentences, ask \"Do you have any questions for me?\", and offer to take their name, email and phone number.");
  }, [narrate, sendSystem]);

  // After the model finishes a turn and its audio has played out, move on to the next slide.
  const onTurnComplete = useCallback(() => {
    if (!voiceUi.get().presentation.active || !heardSinceNarrate.current || pausedRef.current) return;
    clearTimeout(advTimer.current);
    const check = () => {
      if (!voiceUi.get().presentation.active || pausedRef.current) return;
      if ((player.current?.remainingMs() ?? 0) > 250) { advTimer.current = setTimeout(check, 400); return; }
      // Audio finished: give the visitor time to ask a question before moving on.
      advTimer.current = setTimeout(() => {
        if (voiceUi.get().presentation.active && !pausedRef.current) advance();
      }, QUESTION_WAIT_MS);
    };
    advTimer.current = setTimeout(check, 600);
  }, [advance]);

  const beginPresentation = useCallback(async () => {
    if (location.pathname !== "/presentation") await navigate("/presentation");
    narrate(0);
  }, [navigate, narrate]);

  // Visitor pressed "stop talking": cut the audio now and keep the agent quiet until they speak.
  const stopTalking = useCallback(() => {
    clearTimeout(advTimer.current);
    pausedRef.current = true;
    player.current?.interrupt();
    sendSystem("The visitor pressed 'stop talking'. Stop immediately and stay silent until they speak. Do not announce this.");
  }, [sendSystem]);

  const hooks = useRef({ startPresentation: () => {}, stopPresentation: () => {}, resumePresentation: () => {}, openDemo: (_p?: string) => {} });
  hooks.current = {
    startPresentation: () => { setTimeout(() => { void beginPresentation(); }, 700); },
    resumePresentation: () => { setTimeout(advance, 600); },
    openDemo: (p) => openDemo(p as ProductOption | undefined),
    stopPresentation: () => { clearTimeout(advTimer.current); voiceUi.set({ presentation: { ...voiceUi.get().presentation, active: false } }); },
  };

  const handleMessage = useCallback(async (m: LiveServerMessage) => {
    for (const p of m.serverContent?.modelTurn?.parts ?? []) {
      if (p.inlineData?.data) {
        if (audioOnRef.current) player.current?.play(p.inlineData.data);
        heardSinceNarrate.current = true;
        clearTimeout(advTimer.current);
      }
    }
    if (m.serverContent?.interrupted) player.current?.interrupt();
    if (m.serverContent?.inputTranscription?.text) {
      clearTimeout(advTimer.current); // visitor is speaking: hold the slides
      if (voiceUi.get().presentation.active) pausedRef.current = true;
      addText("you", m.serverContent.inputTranscription.text);
    }
    if (m.serverContent?.outputTranscription?.text) { setThinking(false); addText("thrust", m.serverContent.outputTranscription.text); }
    if (m.serverContent?.turnComplete) { setThinking(false); onTurnComplete(); }
    if (m.toolCall?.functionCalls?.length) {
      const functionResponses = await Promise.all(
        m.toolCall.functionCalls.map(async (c) => {
          let response: Record<string, unknown>;
          try { response = await runTool(c.name ?? "", (c.args ?? {}) as Record<string, unknown>, navigate, hooks.current); }
          catch (e) { response = { ok: false, error: String(e) }; }
          return { id: c.id, name: c.name, response };
        }),
      );
      session.current?.sendToolResponse({ functionResponses });
    }
  }, [addText, navigate, onTurnComplete]);

  const stop = useCallback(() => {
    clearTimeout(advTimer.current);
    voiceUi.set({ presentation: { ...voiceUi.get().presentation, active: false } });
    mic.current?.stop(); mic.current = null;
    player.current?.close(); player.current = null;
    session.current?.close(); session.current = null;
    setStatus("idle");
    setMuted(false);
    setVoiceOn(false);
    setThinking(false);
    audioOnRef.current = false;
  }, []);

  const start = useCallback(async (greet = true, withMic = true): Promise<boolean> => {
    setError(""); setStatus("connecting");
    try {
      const res = await fetch("/api/live-token", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not start voice session");

      const ai = new GoogleGenAI({ apiKey: body.token, httpOptions: { apiVersion: "v1alpha" } });
      player.current = new Player();
      const s = await ai.live.connect({
        model: body.model,
        // Prompt, tools and audio config are locked server-side in the ephemeral token.
        config: {},
        callbacks: {
          onmessage: (m) => { void handleMessage(m); },
          onerror: (e) => { setError(e.message || "Connection error"); setStatus("error"); },
          onclose: () => setStatus((st) => (st === "error" ? st : "idle")),
        },
      });
      session.current = s;

      if (withMic) {
        mic.current = new MicCapture();
        await mic.current.start((data) =>
          !mutedRef.current && session.current?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }),
        );
        audioOnRef.current = true;
        setVoiceOn(true);
      } else {
        audioOnRef.current = false; // text-only chat: replies arrive as text, nothing is spoken
      }
      setStatus("live");
      if (greet && withMic) sendSystem(`The visitor just opened the voice assistant on page ${location.pathname}. Greet them.`);
      return true;
    } catch (e) {
      stop();
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(/permission|denied|notallowed/i.test(msg) ? "Microphone access was blocked." : msg);
      setStatus("error");
      return false;
    }
  }, [handleMessage, stop, sendSystem]);

  // Upgrade a running text chat to voice (or start voice from scratch).
  const enableVoice = useCallback(async () => {
    if (!session.current) { await start(true, true); return; }
    try {
      mic.current = new MicCapture();
      await mic.current.start((data) =>
        !mutedRef.current && session.current?.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } }),
      );
      audioOnRef.current = true;
      setVoiceOn(true);
    } catch {
      setError("Microphone access was blocked.");
    }
  }, [start]);

  // Typed message: starts a text-only session on first use.
  const sendText = useCallback(async (raw: string) => {
    const text = raw.trim().slice(0, 1000);
    if (!text) return;
    setDraft("");
    setError("");
    if (!session.current && !(await start(false, false))) return;
    clearTimeout(advTimer.current);
    if (voiceUi.get().presentation.active) pausedRef.current = true;
    setLines((prev) => [...prev, { role: "you" as const, text, typed: true }].slice(-30));
    setThinking(true);
    session.current?.sendClientContent({ turns: [{ role: "user", parts: [{ text }] }], turnComplete: true });
  }, [start]);

  const closeChat = useCallback(() => { stop(); setChatOpen(false); setLines([]); }, [stop]);

  useEffect(() => stop, [stop]);

  // "Start AI Presentation" buttons on the pages ask the widget to begin (connecting first if needed).
  useEffect(() => {
    if (!presentRequest) return;
    void (async () => {
      if (!session.current && !(await start(false, true))) return;
      await beginPresentation();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentRequest]);

  // After a lead form is submitted, the agent thanks the visitor out loud.
  useEffect(() => {
    if (!lead) return;
    voiceUi.set({ lead: null });
    const first = lead.name.trim().split(/\s+/)[0];
    const line = `Thank you so much${first ? `, ${first}` : ""}. One of our representatives from TechThrust will try to connect with you as soon as possible.`;
    if (session.current && statusRef.current === "live") {
      clearTimeout(advTimer.current);
      sendSystem(`The visitor just submitted the lead form. Say exactly this, warmly, and nothing else: "${line}"`);
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(line));
    }
  }, [lead, sendSystem]);

  const live = status === "live";

  return (
    <>
      {personalization && (
        <div data-voice-agent className="fixed top-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-3xl w-full card-premium px-6 py-4 text-center relative">
            <button aria-label="Dismiss" onClick={() => voiceUi.set({ personalization: null })} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            {(personalization.business_name || personalization.industry) && (
              <div className="font-mono text-xs uppercase tracking-widest text-primary">
                {[personalization.business_name, personalization.industry].filter(Boolean).join(" · ")}
              </div>
            )}
            <div className="mt-1 font-display text-xl md:text-2xl font-bold text-primary">{personalization.headline}</div>
            {personalization.subheadline && <p className="mt-1 text-sm text-muted-foreground">{personalization.subheadline}</p>}
          </div>
        </div>
      )}

      {pitch && (
        <div data-voice-agent className="fixed left-4 bottom-24 z-50 w-[min(24rem,calc(100vw-2rem))] card-premium p-6 shadow-2xl">
          <button aria-label="Close pitch" onClick={() => voiceUi.set({ pitch: null })} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          <div className="font-display text-xl font-bold">{pitch.title}</div>
          <p className="mt-1 text-sm text-primary">{pitch.tagline}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {pitch.bullets.map((b, i) => <li key={i} className="flex gap-2"><Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />{b}</li>)}
          </ul>
          {pitch.cta && pathname !== "/contact" && (
            <button onClick={() => { void router.navigate({ to: "/contact" }); voiceUi.set({ pitch: null }); }} className="mt-5 rounded-full bg-primary text-primary-foreground shadow-glow  px-5 py-2 text-sm">{pitch.cta}</button>
          )}
        </div>
      )}

      <div data-voice-agent className={`fixed right-4 bottom-24 z-50 flex flex-col items-end gap-2 ${pathname === "/presentation" ? "md:bottom-24" : "md:bottom-6"}`}>
        {chatOpen && (
          <div className="w-[min(23rem,calc(100vw-2rem))] card-premium shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 font-display font-bold text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${live ? "bg-green-400 animate-pulse" : "bg-muted-foreground"}`} />
                Thrust · AI Consultant
              </div>
              <button aria-label="Close chat" onClick={closeChat} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div ref={logRef} className="h-72 overflow-y-auto px-4 py-3 space-y-2.5 text-sm">
              {lines.length === 0 && (
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 max-w-[85%]">Hi! I'm Thrust. Ask me about our services, or tell me about your business. You can type here or tap the mic to talk.</div>
              )}
              {lines.map((l, i) => (
                <div key={i} className={`flex ${l.role === "you" ? "justify-end" : "justify-start"}`}>
                  <div className={`px-3.5 py-2.5 max-w-[85%] rounded-2xl whitespace-pre-wrap ${l.role === "you" ? "rounded-br-sm bg-primary/15" : "rounded-bl-sm bg-muted"}`}>{l.text}</div>
                </div>
              ))}
              {thinking && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div></div>}
            </div>
            {error && <div className="px-4 pb-2 text-xs text-red-400">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); void sendText(draft); }} className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message…"
                aria-label="Type your message"
                maxLength={1000}
                autoComplete="off"
                className="flex-1 min-w-0 border border-border bg-card/90 backdrop-blur rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60"
              />
              <button type="submit" aria-label="Send message" disabled={!draft.trim() || status === "connecting"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-40">
                {status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </form>
          </div>
        )}
        {!chatOpen && voiceOn && lines.length > 0 && (
          <div className="max-w-[min(20rem,calc(100vw-2rem))] border border-border bg-card/90 backdrop-blur rounded-2xl px-4 py-3 text-sm shadow-xl">
            {lines.slice(-2).map((l, i) => (
              <p key={i} className={l.role === "you" ? "text-muted-foreground" : ""}>{l.text.slice(-220)}</p>
            ))}
          </div>
        )}
        {!chatOpen && error && (
          <div className="max-w-[min(20rem,calc(100vw-2rem))] border border-border bg-card/90 backdrop-blur rounded-2xl px-4 py-3 text-sm text-red-400 shadow-xl">{error}</div>
        )}
        <div className="flex items-center gap-3">
          {voiceOn && (
            <div className="flex items-center gap-3 rounded-full border border-border bg-card/90 backdrop-blur pl-4 pr-2 py-2 shadow-xl">
              <span className="font-mono text-xs tabular-nums text-muted-foreground w-10">
                {status === "connecting" ? <Loader2 className="h-4 w-4 animate-spin" /> : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}
              </span>
              <button aria-label="Stop talking" title="Stop talking" onClick={stopTalking} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur hover:border-primary/50">
                <VolumeX className="h-4 w-4" />
              </button>
              <button aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur hover:border-primary/50">
                {muted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
              </button>
              <button aria-label="End call" onClick={stop} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500">
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>
          )}
          {!chatOpen && (
            <button aria-label="Chat with Thrust" title="Chat" onClick={() => setChatOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur shadow-xl hover:border-primary/50">
              <MessageSquare className="h-5 w-5" />
            </button>
          )}
          <button
            aria-label="Talk to Thrust, our AI consultant"
            onClick={() => { if (status === "connecting" || voiceOn) return; void enableVoice(); }}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow ${voiceOn ? "ring-4 ring-primary/40" : " "}`}
          >
            <Headset className="h-7 w-7" />
            {voiceOn && <span className="absolute inset-0 rounded-full ring-2 ring-primary/60 animate-ping" />}
          </button>
        </div>
      </div>
    </>
  );
}
