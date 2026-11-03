import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play, Sparkles, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import SlideVisual from "@/components/site/SlideVisual";
import { SLIDES } from "@/lib/presentation/slides";
import { useVoiceUi, voiceUi } from "@/lib/voice/ui-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/presentation")({
  head: () => seo({ title: "TechThrust Company Presentation", description: "An interactive, slide-by-slide introduction to TechThrust, its AI products and services, narrated by our AI consultant.", path: "/presentation" }),
  component: PresentationPage,
});

const n = SLIDES.length;

function PresentationPage() {
  const { presentation } = useVoiceUi();
  const { openDemo } = useDemo();
  const ref = useRef<HTMLDivElement>(null);
  const i = presentation.index;
  const slide = SLIDES[i]!;

  // The slide index lives in the shared store so the voice agent can drive it as well.
  const go = useCallback((to: number) => voiceUi.set({ presentation: { ...voiceUi.get().presentation, index: Math.max(0, Math.min(n - 1, to)) } }), []);
  const step = useCallback((d: number) => go(voiceUi.get().presentation.index + d), [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,[role=dialog]")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") step(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") step(-1);
      if (e.key === "Home") go(0);
      if (e.key === "End") go(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen?.();
  };

  return (
    <div ref={ref} className="flex min-h-screen flex-col bg-background">
      <div className="container-site flex h-16 items-center justify-between gap-3">
        <span className="font-display font-semibold">Tech<span className="text-primary">Thrust</span> · Presentation</span>
        <div className="flex items-center gap-2">
          {presentation.active ? (
            <Button variant="heroOutline" size="sm" onClick={() => voiceUi.set({ presentation: { ...presentation, active: false } })}><Square /> Stop narration</Button>
          ) : (
            <Button variant="hero" size="sm" onClick={() => voiceUi.set({ presentRequest: Date.now() })}><Play /> Start AI narration</Button>
          )}
          <button type="button" onClick={fullscreen} aria-label="Toggle fullscreen" className="hidden size-10 items-center justify-center rounded-full border border-border hover:text-primary md:inline-flex"><Maximize2 className="size-4" /></button>
          <Link to="/" aria-label="Exit presentation" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm hover:text-primary"><X className="size-4" /> Exit</Link>
        </div>
      </div>

      <div className="container-site flex flex-1 items-center py-4">
        <section aria-roledescription="slide" aria-label={`Slide ${i + 1} of ${n}`} className="card-premium relative w-full overflow-hidden p-6 md:min-h-[30rem] md:p-12">
          <div className="bg-hero absolute inset-0" aria-hidden />
          <div key={slide.id} className="relative animate-in fade-in duration-500">
            <p className="eyebrow">{slide.kicker}</p>
            <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight md:text-5xl">{slide.title}</h1>
            <p className="mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">{slide.tagline}</p>
            <div className={`mt-8 grid items-start gap-8 ${slide.visuals ? "lg:grid-cols-[1fr_1.2fr]" : ""}`}>
              <ul className={`grid gap-y-3 text-base ${slide.visuals ? "" : "gap-x-8 md:grid-cols-2"}`}>
                {slide.bullets.map((b) => (
                  <li key={b} className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />{b}</li>
                ))}
              </ul>
              {slide.visuals && <div className="space-y-4">{slide.visuals.map((v, k) => <SlideVisual key={k} v={v} />)}</div>}
            </div>
            {slide.id === "next" && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="hero" size="lg" onClick={() => openDemo()}>Book a Demo</Button>
                <Button variant="heroOutline" size="lg" asChild><Link to="/contact">Contact Us</Link></Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="container-site pb-6">
        <div className="h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1} aria-label="Presentation progress">
          <div className="h-full bg-primary transition-all" style={{ width: `${((i + 1) / n) * 100}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="heroOutline" onClick={() => step(-1)} disabled={i === 0} aria-label="Previous slide"><ChevronLeft /> Previous</Button>
          <div className="hidden flex-wrap justify-center gap-2 sm:flex">
            {SLIDES.map((s, k) => (
              <button key={s.id} aria-label={`Slide ${k + 1}: ${s.title}`} onClick={() => go(k)} className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`} />
            ))}
          </div>
          <span className="text-sm text-muted-foreground sm:hidden" aria-live="polite">{i + 1} / {n}</span>
          <Button variant="hero" onClick={() => step(1)} disabled={i === n - 1} aria-label="Next slide">Next <ChevronRight /></Button>
        </div>
      </div>
    </div>
  );
}
