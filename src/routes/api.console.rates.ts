import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/widget/admin";
import { getRates, setRates } from "@/lib/widget/usage";
import { serverError } from "@/lib/widget/http";

const credit = z.number().finite().min(0).max(10_000);
const ratesInput = z.object({ chat: credit, voiceMinute: credit, load: credit, startingCredits: z.number().finite().min(0).max(1_000_000), enforce: z.boolean() });

// Admin only. Billing rates applied to all widgets. Changes apply to new usage only; past usage keeps the rate it was billed at.
export const Route = createFileRoute("/api/console/rates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        try {
          return Response.json({ rates: await getRates() });
        } catch (e) {
          return serverError(e, "get rates");
        }
      },
      PUT: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const parsed = ratesInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: `${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}` }, { status: 400 });
        try {
          await setRates(parsed.data);
          return Response.json({ rates: parsed.data });
        } catch (e) {
          return serverError(e, "set rates");
        }
      },
    },
  },
});
