import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/widget/admin";
import { sealWidget } from "@/lib/widget/seal";
import { allowedOrigins, widgetInput, type WidgetPayload } from "@/lib/widget/shared";

// Admin only. Turns the console form into a sealed widget key: the prompt is encrypted inside it.
export const Route = createFileRoute("/api/widget/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const parsed = widgetInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid widget settings" }, { status: 400 });
        const w = parsed.data;
        const origins = allowedOrigins(w.url, w.extraDomains);
        const payload: WidgetPayload = { v: 1, n: w.name, c: w.color, i: w.icon, g: w.greeting, pos: w.position, p: w.prompt, o: origins, t: Date.now() };
        try {
          return Response.json({ key: await sealWidget(payload), origins });
        } catch (e) {
          console.error("widget create error", e);
          return Response.json({ error: e instanceof Error ? e.message : "Could not create widget" }, { status: 500 });
        }
      },
    },
  },
});
