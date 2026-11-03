import { createFileRoute } from "@tanstack/react-router";
import { openWidget } from "@/lib/widget/seal";
import { mintWidgetToken } from "@/lib/widget/live";
import { widgetCors, widgetOriginAllowed } from "@/lib/widget/http";

// Public but origin-locked: only the sites the widget was created for can start a session.
export const Route = createFileRoute("/api/widget/token")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: widgetCors(request.headers.get("origin") ?? "") }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "";
        const body = await request.json().catch(() => null);
        const w = await openWidget(body?.key);
        if (!w || !widgetOriginAllowed(request, w)) return Response.json({ error: "This site is not allowed to use the assistant" }, { status: 403 });
        const headers = widgetCors(origin);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return Response.json({ error: "The assistant is not configured" }, { status: 500, headers });
        try {
          return Response.json(await mintWidgetToken(apiKey, w), { headers });
        } catch (e) {
          console.error("widget token error", e);
          return Response.json({ error: "Could not start the assistant" }, { status: 502, headers });
        }
      },
    },
  },
});
