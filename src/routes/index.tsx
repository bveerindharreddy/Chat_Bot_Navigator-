import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { TypingLine } from "@/components/typing";
import { ClosingCta, Framework, ProductCards } from "@/components/sections";
import { Icon, NumberedCard, Orb, Reveal, SectionHead } from "@/components/ui-kit";
import { DIFFERENTIATORS, INDUSTRIES, SERVICES, SITE } from "@/lib/site";
import LeadSection from "@/components/site/LeadSection";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "TechThrust — Build Smarter. Engage Better. | AI Products & Automation",
      description: SITE.description,
      path: "/",
    }),
  component: Home,
});

function Home() {
  const { openDemo } = useDemo();
  return (
    <>
      <section className="relative -mt-16 overflow-hidden pt-16 md:-mt-18 md:pt-18">
        <div className="bg-hero absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div className="container-site relative grid items-center gap-12 py-20 md:py-28 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow">AI-first technology · UAE · Global</p>
            <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
              Build Smarter.
              <br />
              Engage Better.
              <TypingLine />
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">{SITE.description}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/products">Explore AI Products <ArrowRight /></Link>
              </Button>
              <Button variant="heroOutline" size="lg" onClick={() => openDemo()}>Book a Demo</Button>
            </div>
          </div>
          <Orb className="mx-auto hidden w-full max-w-md lg:block" />
        </div>
      </section>

      <section className="container-site py-24">
        <SectionHead eyebrow="AI Products" title="Intelligent Products. Real Business Possibilities." text="Discover AI solutions that help businesses engage customers, automate communications, and transform digital experiences." />
        <div className="mt-14"><ProductCards /></div>
      </section>

      <section className="border-y border-border bg-surface py-24">
        <div className="container-site">
          <SectionHead eyebrow="Industries" title="AI That Works for Your Industry." text="Every industry has different customer expectations and operational challenges. TechThrust helps businesses apply AI, intelligent automation, and interactive technology to address the needs that matter most." />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.name} delay={(i % 4) * 60}>
                <div className="card-premium card-hover h-full p-6">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={ind.icon} className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{ind.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ind.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead eyebrow="Services" title="Technology That Moves Business Forward." />
          <Button variant="heroOutline" asChild><Link to="/services">Explore Our Services <ArrowRight /></Link></Button>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 80}>
              <Link to="/services" hash={s.id} className="card-premium card-hover group flex h-full flex-col p-7">
                <span className="font-display text-sm font-semibold text-brand">0{i + 1}</span>
                <h3 className="mt-3 text-2xl font-semibold">{s.name}</h3>
                <p className="mt-3 flex-1 text-muted-foreground">{s.short}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface py-24">
        <div className="container-site">
          <SectionHead eyebrow="Why TechThrust?" title="We turn AI into meaningful business outcomes." text="We don't build technology for technology's sake." />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.n} delay={i * 70}><NumberedCard n={d.n} title={d.title}>{d.text}</NumberedCard></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-24">
        <SectionHead eyebrow="How We Work" title="Understand → Identify → Deliver → Evolve" text="A practical delivery framework. Actual engagement phases depend on the agreed scope of each project." />
        <div className="mt-14"><Framework /></div>
      </section>

      <LeadSection />

      <ClosingCta />
    </>
  );
}
