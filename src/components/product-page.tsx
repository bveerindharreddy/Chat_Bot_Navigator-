import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { PageHero, Reveal, SectionHead } from "@/components/ui-kit";
import type { ProductOption } from "@/lib/site";

export function ProductHero({ eyebrow, title, text, option, demoLabel, extra }: { eyebrow: string; title: string; text: string; option: ProductOption; demoLabel: string; extra?: ReactNode }) {
  const { openDemo } = useDemo();
  return (
    <PageHero eyebrow={eyebrow} title={title} text={text}>
      <Button variant="hero" size="lg" onClick={() => openDemo(option)}>{demoLabel}</Button>
      {extra}
    </PageHero>
  );
}

export function Block({ eyebrow, title, text, children, alt }: { eyebrow?: string; title: string; text?: string; children?: ReactNode; alt?: boolean }) {
  return (
    <section className={alt ? "border-y border-border bg-surface py-20" : "py-20"}>
      <div className="container-site">
        <SectionHead eyebrow={eyebrow} title={title} text={text} />
        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  );
}

export function CardGrid({ items, cols = 3 }: { items: { title: string; text?: string }[]; cols?: 2 | 3 | 4 }) {
  const c = cols === 4 ? "lg:grid-cols-4" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${c}`}>
      {items.map((it, i) => (
        <Reveal key={it.title} delay={(i % 4) * 50}>
          <div className="card-premium card-hover h-full p-6">
            <h3 className="text-lg font-semibold">{it.title}</h3>
            {it.text && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.text}</p>}
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <li key={it} className="flex gap-2.5 rounded-xl border border-border bg-card p-4 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {it}
        </li>
      ))}
    </ul>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
      {items.map((s, i) => (
        <li key={s} className="relative rounded-2xl border border-border bg-card p-6">
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-primary/40 font-display text-sm font-semibold text-primary">{i + 1}</span>
          <p className="mt-4 font-medium">{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function ProductCta({ title, option, label, secondary }: { title: string; option: ProductOption; label: string; secondary?: ReactNode }) {
  const { openDemo } = useDemo();
  return (
    <section className="container-site py-24">
      <div className="card-premium relative overflow-hidden px-6 py-16 text-center md:py-20">
        <div className="bg-hero absolute inset-0" aria-hidden />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold md:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">Implementation scope, configuration, deployment model and pricing depend on your requirements.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" onClick={() => openDemo(option)}>{label}</Button>
            {secondary}
          </div>
        </div>
      </div>
    </section>
  );
}
