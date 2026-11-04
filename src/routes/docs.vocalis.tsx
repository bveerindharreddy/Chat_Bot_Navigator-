import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { PageHero } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/docs/vocalis")({
  head: () =>
    seo({
      title: "Install the Vocalis assistant on your website | TechThrust",
      description: "Add the Vocalis voice and chat assistant to any website with one line of code: WordPress, Shopify, Wix, Squarespace, Webflow, Google Tag Manager and custom sites.",
      path: "/docs/vocalis",
    }),
  component: Docs,
});

const PLATFORMS: { name: string; steps: string }[] = [
  { name: "WordPress", steps: "Install a header/footer code plugin (for example WPCode), add a new snippet in the Footer location, paste the line and save. Or paste it just before </body> in your theme's footer.php (child theme)." },
  { name: "Shopify", steps: "Online Store › Themes › … › Edit code › layout/theme.liquid. Paste the line just before </body> and save." },
  { name: "WooCommerce", steps: "Same as WordPress: add it site-wide in the footer with a code snippet plugin or your child theme." },
  { name: "Wix", steps: "Settings › Custom code › Add custom code. Paste the line, choose All pages, place it in Body - end, then publish." },
  { name: "Squarespace", steps: "Settings › Advanced › Code injection › Footer. Paste the line and save (requires a plan with code injection)." },
  { name: "Webflow", steps: "Site settings › Custom code › Footer code. Paste the line, save and publish the site." },
  { name: "Google Tag Manager", steps: "New tag › Custom HTML. Paste the line, set the trigger to All Pages (or Initialization – All Pages), save and publish the container." },
  { name: "React, Next.js and other apps", steps: "Add the script once in your root layout or index.html, not inside a component that re-mounts. With Next.js use next/script with strategy=\"afterInteractive\" and the same src and data-key attributes." },
];

function Docs() {
  const [host, setHost] = useState("https://YOUR-TECHTHRUST-HOST");
  useEffect(() => setHost(location.origin), []);
  const snippet = `<script src="${host}/widget.js" data-key="YOUR-WIDGET-KEY" defer></script>`;
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(snippet).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <>
      <PageHero eyebrow="Vocalis · Install guide" title="Add your assistant in two minutes." text="Everything your developer needs: one line of code, where to put it on every major platform, requirements and troubleshooting." />
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm text-muted-foreground">
            {[["install", "1. Install"], ["platforms", "2. Platforms"], ["check", "3. Check it works"], ["requirements", "Requirements"], ["troubleshooting", "Troubleshooting"], ["privacy", "Privacy & data"], ["performance", "Performance & accessibility"]].map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="hover:text-foreground">{label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 max-w-3xl space-y-14">
          <Section id="install" title="1. Paste one line on every page">
            <p>Your provider sends you a line like the one below with your own <code>data-key</code>. Paste it just before the closing <code>&lt;/body&gt;</code> tag, site-wide, so the assistant is available on every page.</p>
            <div className="relative mt-4">
              <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 pr-24 text-sm"><code className="whitespace-pre-wrap break-all">{snippet}</code></pre>
              <button type="button" onClick={copy} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}{copied ? "Copied" : "Copy"}
              </button>
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5">
              <li>The key only works on the website it was issued for (both <code>www</code> and non-<code>www</code>). Staging or extra domains are added by your provider.</li>
              <li>Name, colours, greeting, answers and lead routing are managed centrally. You never need to change the code again.</li>
            </ul>
          </Section>

          <Section id="platforms" title="2. Where to paste it">
            <dl className="divide-y divide-border rounded-xl border border-border">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="grid gap-1 p-4 sm:grid-cols-[11rem_1fr] sm:gap-4">
                  <dt className="font-semibold">{p.name}</dt>
                  <dd className="text-muted-foreground">{p.steps}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="check" title="3. Check it works">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open your live website in a private window. The assistant button appears in the bottom corner within a second or two.</li>
              <li>Open it and type a question. Then tap the headset and talk (allow the microphone when the browser asks).</li>
              <li>Ask it to show you a page, for example “take me to your contact page”. It should open it for you.</li>
            </ol>
          </Section>

          <Section id="requirements" title="Requirements">
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>HTTPS</strong> for voice: browsers only allow the microphone on secure pages. Chat works either way.</li>
              <li>Current versions of Chrome, Edge, Safari and Firefox, on desktop and mobile.</li>
              <li>If your site sends a <code>Permissions-Policy</code> header, it must not block the microphone (for example <code>microphone=()</code>), or voice is disabled.</li>
              <li>If your site uses a <strong>Content-Security-Policy</strong>, ask your provider for the exact domains to allow for scripts and connections before going live.</li>
            </ul>
          </Section>

          <Section id="troubleshooting" title="Troubleshooting">
            <dl className="space-y-4">
              <Q q="The button does not appear.">Check the line is in the page source on the live site, with your exact <code>data-key</code>. Open the browser console: the message “not available on this site” means the domain is not registered for this key, or the assistant is paused. Your provider can check both in seconds.</Q>
              <Q q="It works on www but not on another domain or staging.">Each key is locked to specific domains. Ask your provider to add the other domain.</Q>
              <Q q="Voice does not start.">Make sure the page is on HTTPS, the browser has microphone permission for your site, and no Permissions-Policy blocks the microphone. On phones, tap the headset again if the browser paused audio after a page change.</Q>
              <Q q="It conflicts with my theme.">The assistant renders in an isolated layer (Shadow DOM), so your styles cannot change it and it cannot change your site. If another floating button sits in the same corner, your provider can move the assistant to the other side.</Q>
            </dl>
          </Section>

          <Section id="privacy" title="Privacy & data">
            <ul className="list-disc space-y-1 pl-5">
              <li>No cookies and no tracking. The widget keeps the open conversation in the browser's session storage so it survives page changes; it is cleared when the tab closes.</li>
              <li>Messages are processed by AI in real time to answer the visitor. Chat transcripts are not stored on our servers.</li>
              <li>The microphone is used only after the visitor taps the call button, and only while the call is active.</li>
              <li>Contact details are saved only when the visitor shares them and confirms. They go to you (console, export or your CRM webhook) and can be deleted on request.</li>
              <li>Every chat shows a short notice that the visitor is talking to an AI assistant, with a link to your privacy policy. We recommend mentioning the assistant in your privacy policy too.</li>
            </ul>
          </Section>

          <Section id="performance" title="Performance & accessibility">
            <ul className="list-disc space-y-1 pl-5">
              <li>The script is about 10 KB compressed and loads with <code>defer</code>, so it does not block your page. The voice component (about 70 KB) loads only when a visitor opens the chat.</li>
              <li>Keyboard and screen-reader friendly: focus moves into the chat, <kbd>Esc</kbd> minimises it, new messages are announced, and animations respect “reduce motion”.</li>
              <li>On phones the chat opens full screen.</li>
            </ul>
          </Section>

          <p className="text-sm text-muted-foreground">Need a hand? <Link to="/contact" className="font-medium text-primary hover:underline">Contact us</Link> and we will install it with you.</p>
        </div>
      </div>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 leading-relaxed">
      <h2 id={`${id}-h`} className="mb-4 text-2xl font-semibold">{title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}

function Q({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{q}</dt>
      <dd className="mt-1 text-muted-foreground">{children}</dd>
    </div>
  );
}
