import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal";
import { SITE } from "@/lib/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => seo({ title: "Terms of Service | TechThrust", description: "Terms governing use of the TechThrust website operated by TechThrust Digital Solutions FZC.", path: "/terms" }),
  component: () => (
    <LegalPage title="Terms of Service">
      <section><h2>About these terms</h2><p>These terms govern your use of this website, operated by {SITE.legal}. By using the website, you agree to them.</p></section>
      <section><h2>Website content</h2><p>Content on this website is provided for general information about TechThrust's products and services. It does not constitute an offer or a binding commitment. Product capabilities, availability, configuration and pricing are confirmed only in a written agreement.</p></section>
      <section><h2>Products and services</h2><p>Use of Velynora, Velynora Lite, Vocalis or any TechThrust service is governed by separate agreements. [Business to supply commercial terms.]</p></section>
      <section><h2>Acceptable use</h2><p>You agree not to misuse the website, attempt unauthorized access, or submit false or unlawful information.</p></section>
      <section><h2>Intellectual property</h2><p>The TechThrust name, product names and website content belong to {SITE.legal} or its licensors.</p></section>
      <section><h2>Limitation of liability</h2><p>The website is provided "as is". To the extent permitted by law, TechThrust is not liable for losses arising from use of the website. [Subject to legal review.]</p></section>
      <section><h2>Governing law</h2><p>[Business to confirm governing law and jurisdiction with legal counsel.]</p></section>
      <section><h2>Contact</h2><p>{SITE.email}</p></section>
    </LegalPage>
  ),
});
