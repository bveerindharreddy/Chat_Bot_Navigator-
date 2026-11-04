import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie, isAdmin, requireAdmin } from "@/lib/widget/admin";

// GET: is the browser signed in? DELETE: sign out (clears the session cookie).
export const Route = createFileRoute("/api/console/session")({
  server: {
    handlers: {
      GET: async ({ request }) => Response.json({ authenticated: await isAdmin(request) }),
      DELETE: async ({ request }) => {
        const denied = await requireAdmin(request);
        if (denied && denied.status !== 401) return denied;
        return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
      },
    },
  },
});
