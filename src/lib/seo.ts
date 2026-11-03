const SITE_URL = (import.meta.env["VITE_SITE_URL"] as string | undefined)?.replace(/\/$/, "") || "";

export function seo({ title, description, path }: { title: string; description: string; path: string }) {
  const meta = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "TechThrust" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  const links = SITE_URL ? [{ rel: "canonical", href: `${SITE_URL}${path}` }] : [];
  if (SITE_URL) meta.push({ property: "og:url", content: `${SITE_URL}${path}` });
  return { meta, links };
}
