import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/widget/admin";
import { getWidget, putWidget } from "@/lib/widget/store";
import { serverError } from "@/lib/widget/http";

const input = z.object({ id: z.string(), action: z.enum(["create", "disable", "leads"]), leads: z.boolean().optional() });

function secret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...crypto.getRandomValues(new Uint8Array(24))].map((b) => chars[b % 62]).join("");
}

// Admin only. Client report link for one widget: create/rotate it, disable it, or choose whether it shows lead details.
export const Route = createFileRoute("/api/console/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const parsed = input.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
        try {
          const w = await getWidget(parsed.data.id);
          if (!w) return Response.json({ error: "Widget not found" }, { status: 404 });
          const { action } = parsed.data;
          const next = {
            ...w,
            reportSecret: action === "create" ? secret() : action === "disable" ? "" : w.reportSecret,
            reportLeads: action === "leads" ? !!parsed.data.leads : w.reportLeads,
          };
          await putWidget(next);
          return Response.json({ path: next.reportSecret ? `/report/${w.id}.${next.reportSecret}` : "", leads: next.reportLeads });
        } catch (e) {
          return serverError(e, "report link");
        }
      },
    },
  },
});
