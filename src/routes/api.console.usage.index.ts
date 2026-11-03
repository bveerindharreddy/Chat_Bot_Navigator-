import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/widget/admin";
import { getRates, summaryAll, usageConfigured } from "@/lib/widget/usage";
import { daysParam, serverError } from "@/lib/widget/http";

// Admin only. Usage totals for the last ?days= days (7/30/90) and the credit balance of every widget.
export const Route = createFileRoute("/api/console/usage/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        try {
          const configured = await usageConfigured();
          return Response.json({ configured, rates: await getRates(), widgets: configured ? await summaryAll(daysParam(request.url)) : {} });
        } catch (e) {
          return serverError(e, "usage summary");
        }
      },
    },
  },
});
