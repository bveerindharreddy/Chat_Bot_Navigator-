import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Block, CardGrid, CheckList, ProductCta, ProductHero, Steps } from "@/components/product-page";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/demo";
import { creditMeaning, PLANS } from "@/lib/widget/plans";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/products/vocalis")({
  head: () =>
    seo({
      title: "Vocalis — AI-Powered Website Interaction Platform | TechThrust",
      description: "Your Website. Now It Talks, Thinks & Acts. Voice and text interaction, guided navigation, recommendations and booking on your website.",
      path: "/products/vocalis",
    }),
  component: Vocalis,
});

const INDUSTRY = [
  { title: "E-commerce & Retail", text: "Product discovery, recommendations, guided shopping, and customer enquiries." },
  { title: "Healthcare & Clinics", text: "Service discovery, appointment booking, and routine enquiries." },
  { title: "Real Estate", text: "Property discovery, listing navigation, and enquiry capture." },
  { title: "Hospitality & Travel", text: "Guest enquiries, service discovery, and booking assistance." },
  { title: "Education & EdTech", text: "Course discovery, program recommendations, admissions enquiries, and appointment booking." },
  { title: "Consulting & Professional Services", text: "Service discovery, expertise exploration, enquiry qualification, and consultation booking." },
  { title: "Coaching & Training", text: "Program discovery, course recommendations, enrollment enquiries, and session booking." },
  { title: "B2B & Enterprise", text: "Solution discovery, interactive presentations, lead qualification, and meeting booking." },
];

function Vocalis() {
  return (
    <>
      <ProductHero eyebrow="Vocalis · AI-Powered Website Interaction Platform" title="Your Website. Now It Talks, Thinks & Acts." text="Transform your website into an interactive experience where visitors can speak or type, navigate naturally, discover relevant products and services, receive recommendations, book appointments, and connect with your team." option="VOCALIS" demoLabel="Book a Vocalis Demo" />
      <Block eyebrow="The challenge" title="Finding the next step isn't always easy." text="On many websites, visitors have to search through menus and pages to find what's relevant to them. Vocalis gives them a more direct way to explore — more than a chatbot, it's an interactive website experience." />
      <Block alt eyebrow="How it works" title="The visitor journey."><Steps items={["Speak or type", "Navigate using supported interaction", "Discover relevant products and services", "Receive contextual recommendations", "Book an appointment where supported", "Connect with a human where appropriate"]} /></Block>
      <Block eyebrow="Core capabilities" title="What Vocalis can do."><CheckList items={["Voice interaction", "Text interaction", "Voice-directed website navigation", "Product and service discovery", "Recommendations", "Interactive presentations", "Appointment booking", "Human handoff", "Shopify deployment", "WooCommerce deployment", "Custom/cloned voice options", "Support for 80+ languages"]} /></Block>
      <Block alt eyebrow="Industry applications" title="Interactive experiences across industries."><CardGrid items={INDUSTRY} cols={4} /></Block>
      <Block eyebrow="Deployment and configuration" title="Shopify, WooCommerce and beyond." text="Vocalis supports deployment on Shopify and WooCommerce. Configuration covers content, voice, language and the actions visitors can take. Compatibility with specific themes, plugins or custom website architectures is assessed during a demo — talk to us about your website." />
      <Block alt eyebrow="Languages and voice" title="Speak your visitors' language." text="Vocalis supports interaction in 80+ languages, with custom and cloned voice options so the experience can reflect your brand." />
      <Block eyebrow="Set up in minutes" title="One line of code. No developer time after that." text="We configure your assistant (knowledge, look, language, lead routing) and send your developer a single line to paste into the website. Changes after that are made centrally; the code never changes.">
        <Steps items={["We build your assistant from your website", "You approve the look and the answers", "Your developer pastes one line of code", "Visitors start chatting and calling", "Leads arrive in your inbox or CRM"]} />
        <p className="mt-6 text-sm text-muted-foreground">
          Works on WordPress, Shopify, WooCommerce, Wix, Squarespace, Webflow, Google Tag Manager and custom sites. <Link to="/docs/vocalis" className="font-medium text-primary hover:underline">Read the install guide</Link>.
        </p>
      </Block>
      <Pricing />
      <ProductCta title="Make Your Website More Interactive." option="VOCALIS" label="Book a Vocalis Demo" />
    </>
  );
}

function Pricing() {
  const { openDemo } = useDemo();
  return (
    <Block alt eyebrow="Plans" title="Simple plans that grow with you." text="Every plan includes chat and voice. Usage is measured in credits, so you only pay for conversations that happen. Extra credits can be added any time.">
      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={cn("card-premium flex flex-col p-7", p.highlight && "ring-2 ring-primary")}>
            {p.highlight && <span className="mb-3 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Most popular</span>}
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.for}</p>
            <p className="mt-5 text-3xl font-semibold">{p.price ?? "Custom quote"}{p.price && p.period && <span className="text-base font-normal text-muted-foreground"> {p.period}</span>}</p>
            <p className="mt-2 text-sm"><span className="font-semibold">{p.credits.toLocaleString("en-US")} credits / month</span> · {p.websites}</p>
            <p className="text-xs text-muted-foreground">{creditMeaning(p.credits)}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{f}</li>)}
            </ul>
            <div className="mt-auto pt-7">
              <Button className="w-full" variant={p.highlight ? "hero" : "heroOutline"} onClick={() => openDemo("VOCALIS")}>{p.price ? `Start with ${p.name}` : "Get a quote"}</Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">A credit covers one chat conversation or half a minute of voice. Unused credits stay on your balance. Prices exclude VAT where applicable.</p>
    </Block>
  );
}
