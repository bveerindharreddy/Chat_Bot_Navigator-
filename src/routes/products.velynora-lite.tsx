import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone, Settings2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { Block, CardGrid, CheckList, ProductCta, ProductHero } from "@/components/product-page";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/products/velynora-lite")({
  head: () =>
    seo({
      title: "Velynora Lite — Automated Voice Calls & Follow-up Messaging | TechThrust",
      description: "Scheduled automated voice calls with WhatsApp or email follow-ups for reminders, announcements and routine business communications.",
      path: "/products/velynora-lite",
    }),
  component: Lite,
});

const FLOW = [
  { icon: Settings2, t: "Configure the campaign and audience" },
  { icon: Phone, t: "Automated voice call is placed as scheduled" },
  { icon: MessageCircle, t: "WhatsApp or email follow-up is sent" },
  { icon: ArrowRight, t: "Recipient is directed to the next step" },
];

function Lite() {
  const { openDemo } = useDemo();
  return (
    <>
      <ProductHero eyebrow="Velynora Lite" title="The Right Message. The Right Time. At Scale." text="A focused automated calling and follow-up messaging solution for routine business communications." option="Velynora Lite" demoLabel="Book a Velynora Lite Demo" />
      <Block eyebrow="The challenge" title="Important messages shouldn't depend on manual effort." text="When reminders, updates and follow-ups are handled manually, they can be delayed or missed — especially as volumes grow." />
      <Block alt eyebrow="How it works" title="From configuration to next step.">
        <ol className="grid gap-4 md:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.t} className="relative rounded-2xl border border-border bg-card p-6">
              <f.icon className="size-6 text-primary" aria-hidden />
              <p className="mt-4 text-xs font-semibold text-brand">STEP {i + 1}</p>
              <p className="mt-1 font-medium">{f.t}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-primary/40 p-5 text-sm text-muted-foreground">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p><span className="font-semibold text-foreground">Example (illustrative):</span> a webinar reminder call tells a registrant the session is approaching, then a follow-up message delivers the joining link.</p>
        </div>
      </Block>
      <Block eyebrow="Use cases" title="Built for routine communications."><CheckList items={["Appointment reminders", "Event and webinar reminders", "Announcements", "Customer notifications", "Follow-up communications", "Permitted outreach campaigns"]} /></Block>
      <Block alt eyebrow="Potential benefits" title="Consistency without the coordination.">
        <CardGrid cols={4} items={[
          { title: "Consistency", text: "Every recipient receives the same configured message." },
          { title: "Less manual coordination", text: "Free your team from repetitive calling and messaging." },
          { title: "Timely communication", text: "Messages go out on the schedule you set." },
          { title: "Scalable execution", text: "Run campaigns for small or large audiences." },
        ]} />
      </Block>
      <Block eyebrow="Operating model" title="Choose how you run it.">
        <CardGrid cols={2} items={[
          { title: "Self-Service Campaigns", text: "Configure and operate your campaigns using the supported platform capabilities." },
          { title: "Managed Campaign Execution", text: "TechThrust assists with campaign setup and execution within the agreed service scope." },
        ]} />
      </Block>
      <Block alt eyebrow="Responsible communication" title="Use it with consent and care." text="Contact only recipients who have given appropriate consent, provide a clear way to opt out, and follow the calling and messaging rules that apply in each recipient's country. Customers remain responsible for the lawful use of their campaigns." />
      <ProductCta title="Make Every Important Communication Count." option="Velynora Lite" label="Explore Velynora Lite"
        secondary={<Button variant="heroOutline" size="lg" onClick={() => openDemo("Velynora Lite")}>Book a Demo</Button>} />
    </>
  );
}
