import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { PageHero, Reveal } from "@/components/ui-kit";
import { ClosingCta } from "@/components/sections";
import { SERVICES, type ProductOption } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  head: () =>
    seo({
      title: "Services — AI Automation, AI Engineering, Growth & Startup-as-a-Service | TechThrust",
      description: "AI automation, AI strategy and engineering, an AI-enabled digital growth engine, and Startup-as-a-Service from TechThrust.",
      path: "/services",
    }),
  component: Services,
});

type Svc = { id: string; headline: string; desc: string; phases: { t: string; d: string[] }[]; examples: string; closing: string; cta: string; option: ProductOption };

const DATA: Svc[] = [
  {
    id: "ai-automation", headline: "Stop Repeating Work. Start Scaling Intelligently.", option: "AI Automation",
    desc: "We transform repetitive business processes into intelligent workflows using AI agents, automation, and system integrations—giving your team more time to focus on work that matters.",
    phases: [
      { t: "Discover & Map Workflows", d: ["Process assessment and workflow mapping", "Automation opportunity and feasibility analysis", "Prioritized implementation roadmap"] },
      { t: "Design Intelligent Workflows", d: ["Workflow and automation architecture", "AI agent roles and decision logic", "Integration and exception-handling design"] },
      { t: "Build, Integrate & Deploy", d: ["AI agents and automated workflows", "CRM, communication, and business-system integrations", "Testing, deployment, and team handover"] },
      { t: "Monitor, Improve & Scale", d: ["Performance monitoring and reporting", "Workflow refinement and exception management", "Expansion into additional processes"] },
    ],
    examples: "AI calling and support agents, lead qualification, appointment scheduling, CRM updates, document processing, and internal workflow automation.",
    closing: "Your Team Should Focus on Growth, Not Repetitive Work.", cta: "Explore Automation Opportunities",
  },
  {
    id: "ai-strategy", headline: "Turn AI Possibilities into Business Reality.", option: "AI Product Requirement",
    desc: "From identifying the right AI opportunities to engineering production-ready solutions, we help businesses move from experimentation to practical implementation.",
    phases: [
      { t: "Assess Opportunities & Readiness", d: ["Business and technology assessment", "AI opportunity identification and prioritization", "Feasibility, risk, and readiness assessment"] },
      { t: "Define Strategy & Architecture", d: ["AI adoption and implementation roadmap", "Solution architecture and technology selection", "Data, integration, security, and governance considerations"] },
      { t: "Engineer & Integrate Solutions", d: ["AI applications, agents, and tailored solutions", "API, data, and enterprise-system integrations", "Testing, validation, and deployment"] },
      { t: "Validate, Adopt & Evolve", d: ["Business-outcome and performance evaluation", "Knowledge transfer and adoption support", "Continuous improvement roadmap"] },
    ],
    examples: "AI strategy, custom AI application development, enterprise AI integration, conversational AI, intelligent document processing, and AI proof-of-concept development.",
    closing: "Move Beyond AI Experiments. Build Solutions That Matter.", cta: "Discuss Your AI Initiative",
  },
  {
    id: "digital-growth", headline: "Don't Just Attract Traffic. Turn Attention into Opportunity.", option: "General Enquiry",
    desc: "Connect customer acquisition with intelligent engagement, lead qualification, and timely follow-ups to build a more connected and measurable growth process.",
    phases: [
      { t: "Diagnose Growth Gaps", d: ["Customer journey and funnel assessment", "Lead capture and follow-up gap analysis", "Audience, channel, and measurement review"] },
      { t: "Design the Growth System", d: ["Channel and campaign strategy", "Landing pages, lead capture, and CRM workflow planning", "AI-powered engagement and qualification design"] },
      { t: "Launch Acquisition & Engagement", d: ["Paid campaign and search optimization where agreed", "Lead routing, qualification, and nurture workflows", "AI calling, chat, and follow-up automation where appropriate"] },
      { t: "Measure, Learn & Optimize", d: ["Lead quality and funnel reporting", "Campaign and conversion optimization", "Continuous testing and growth recommendations"] },
    ],
    examples: "Paid acquisition, search marketing, landing-page optimization, lead-generation systems, AI-assisted lead qualification, CRM automation, and automated follow-up — delivered as a connected, AI-enabled growth system.",
    closing: "Every Lead Deserves More Than a Form Submission.", cta: "Build Your Growth Engine",
  },
  {
    id: "startup-as-a-service", headline: "From Idea to Launch — and Beyond.", option: "Startup-as-a-Service",
    desc: "A structured, phase-based journey that takes a new venture from strategy and product planning through MVP development, go-to-market readiness, and ongoing product evolution.",
    phases: [
      { t: "Strategy & Product Planning", d: ["Idea and market framing", "Product scope and priorities", "Roadmap for the first release"] },
      { t: "MVP Development", d: ["Design and build of the minimum viable product", "Core integrations", "Testing and launch preparation"] },
      { t: "Go-to-Market Readiness", d: ["Positioning and launch planning", "Digital presence and lead capture", "Initial acquisition setup where agreed"] },
      { t: "Ongoing Product Evolution", d: ["Feedback-led iteration", "Feature roadmap", "Continued technical support where agreed"] },
    ],
    examples: "Founders and new business units that need a single partner across product, technology and launch. Exact deliverables are confirmed for each engagement.",
    closing: "Turn Your Idea into a Working Business.", cta: "Discuss Your Startup",
  },
];

function Services() {
  const { openDemo } = useDemo();
  return (
    <>
      <PageHero eyebrow="Services" title="Technology That Moves Business Forward." text="Four services that complement our AI products. Each engagement is scoped to your goals — phases and deliverables vary by project." />
      <nav aria-label="Services" className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container-site flex gap-2 overflow-x-auto py-3">
          {SERVICES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary/60 hover:text-primary">{s.name}</a>
          ))}
        </div>
      </nav>
      {DATA.map((s, idx) => (
        <section key={s.id} id={s.id} className={`scroll-mt-32 py-24 ${idx % 2 ? "border-y border-border bg-surface" : ""}`}>
          <div className="container-site">
            <p className="eyebrow">0{idx + 1} · {SERVICES[idx]?.name}</p>
            <h2 className="mt-3 max-w-4xl text-balance text-3xl font-semibold md:text-5xl">{s.headline}</h2>
            <p className="mt-5 max-w-3xl text-lg text-muted-foreground">{s.desc}</p>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {s.phases.map((p, i) => (
                <Reveal key={p.t} delay={i * 60}>
                  <div className="card-premium h-full p-6">
                    <p className="font-display text-xs font-semibold tracking-widest text-primary">PHASE 0{i + 1}</p>
                    <h3 className="mt-2 text-lg font-semibold">{p.t}</h3>
                    <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                      {p.d.map((d) => <li key={d} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />{d}</li>)}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-muted-foreground"><span className="font-semibold text-foreground">Example applications: </span>{s.examples}</p>
            <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:flex-row md:items-center md:justify-between">
              <p className="font-display text-xl font-semibold">{s.closing}</p>
              <Button variant="hero" onClick={() => openDemo(s.option)}>{s.cta}</Button>
            </div>
          </div>
        </section>
      ))}
      <ClosingCta title="Let's Turn Your Next Opportunity into Action." primaryLabel="Discuss Your Requirements" secondary={false} />
    </>
  );
}
