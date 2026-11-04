import { createFileRoute } from "@tanstack/react-router";
import { clientIp, createSessionCookie, passwordMatches, selfHost } from "@/lib/widget/admin";
import { rateLimit, rateLimitPeek } from "@/lib/widget/usage";

const MAX_ATTEMPTS = 10; // failed attempts per IP per window
const WINDOW_SECS = 15 * 60;

// Admin sign-in: checks ADMIN_PASSWORD and sets the session cookie. Brute force is capped per IP.
export const Route = createFileRoute("/api/console/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.ADMIN_PASSWORD) return Response.json({ error: "ADMIN_PASSWORD is not configured on the server" }, { status: 500 });
        const origin = request.headers.get("origin");
        if (origin && (() => { try { return new URL(origin).host !== selfHost(request); } catch { return true; } })()) {
          return Response.json({ error: "Cross-site request refused" }, { status: 403 });
        }
        // Only failed attempts count, so signing in often never locks the admin out.
        const key = `login:${clientIp(request)}`;
        const wait = await rateLimitPeek(key, MAX_ATTEMPTS, WINDOW_SECS);
        if (wait) return Response.json({ error: `Too many failed sign-in attempts. Try again in ${Math.ceil(wait / 60)} min.` }, { status: 429, headers: { "Retry-After": String(wait) } });
        const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
        if (typeof body?.password !== "string" || !(await passwordMatches(body.password))) {
          await rateLimit(key, MAX_ATTEMPTS, WINDOW_SECS);
          return Response.json({ error: "Wrong admin password" }, { status: 401 });
        }
        return Response.json({ ok: true }, { headers: { "Set-Cookie": await createSessionCookie(request) } });
      },
    },
  },
});
