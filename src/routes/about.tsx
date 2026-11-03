import { createFileRoute } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { NumberedCard, PageHero, Reveal, SectionHead } from "@/components/ui-kit";
import { ClosingCta, Framework } from "@/components/sections";
import { DIFFERENTIATORS } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About TechThrust — AI-First Technology Company in the UAE",
      description: "TechThrust is a UAE-based, AI-first technology company building practical AI products, intelligent automation and technology solutions.",
      path: "/about",
    }),
  component: About,
});

const VALUES = [
  { t: "Innovation", d: "We explore new technology with purpose, applying it where it creates real value." },
  { t: "Transparency", d: "Clear scope, honest capabilities and straightforward communication." },
  { t: "Results", d: "We measure success by practical improvements for the businesses we serve." },
  { t: "Partnership", d: "We work alongside our customers, from first conversation to ongoing evolution." },
];

function About() {
  return (
    <>
      <PageHero eyebrow="About TechThrust" title="An AI-first technology company." text="We build practical AI products, intelligent automation and technology solutions that help businesses engage customers and streamline operations. We don't build technology for technology's sake — we turn AI into meaningful business outcomes." />
      <section className="container-site grid items-center gap-10 py-24 lg:grid-cols-2">
        <SectionHead eyebrow="Global perspective" title="Based in the UAE. Serving businesses worldwide." text="TechThrust operates from the United Arab Emirates and works with customers internationally, delivering our products and services remotely to wherever our customers are." />
        <div className="card-premium flex items-center justify-center p-12" aria-hidden><Globe2 className="size-40 text-primary/70" strokeWidth={0.8} /></div>
      </section>
      <section className="border-y border-border bg-surface py-24">
        <div className="container-site">
          <SectionHead eyebrow="What makes us different" title="Four principles behind everything we do." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d) => <NumberedCard key={d.n} n={d.n} title={d.title}>{d.text}</NumberedCard>)}
          </div>
        </div>
      </section>
      <section className="container-site py-24">
        <SectionHead eyebrow="Vision & Mission" title="Technology Should Move Business Forward." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal><div className="card-premium h-full p-8"><p className="eyebrow">Vision</p><p className="mt-4 text-xl leading-relaxed">To help shape a future where intelligent technology enables businesses to operate smarter, serve customers better, and unlock new opportunities for growth.</p></div></Reveal>
          <Reveal delay={80}><div className="card-premium h-full p-8"><p className="eyebrow">Mission</p><p className="mt-4 text-xl leading-relaxed">To empower businesses through practical AI products, intelligent automation, and technology solutions that transform customer interactions, streamline operations, and deliver meaningful business impact.</p></div></Reveal>
        </div>
      </section>
      <section className="border-y border-border bg-surface py-24">
        <div className="container-site">
          <SectionHead eyebrow="Delivery framework" title="Understand → Identify → Deliver → Evolve" />
          <div className="mt-14"><Framework /></div>
        </div>
      </section>
      <section className="container-site py-24">
        <SectionHead eyebrow="Our values" title="How we work with you." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => <NumberedCard key={v.t} n={`0${i + 1}`} title={v.t}>{v.d}</NumberedCard>)}
        </div>
      </section>
      <ClosingCta primaryLabel="Talk to Our Team" secondary={false} />
    </>
  );
}
