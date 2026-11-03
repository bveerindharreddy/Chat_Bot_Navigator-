import { createFileRoute } from "@tanstack/react-router";
import { openWidget } from "@/lib/widget/seal";
import type { PublicWidgetConfig } from "@/lib/widget/shared";
import { widgetCors, widgetOriginAllowed } from "@/lib/widget/http";

// Public: the embedded widget asks how to look (name, colour, icon). Never returns the prompt.
export const Route = createFileRoute("/api/widget/config")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: widgetCors(request.headers.get("origin") ?? "") }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "";
        const body = await request.json().catch(() => null);
        const w = await openWidget(body?.key);
        if (!w || !widgetOriginAllowed(request, w)) return Response.json({ error: "This widget is not available on this site" }, { status: 403 });
        const cfg: PublicWidgetConfig = { name: w.n, color: w.c, icon: w.i, greeting: w.g, position: w.pos };
        return Response.json(cfg, { headers: widgetCors(origin) });
      },
    },
  },
});
