import { createFileRoute } from "@tanstack/react-router";
import { getWidget } from "@/lib/widget/store";
import { getRates, hasCredit, recordUsage } from "@/lib/widget/usage";
import type { PublicWidgetConfig } from "@/lib/widget/shared";
import { limited, widgetCors, widgetOriginAllowed } from "@/lib/widget/http";

// Public: the embedded widget asks how to look (name, colour, icon). Never returns the prompt.
// Read on every page load, so console edits, revokes and credit limits reach live sites without a new embed code.
// Each successful call counts as one widget load.
export const Route = createFileRoute("/api/widget/config")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: widgetCors(request.headers.get("origin") ?? "") }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "";
        const body = await request.json().catch(() => null);
        const w = await getWidget(body?.key).catch(() => null);
        if (!w || w.status !== "active" || !widgetOriginAllowed(request, w.origins) || !(await hasCredit(w.id))) {
          return Response.json({ error: "This widget is not available on this site" }, { status: 403 });
        }
        const slow = await limited(request, "config", w.id, widgetCors(origin));
        if (slow) return slow;
        await recordUsage(w.id, { loads: 1, usedCredits: (await getRates()).load });
        const cfg: PublicWidgetConfig = { name: w.name, color: w.color, icon: w.icon, greeting: w.greeting, position: w.position };
        return Response.json(cfg, { headers: { ...widgetCors(origin), "Cache-Control": "no-store" } });
      },
    },
  },
});
