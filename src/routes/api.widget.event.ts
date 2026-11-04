import { createFileRoute } from "@tanstack/react-router";
import { getWidget } from "@/lib/widget/store";
import { getRates, recordUsage } from "@/lib/widget/usage";
import { limited, widgetOriginAllowed } from "@/lib/widget/http";

const MAX_CALL_SECS = 30 * 60; // a session token lives at most 30 minutes

// Public, origin-locked usage beacons from the widget (sent with navigator.sendBeacon as text/plain, so no CORS preflight).
//   { key, type: "open" }                 visitor opened the chat panel
//   { key, type: "call_start" }           a chat turned into a voice call (no new token, so it is counted here)
//   { key, type: "call_end", secs }       a call (or the part of it on one page) ended after `secs` seconds
export const Route = createFileRoute("/api/widget/event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.text().then((t) => JSON.parse(t)).catch(() => null)) as { key?: unknown; type?: unknown; secs?: unknown } | null;
        const w = await getWidget(body?.key).catch(() => null);
        if (!w || w.status !== "active" || !widgetOriginAllowed(request, w.origins)) return new Response(null, { status: 204 });
        if (await limited(request, "event", w.id)) return new Response(null, { status: 429 });
        const rates = await getRates();
        if (body?.type === "open") await recordUsage(w.id, { opens: 1 });
        else if (body?.type === "call_start") await recordUsage(w.id, { calls: 1, usedCredits: rates.voiceMinute });
        else if (body?.type === "call_end") {
          const secs = Math.max(0, Math.min(MAX_CALL_SECS, Math.round(Number(body.secs) || 0)));
          // The first started minute was prepaid when the call began; bill every further started minute.
          const extraMinutes = Math.max(0, Math.ceil(secs / 60) - 1);
          await recordUsage(w.id, { callSecs: secs, usedCredits: extraMinutes * rates.voiceMinute });
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
