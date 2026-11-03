import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(120).optional(),
  service: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(200).optional(),
  website: z.string().optional(), // honeypot: real visitors never fill this
});

export const Route = createFileRoute("/api/lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        if (typeof body?.website === "string" && body.website.length > 0) return Response.json({ ok: true }); // silently drop bots
        const parsed = schema.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Invalid lead" }, { status: 400 });
        // TODO: forward to your CRM / email / webhook. For now the lead is only logged on the server.
        const { website: _bot, ...lead } = parsed.data;
        console.log("[lead]", JSON.stringify(lead));
        return Response.json({ ok: true });
      },
    },
  },
});
