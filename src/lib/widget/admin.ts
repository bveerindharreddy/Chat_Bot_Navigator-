// Server-only admin gate for the console API: the console sends ADMIN_PASSWORD in the x-admin-password header.
const enc = new TextEncoder();

async function digest(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

/** Returns an error Response when the request is not from the admin, otherwise null. */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return Response.json({ error: "ADMIN_PASSWORD is not configured on the server" }, { status: 500 });
  const [a, b] = await Promise.all([digest(request.headers.get("x-admin-password") ?? ""), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!; // constant-time compare of fixed-length digests
  return diff === 0 ? null : Response.json({ error: "Wrong admin password" }, { status: 401 });
}
