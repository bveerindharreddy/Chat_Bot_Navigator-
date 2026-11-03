import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { Reveal } from "@/components/ui-kit";
import { FRAMEWORK, PRODUCTS } from "@/lib/site";

export function ProductCards() {
  const { openDemo } = useDemo();
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {PRODUCTS.map((p, i) => (
        <Reveal key={p.slug} delay={i * 80}>
          <article className="card-premium card-hover flex h-full flex-col p-7 md:p-8">
            <p className="eyebrow">{p.positioning}</p>
            <h3 className="mt-3 text-3xl font-semibold">{p.name}</h3>
            <p className="mt-5 text-sm font-semibold text-foreground">The challenge</p>
            <p className="mt-1.5 text-muted-foreground">{p.problem}</p>
            <p className="mt-5 text-sm font-semibold text-foreground">What it does</p>
            <p className="mt-1.5 flex-1 text-muted-foreground">{p.capabilities}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="hero" onClick={() => openDemo(p.option)}>{p.demoLabel}</Button>
              <Button variant="heroOutline" asChild>
                <Link to={p.to}>Learn more <ArrowRight /></Link>
              </Button>
            </div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

export function Framework() {
  return (
    <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {FRAMEWORK.map((f, i) => (
        <li key={f.title} className="relative border-t-2 border-primary/30 pt-6">
          <span className="absolute -top-[7px] left-0 size-3 rounded-full bg-primary" aria-hidden />
          <p className="font-display text-sm font-semibold text-brand">0{i + 1}</p>
          <h3 className="mt-2 text-2xl font-semibold">{f.title}</h3>
          <p className="mt-2 text-muted-foreground">{f.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function ClosingCta({ title = "Let's Build What's Next.", secondary = true, primaryLabel = "Book a Demo" }: { title?: string; secondary?: boolean; primaryLabel?: string }) {
  const { openDemo } = useDemo();
  return (
    <section className="container-site py-24">
      <div className="card-premium relative overflow-hidden px-6 py-16 text-center md:px-16 md:py-20">
        <div className="bg-hero absolute inset-0" aria-hidden />
        <div className="relative">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold md:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Tell us what you're trying to achieve. We'll discuss the right approach for your business.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" onClick={() => openDemo()}>{primaryLabel}</Button>
            {secondary && (
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

