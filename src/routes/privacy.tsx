import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal";
import { SITE } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => seo({ title: "Privacy Policy | TechThrust", description: "How TechThrust Digital Solutions FZC collects and uses information submitted through this website.", path: "/privacy" }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <section><h2>Who we are</h2><p>This website is operated by {SITE.legal} ("TechThrust"), based in the {SITE.location}. Contact: {SITE.email}.</p></section>
      <section><h2>Information we collect</h2><p>When you submit the demo or contact form, we collect your name, email, phone/WhatsApp number, company, product of interest and any information you choose to provide. If you accept analytics cookies, we collect usage data such as pages visited and device information.</p></section>
      <section><h2>How we use it</h2><p>We use form submissions to respond to your enquiry, arrange demos and discuss our products and services. Analytics data helps us understand and improve the website.</p></section>
      <section><h2>Third-party services</h2><p>We use hosting and database providers to store submissions, an email service to notify our team of new enquiries, and — only with your consent — Google Analytics. WhatsApp and email links open services operated by their respective providers. [Business to confirm the final list of processors.]</p></section>
      <section><h2>Cookies and analytics</h2><p>Analytics cookies are only set after you accept them in the consent banner. You can change your choice by clearing your browser's site data.</p></section>
      <section><h2>Retention</h2><p>We keep enquiry data only as long as needed for the purposes above. [Business to specify retention periods.]</p></section>
      <section><h2>Your choices</h2><p>You may request access to, correction of, or deletion of your information by emailing {SITE.email}.</p></section>
      <section><h2>Changes</h2><p>We may update this policy. The latest version will always be available on this page.</p></section>
    </LegalPage>
  ),
});
