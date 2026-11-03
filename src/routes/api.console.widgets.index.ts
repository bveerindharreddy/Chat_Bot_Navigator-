import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/widget/admin";
import { listWidgets, newWidgetId, putWidget } from "@/lib/widget/store";
import { allowedOrigins, summarize, widgetInput, type WidgetRecord } from "@/lib/widget/shared";
import { serverError } from "@/lib/widget/http";

// Admin only. GET lists all widgets; POST creates one and returns its permanent embed id.
export const Route = createFileRoute("/api/console/widgets/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        try {
          return Response.json({ widgets: await listWidgets() });
        } catch (e) {
          return serverError(e, "list widgets");
        }
      },
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const parsed = widgetInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid widget settings" }, { status: 400 });
        const now = Date.now();
        const w: WidgetRecord = { ...parsed.data, id: newWidgetId(), origins: allowedOrigins(parsed.data.url, parsed.data.extraDomains), status: "active", created: now, updated: now };
        try {
          await putWidget(w);
          return Response.json({ widget: w, summary: summarize(w) }, { status: 201 });
        } catch (e) {
          return serverError(e, "create widget");
        }
      },
    },
  },
});
