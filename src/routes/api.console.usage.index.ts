import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/widget/admin";
import { getRates, summaryAll, usageConfigured } from "@/lib/widget/usage";
import { daysParam, serverError } from "@/lib/widget/http";
import { leadCounts } from "@/lib/widget/leads";

// Admin only. Usage totals for the last ?days= days (7/30/90) and the credit balance of every widget.
export const Route = createFileRoute("/api/console/usage/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        try {
          const configured = await usageConfigured();
          const days = daysParam(request.url);
          const [widgets, leads] = configured ? await Promise.all([summaryAll(days), leadCounts(Date.now() - days * 86_400_000)]) : [{}, {}];
          return Response.json({ configured, rates: await getRates(), widgets, leads });
        } catch (e) {
          return serverError(e, "usage summary");
        }
      },
    },
  },
});
