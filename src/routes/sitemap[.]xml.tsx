import { createFileRoute } from "@tanstack/react-router";

const PATHS = ["/", "/products", "/products/velynora", "/products/velynora-lite", "/products/vocalis", "/services", "/about", "/presentation", "/contact", "/privacy", "/terms"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = (process.env["SITE_URL"] || new URL(request.url).origin).replace(/\/$/, "");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PATHS.map((p) => `<url><loc>${origin}${p}</loc></url>`).join("")}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
