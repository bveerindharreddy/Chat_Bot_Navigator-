import { createFileRoute } from "@tanstack/react-router";
import { Block, CardGrid, CheckList, ProductCta, ProductHero } from "@/components/product-page";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/products/velynora")({
  head: () =>
    seo({
      title: "Velynora — Unified Conversational AI Platform | TechThrust",
      description: "Build, launch and manage voice and chat AI agents for sales, outbound campaigns, support, reception, booking and feedback.",
      path: "/products/velynora",
    }),
  component: Velynora,
});

const OUTCOMES = ["Sales conversion", "Lead qualification and nurturing", "Appointment booking", "Customer support", "Reception and call routing", "Customer feedback and NPS", "Outbound announcements and campaigns", "Custom agents for suitable workflows"];

const AGENTS = [
  { title: "Sales Conversion Agent", text: "Engages interested prospects, answers questions and guides them toward the next commercial step." },
  { title: "Outbound Campaign Agent", text: "Runs configured outbound calls for announcements, offers and campaign outreach." },
  { title: "Lead Nurture & Appointment Agent", text: "Follows up with leads, qualifies interest and books appointments." },
  { title: "Customer Support Agent", text: "Handles routine customer questions and hands complex cases to your team." },
  { title: "Customer Feedback & NPS Agent", text: "Collects structured feedback and satisfaction scores after interactions." },
  { title: "Reception & Booking Agent", text: "Answers incoming calls, routes callers and manages bookings." },
  { title: "Custom Agent", text: "Configured around a specific workflow that fits your business." },
];

const CAPS = ["Agent creation and configuration", "Multilingual voice agents", "Voice library and custom/cloned voice options", "Product and service training", "Outbound campaign configuration", "Phone-number options and supported integrations", "Call recording", "Human handoff with conversation context, where supported", "Call and campaign monitoring", "Analytics, call logs and recordings", "Self-analysis and correction workflows, where supported", "API and webhook access", "CRM integrations, where available", "Cloud and on-premises deployment options, where applicable"];

function Velynora() {
  return (
    <>
      <ProductHero eyebrow="Velynora · Your Agents Are Always On." title="Turn Customer Conversations into Business Action." text="Velynora is a conversational AI and automation platform for building and managing voice and chat agents across sales, support and operations." option="Velynora" demoLabel="Book a Velynora Demo" />
      <Block eyebrow="Business outcomes" title="Where Velynora helps."><CheckList items={OUTCOMES} /></Block>
      <Block alt eyebrow="Purpose-built agents" title="Agents designed for specific responsibilities."><CardGrid items={AGENTS} cols={4} /></Block>
      <Block eyebrow="Platform capabilities" title="Configure, train and run your agents." text="Available capabilities vary by plan, configuration and deployment — not every feature is included in every setup."><CheckList items={CAPS} /></Block>
      <Block alt eyebrow="Visibility and control" title="See what your agents are doing.">
        <CardGrid cols={3} items={[
          { title: "Monitor activity", text: "Follow call and campaign activity as it happens, according to your configuration." },
          { title: "Inspect records", text: "Review call logs, recordings and conversation details." },
          { title: "Manage handoffs", text: "Route conversations to your team with context, where supported." },
        ]} />
      </Block>
      <Block eyebrow="Integrations and deployment" title="Fits into how you already work." text="Velynora offers API and webhook access, supported phone-number options and CRM integrations where available. Integrations are configured per customer — none are assumed to be connected by default. Cloud and on-premises deployment can be discussed where applicable." />
      <Block alt eyebrow="Getting started" title="Scoped around your requirements." text="Implementation scope, configuration, deployment model and pricing depend on your requirements. We start by understanding your goals, then propose the right setup." />
      <ProductCta title="See What Velynora Can Do for Your Business." option="Velynora" label="Book a Velynora Demo" />
    </>
  );
}
