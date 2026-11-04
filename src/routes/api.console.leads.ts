import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/widget/admin";
import { getWidget } from "@/lib/widget/store";
import { deleteLead, LEAD_STATUSES, listLeads, setLeadStatus } from "@/lib/widget/leads";
import { serverError } from "@/lib/widget/http";
import { usageConfigured } from "@/lib/widget/usage";

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const patchInput = z.object({ lead: z.number().int().positive(), status: z.enum(LEAD_STATUSES) });
const deleteInput = z.object({ lead: z.number().int().positive() });

// Admin only. ?id=wid_... GET lists leads (format=csv to download), PATCH {lead,status}, DELETE {lead}.
export const Route = createFileRoute("/api/console/leads")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const q = new URL(request.url).searchParams;
        try {
          const w = await getWidget(q.get("id"));
          if (!w) return Response.json({ error: "Widget not found" }, { status: 404 });
          const leads = await listLeads(w.id);
          if (q.get("format") !== "csv") return Response.json({ configured: await usageConfigured(), leads });
          const rows = [["Date (UTC)", "Name", "Email", "Phone", "Message", "Page", "Status", "Webhook"], ...leads.map((l) => [new Date(l.ts).toISOString().replace("T", " ").slice(0, 16), l.name, l.email, l.phone, l.message, l.page, l.status, l.webhook])];
          return new Response(rows.map((r) => r.map(csvCell).join(",")).join("\r\n"), {
            headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${w.id}.csv"` },
          });
        } catch (e) {
          return serverError(e, "list leads");
        }
      },
      PATCH: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const id = new URL(request.url).searchParams.get("id") ?? "";
        const parsed = patchInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid lead update" }, { status: 400 });
        try {
          return (await setLeadStatus(id, parsed.data.lead, parsed.data.status)) ? Response.json({ ok: true }) : Response.json({ error: "Lead not found" }, { status: 404 });
        } catch (e) {
          return serverError(e, "update lead");
        }
      },
      DELETE: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const id = new URL(request.url).searchParams.get("id") ?? "";
        const parsed = deleteInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid lead" }, { status: 400 });
        try {
          return (await deleteLead(id, parsed.data.lead)) ? Response.json({ ok: true }) : Response.json({ error: "Lead not found" }, { status: 404 });
        } catch (e) {
          return serverError(e, "delete lead");
        }
      },
    },
  },
});
