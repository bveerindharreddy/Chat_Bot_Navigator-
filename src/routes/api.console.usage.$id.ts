import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/widget/admin";
import { WIDGET_ID } from "@/lib/widget/shared";
import { addCredits, balance, dailyFor, ledgerFor, usageConfigured } from "@/lib/widget/usage";
import { daysParam, serverError } from "@/lib/widget/http";

const creditInput = z.object({
  credits: z.number().finite().refine((n) => n !== 0 && Math.abs(n) <= 1_000_000, "Enter a non-zero amount up to 1,000,000"),
  note: z.string().trim().max(200).default(""),
});

// Admin only. GET: daily usage for ?days=, balance and ledger of one widget. POST {credits, note}: top up (or adjust with a negative amount).
export const Route = createFileRoute("/api/console/usage/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        if (!WIDGET_ID.test(params.id)) return Response.json({ error: "Widget not found" }, { status: 404 });
        try {
          if (!(await usageConfigured())) return Response.json({ configured: false, daily: [], balance: 0, ledger: [] });
          const [daily, bal, ledger] = await Promise.all([dailyFor(params.id, daysParam(request.url)), balance(params.id), ledgerFor(params.id)]);
          return Response.json({ configured: true, daily, balance: bal ?? 0, ledger });
        } catch (e) {
          return serverError(e, "usage detail");
        }
      },
      POST: async ({ request, params }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        if (!WIDGET_ID.test(params.id)) return Response.json({ error: "Widget not found" }, { status: 404 });
        const parsed = creditInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid amount" }, { status: 400 });
        try {
          const bal = await addCredits(params.id, parsed.data.credits, parsed.data.note);
          return Response.json({ balance: bal, ledger: await ledgerFor(params.id) });
        } catch (e) {
          return serverError(e, "add credits");
        }
      },
    },
  },
});
