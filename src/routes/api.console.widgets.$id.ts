import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/widget/admin";
import { deleteWidget, getWidget, putWidget } from "@/lib/widget/store";
import { allowedOrigins, summarize, widgetInput, type WidgetRecord } from "@/lib/widget/shared";
import { serverError } from "@/lib/widget/http";

const statusInput = z.object({ status: z.enum(["active", "revoked"]) });

type Ctx = { request: Request; params: { id: string } };

/** Runs an admin action on an existing widget; 404 if the id is unknown. */
async function withWidget(ctx: Ctx, fn: (w: WidgetRecord) => Promise<Response>): Promise<Response> {
  const denied = await requireAdmin(ctx.request);
  if (denied) return denied;
  try {
    const w = await getWidget(ctx.params.id);
    if (!w) return Response.json({ error: "Widget not found" }, { status: 404 });
    return await fn(w);
  } catch (e) {
    return serverError(e, "widget " + ctx.request.method);
  }
}

// Admin only. GET returns the full widget (incl. prompt) for editing; PUT saves edits (same embed code);
// PATCH {status} revokes or restores it; DELETE removes it permanently.
export const Route = createFileRoute("/api/console/widgets/$id")({
  server: {
    handlers: {
      GET: (ctx) => withWidget(ctx, async (w) => Response.json({ widget: w })),
      PUT: (ctx) =>
        withWidget(ctx, async (w) => {
          const parsed = widgetInput.safeParse(await ctx.request.json().catch(() => null));
          if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid widget settings" }, { status: 400 });
          const next: WidgetRecord = { ...w, ...parsed.data, origins: allowedOrigins(parsed.data.url, parsed.data.extraDomains), updated: Date.now() };
          await putWidget(next);
          return Response.json({ widget: next, summary: summarize(next) });
        }),
      PATCH: (ctx) =>
        withWidget(ctx, async (w) => {
          const parsed = statusInput.safeParse(await ctx.request.json().catch(() => null));
          if (!parsed.success) return Response.json({ error: "status must be active or revoked" }, { status: 400 });
          const next: WidgetRecord = { ...w, status: parsed.data.status, updated: Date.now() };
          await putWidget(next);
          return Response.json({ widget: next, summary: summarize(next) });
        }),
      DELETE: (ctx) =>
        withWidget(ctx, async (w) => {
          await deleteWidget(w.id);
          return Response.json({ ok: true });
        }),
    },
  },
});
