import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { DemoForm } from "@/components/demo";
import { ContactLinks } from "@/components/site-chrome";
import { PageHero } from "@/components/ui-kit";
import { SITE } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    seo({
      title: "Contact TechThrust — Book a Demo or Send an Enquiry",
      description: "Contact TechThrust by email, WhatsApp or the demo-booking form. Based in the UAE, serving businesses worldwide.",
      path: "/contact",
    }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk about what you're building." text="Book a demo or tell us about your requirements. We'll get back to you to discuss the right approach." />
      <section className="container-site grid gap-10 py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-6">
          <div className="card-premium p-7">
            <h2 className="text-xl font-semibold">Reach us directly</h2>
            <ContactLinks className="mt-5" />
            <p className="mt-5 inline-flex items-center gap-2.5 text-muted-foreground"><MapPin className="size-4 text-primary" aria-hidden /> {SITE.location} · Serving customers worldwide</p>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {SITE.legal}. Information you submit is used only to respond to your enquiry, as described in our Privacy Policy.
          </p>
        </div>
        <div className="card-premium p-6 md:p-9">
          <h2 className="mb-6 text-2xl font-semibold">Book a Demo</h2>
          <DemoForm />
        </div>
      </section>
    </>
  );
}
