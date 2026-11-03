import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2, Loader2, Play, Presentation as PresentationIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, SectionHead } from "@/components/ui-kit";
import { SLIDES } from "@/lib/presentation/slides";
import { voiceUi } from "@/lib/voice/ui-store";
import { submitLead } from "@/lib/lead";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(40),
  website: z.string().optional(), // honeypot
});

const field = "w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export default function LeadSection() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const watch = async () => {
    await router.navigate({ to: "/presentation" });
    voiceUi.set({ presentRequest: Date.now() });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
    setBusy(true);
    const res = await submitLead({ ...parsed.data, source: "home-quick-form" });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    setSent(true);
    toast.success("Thank you! A TechThrust representative will contact you shortly.");
    form.reset();
    setTimeout(() => setSent(false), 6000);
  };

  return (
    <section id="lead" className="border-y border-border bg-surface py-24">
      <Toaster />
      <div className="container-site">
        <SectionHead eyebrow="See it. Talk to us." title="Get Your Free Growth Plan" text="Watch our presentation, narrated by our AI consultant, or leave your details and we'll reach out." />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card-premium relative flex h-full flex-col overflow-hidden p-7 md:p-8">
              <div className="bg-hero absolute inset-0" aria-hidden />
              <div className="relative flex h-full flex-col">
                <PresentationIcon className="size-9 text-primary" aria-hidden />
                <h3 className="mt-4 text-2xl font-semibold">The TechThrust Presentation</h3>
                <p className="mt-2 text-sm text-muted-foreground">Sit back while our AI consultant walks you through our products and services, slide by slide. Ask questions any time.</p>
                <ol className="mt-5 grid gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  {SLIDES.map((s, i) => (
                    <li key={s.id} className="truncate"><span className="mr-2 font-display font-semibold text-brand">{String(i + 1).padStart(2, "0")}</span>{s.title}</li>
                  ))}
                </ol>
                <div className="mt-auto flex flex-wrap gap-3 pt-7">
                  <Button variant="hero" size="lg" onClick={watch}><Play /> Start AI Presentation</Button>
                  <Button variant="heroOutline" size="lg" asChild><Link to="/presentation">Browse slides</Link></Button>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <form onSubmit={onSubmit} noValidate className="card-premium grid content-start gap-5 p-7 md:p-8">
              <h3 className="text-2xl font-semibold">Let us reach out to you</h3>
              <div>
                <label htmlFor="lead-name" className="mb-1.5 block text-sm font-medium">Name *</label>
                <input id="lead-name" name="name" autoComplete="name" placeholder="Full name" className={field} />
              </div>
              <div>
                <label htmlFor="lead-email" className="mb-1.5 block text-sm font-medium">Email ID *</label>
                <input id="lead-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" className={field} />
              </div>
              <div>
                <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-medium">Phone Number *</label>
                <input id="lead-phone" name="phone" type="tel" autoComplete="tel" placeholder="+971 ..." className={field} />
              </div>
              <div className="hidden" aria-hidden><input name="website" tabIndex={-1} autoComplete="off" /></div>
              <Button type="submit" variant="hero" size="lg" disabled={busy} className="justify-self-start">
                {busy ? <><Loader2 className="animate-spin" /> Sending…</> : sent ? <><CheckCircle2 /> Submitted</> : <>Submit <Send /></>}
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
