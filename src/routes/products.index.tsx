import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { PageHero, Reveal, SectionHead } from "@/components/ui-kit";
import { ClosingCta, ProductCards } from "@/components/sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/products/")({
  head: () =>
    seo({
      title: "AI Products — Velynora, Velynora Lite & Vocalis | TechThrust",
      description: "Conversational AI agents, automated voice calls with follow-up messaging, and interactive AI-powered websites from TechThrust.",
      path: "/products",
    }),
  component: Products,
});

const DETAILS = [
  {
    name: "Velynora", to: "/products/velynora" as const, pos: "Unified Conversational AI Platform",
    text: "Build, launch, and manage conversational AI agents for customer communications and operational workflows.",
    items: ["Sales conversion and lead qualification", "Outbound campaigns", "Lead nurturing and appointment booking", "Customer support", "Customer feedback and NPS surveys", "Reception and booking", "Custom agents for business workflows"],
  },
  {
    name: "Velynora Lite", to: "/products/velynora-lite" as const, pos: "Automated Voice Calls & Follow-up Messaging",
    text: "A focused solution for routine, scheduled, one-way communications — purpose-built, not a reduced version of conversational AI.",
    items: ["Automated voice calls", "WhatsApp or email follow-up workflows", "Appointment and event reminders", "Announcements and notifications", "Follow-up campaigns", "Self-service campaign setup", "Managed campaign execution by TechThrust"],
  },
  {
    name: "Vocalis", to: "/products/vocalis" as const, pos: "AI-Powered Website Interaction Platform",
    text: "Your Website. Now It Talks, Thinks & Acts. Transform static browsing into an interactive experience with voice and text, guided navigation, discovery, recommendations, and action-oriented assistance.",
    items: ["Voice and text interaction", "Voice-directed navigation", "Product and service discovery", "Recommendations", "Appointment booking", "Human handoff"],
  },
];

const COMPARE = [
  ["Two-way conversations by voice or chat", "Velynora"],
  ["Scheduled one-way calls with follow-up messages", "Velynora Lite"],
  ["Interactive voice/text experience on your website", "Vocalis"],
];

function Products() {
  const { openDemo } = useDemo();
  return (
    <>
      <PageHero eyebrow="AI Products" title="Intelligent Products. Real Business Possibilities." text="Three purpose-built AI products, each designed for a distinct customer engagement need." />
      <section className="container-site py-20"><ProductCards /></section>
      <section className="container-site grid gap-16 pb-12">
        {DETAILS.map((d) => (
          <Reveal key={d.name}>
            <div className="grid gap-8 border-t border-border pt-12 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <p className="eyebrow">{d.pos}</p>
                <h2 className="mt-3 text-4xl font-semibold">{d.name}</h2>
                <p className="mt-4 text-lg text-muted-foreground">{d.text}</p>
                <Button variant="heroOutline" className="mt-6" asChild><Link to={d.to}>View {d.name}</Link></Button>
              </div>
              <ul className="grid content-start gap-3 sm:grid-cols-2">
                {d.items.map((it) => (
                  <li key={it} className="flex gap-2.5 rounded-xl border border-border bg-card p-4 text-sm">
                    <Check className="size-4 shrink-0 text-primary" aria-hidden /> {it}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </section>
      <section className="container-site py-20">
        <SectionHead eyebrow="Which fits?" title="Find the right product for your need." />
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          {COMPARE.map(([need, p]) => (
            <div key={p} className="flex flex-col justify-between gap-2 border-b border-border bg-card p-5 last:border-0 sm:flex-row sm:items-center">
              <span className="text-muted-foreground">If you need: <span className="text-foreground">{need}</span></span>
              <span className="font-display font-semibold text-primary">{p}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button variant="hero" size="lg" onClick={() => openDemo()}>Not Sure Which Solution Fits? Talk to Our Team.</Button>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
