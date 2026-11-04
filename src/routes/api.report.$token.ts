import { createFileRoute } from "@tanstack/react-router";
import { getWidget } from "@/lib/widget/store";
import { balance, dailyFor, rateLimit, usageConfigured } from "@/lib/widget/usage";
import { leadCounts, listLeads } from "@/lib/widget/leads";
import { clientIp } from "@/lib/widget/admin";

const enc = new TextEncoder();
function sameSecret(a: string, b: string) {
  const x = enc.encode(a), y = enc.encode(b);
  if (!a || x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}

// Public, read-only client report: /api/report/<widget id>.<secret>. 404 for anything else (no hint whether the widget exists).
export const Route = createFileRoute("/api/report/$token")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const notFound = () => Response.json({ error: "This report link is not valid" }, { status: 404 });
        if (await rateLimit(`report:${clientIp(request)}`, 60, 60)) return Response.json({ error: "Too many requests" }, { status: 429 });
        const [id, key] = params.token.split(".");
        const w = await getWidget(id).catch(() => null);
        if (!w || !sameSecret(key ?? "", w.reportSecret)) return notFound();
        const days = 30;
        const configured = await usageConfigured();
        const [daily, bal, counts, leads] = configured
          ? await Promise.all([dailyFor(w.id, days), balance(w.id), leadCounts(Date.now() - days * 86_400_000), w.reportLeads ? listLeads(w.id, 50) : Promise.resolve([])])
          : [[], 0, {}, []];
        return Response.json({
          name: w.name,
          website: w.url,
          status: w.status,
          color: w.color,
          days,
          configured,
          daily,
          balance: bal ?? 0,
          leadCount: (counts as Record<string, number>)[w.id] ?? 0,
          leads: (leads as Awaited<ReturnType<typeof listLeads>>).map((l) => ({ ts: l.ts, name: l.name, email: l.email, phone: l.phone, message: l.message, status: l.status })),
          showLeads: w.reportLeads,
        });
      },
    },
  },
});
