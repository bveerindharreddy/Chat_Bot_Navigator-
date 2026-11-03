import { createFileRoute } from "@tanstack/react-router";
import { getWidget } from "@/lib/widget/store";
import { getRates, hasCredit, recordUsage } from "@/lib/widget/usage";
import { mintWidgetToken } from "@/lib/widget/live";
import { widgetCors, widgetOriginAllowed } from "@/lib/widget/http";

// Public but origin-locked: only active widgets with credit, on the sites they were created for, can start a session.
// Body: { key, mode: "chat" | "voice", resumed?: boolean } (resumed = the same conversation continuing after a page change).
export const Route = createFileRoute("/api/widget/token")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: widgetCors(request.headers.get("origin") ?? "") }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "";
        const body = await request.json().catch(() => null);
        const w = await getWidget(body?.key).catch(() => null);
        if (!w || w.status !== "active" || !widgetOriginAllowed(request, w.origins)) {
          return Response.json({ error: "This site is not allowed to use the assistant" }, { status: 403 });
        }
        const headers = widgetCors(origin);
        if (!(await hasCredit(w.id))) return Response.json({ error: "The assistant is unavailable right now" }, { status: 402, headers });
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return Response.json({ error: "The assistant is not configured" }, { status: 500, headers });
        try {
          const token = await mintWidgetToken(apiKey, w);
          // Billing: a new chat conversation costs the chat rate. A voice call (or a call continuing on a new page)
          // prepays its first started minute here; the widget reports the rest when the call ends (/api/widget/event).
          const voice = body?.mode === "voice";
          const resumed = body?.resumed === true;
          const rates = await getRates();
          if (voice) await recordUsage(w.id, { calls: resumed ? 0 : 1, usedCredits: rates.voiceMinute });
          else if (!resumed) await recordUsage(w.id, { chats: 1, usedCredits: rates.chat });
          return Response.json(token, { headers });
        } catch (e) {
          console.error("widget token error", e);
          return Response.json({ error: "Could not start the assistant" }, { status: 502, headers });
        }
      },
    },
  },
});
