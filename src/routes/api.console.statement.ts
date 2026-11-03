import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/lib/widget/admin";
import { getWidget } from "@/lib/widget/store";
import { statement } from "@/lib/widget/usage";
import { serverError } from "@/lib/widget/http";

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  // quote, and neutralise spreadsheet formulas
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

// Admin only. Monthly billing statement for one widget as CSV: ?id=wid_...&month=YYYY-MM
export const Route = createFileRoute("/api/console/statement")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied) return denied;
        const q = new URL(request.url).searchParams;
        const month = q.get("month") ?? "";
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return Response.json({ error: "month must be YYYY-MM" }, { status: 400 });
        try {
          const w = await getWidget(q.get("id"));
          if (!w) return Response.json({ error: "Widget not found" }, { status: 404 });
          const s = await statement(w.id, month);
          const body = csv([
            ["Statement", w.name],
            ["Widget id", w.id],
            ["Website", w.url],
            ["Month", month],
            [],
            ["Opening balance (credits)", s.opening],
            ["Credits added", s.added],
            ["Credits used", s.used],
            ["Closing balance (credits)", s.closing],
            [],
            ["Day", "Widget loads", "Opens", "Chat conversations", "Voice calls", "Call minutes", "Credits used"],
            ...s.usage.map((u) => [u.day, u.loads, u.opens, u.chats, u.calls, (u.callSecs / 60).toFixed(1), u.used]),
            [],
            ["Date (UTC)", "Type", "Credits", "Note"],
            ...s.entries.map((e) => [new Date(e.ts).toISOString().replace("T", " ").slice(0, 16), e.kind, e.credits, e.note]),
          ]);
          return new Response(body, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="statement-${w.id}-${month}.csv"`,
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          return serverError(e, "statement");
        }
      },
    },
  },
});
