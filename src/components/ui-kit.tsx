import { useEffect, useRef, useState, type ReactNode } from "react";
import { Briefcase, Building2, GraduationCap, Network, Plane, ShoppingBag, Sparkles, Stethoscope, Users, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Briefcase, Building2, GraduationCap, Network, Plane, ShoppingBag, Stethoscope, Users };
import { cn } from "@/lib/utils";

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setV(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-visible={v} className={cn("reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SectionHead({ eyebrow, title, text, center }: { eyebrow?: string | undefined; title: string; text?: string | undefined; center?: boolean }) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight md:text-5xl">{title}</h2>
      {text && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{text}</p>}
    </div>
  );
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} aria-hidden />;
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-hero absolute inset-0" aria-hidden />
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="container-site relative py-20 md:py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] md:text-6xl">{title}</h1>
        {text && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{text}</p>}
        {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

/** Abstract decorative orb — clearly not a product UI. */
export function Orb({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative aspect-square", className)} aria-hidden>
      <div className="absolute inset-0 rounded-full border border-primary/20" />
      <div className="orbit absolute inset-[8%] rounded-full border border-dashed border-primary/25">
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-primary shadow-glow" />
      </div>
      <div className="orbit absolute inset-[22%] rounded-full border border-border [animation-direction:reverse] [animation-duration:28s]">
        <span className="absolute top-1/2 -right-1 size-2 rounded-full bg-brand" />
      </div>
      <div className="absolute inset-[36%] rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute inset-[40%] rounded-full border border-primary/40 bg-card" />
    </div>
  );
}

export function NumberedCard({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="card-premium card-hover h-full p-7">
      <span className="font-display text-sm font-semibold text-brand">{n}</span>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <div className="mt-3 leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
