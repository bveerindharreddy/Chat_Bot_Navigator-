import { createFileRoute } from "@tanstack/react-router";
import { getWidget } from "@/lib/widget/store";
import { createLead, leadInput } from "@/lib/widget/leads";
import { limited, widgetCors, widgetOriginAllowed } from "@/lib/widget/http";

// Public, origin-locked: the widget's save_lead tool posts the details the visitor confirmed.
export const Route = createFileRoute("/api/widget/lead")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: widgetCors(request.headers.get("origin") ?? "") }),
      POST: async ({ request }) => {
        const origin = request.headers.get("origin") ?? "";
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const w = await getWidget(body?.key).catch(() => null);
        if (!w || w.status !== "active" || !widgetOriginAllowed(request, w.origins)) return Response.json({ ok: false, error: "not allowed" }, { status: 403 });
        const headers = widgetCors(origin);
        const slow = await limited(request, "lead", w.id, headers);
        if (slow) return slow;
        const parsed = leadInput.safeParse(body);
        if (!parsed.success) return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "invalid details" }, { status: 400, headers });
        try {
          const lead = await createLead(w, parsed.data);
          return Response.json({ ok: true, id: lead.id }, { headers });
        } catch (e) {
          console.error("lead error", e);
          return Response.json({ ok: false, error: "could not save the details" }, { status: 503, headers });
        }
      },
    },
  },
});
