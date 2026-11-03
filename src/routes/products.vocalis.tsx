import { createFileRoute } from "@tanstack/react-router";
import { Block, CardGrid, CheckList, ProductCta, ProductHero, Steps } from "@/components/product-page";
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
      <ProductCta title="Make Your Website More Interactive." option="VOCALIS" label="Book a Vocalis Demo" />
    </>
  );
}
