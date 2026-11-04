// Server-only admin authentication for the console.
// POST /api/console/login checks ADMIN_PASSWORD (rate-limited per IP) and sets an HMAC-signed, HttpOnly, SameSite=Strict
// session cookie. The password itself is never stored in the browser. Changing ADMIN_PASSWORD (or SESSION_SECRET)
// signs everyone out.
const enc = new TextEncoder();
export const SESSION_COOKIE = "tt_admin";
export const SESSION_HOURS = 12;

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function digest(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

const adminPassword = () => process.env.ADMIN_PASSWORD || "";

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || adminPassword();
  return crypto.subtle.importKey("raw", await digest(`tt-console-session:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload: string) {
  return b64u(new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(), enc.encode(payload))));
}

/** Constant-time check of a submitted password. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const expected = adminPassword();
  if (!expected) return false;
  return equal(await digest(candidate), await digest(expected));
}

export async function createSessionCookie(request: Request): Promise<string> {
  const payload = b64u(enc.encode(JSON.stringify({ exp: Date.now() + SESSION_HOURS * 3600_000 })));
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${payload}.${await sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure}`;
}

export const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

function cookie(request: Request, name: string): string {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return "";
}

export async function isAdmin(request: Request): Promise<boolean> {
  if (!adminPassword()) return false;
  const [payload, sig] = cookie(request, SESSION_COOKIE).split(".");
  if (!payload || !sig) return false;
  if (!equal(enc.encode(sig), enc.encode(await sign(payload)))) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/** Host of this server as the browser sees it (works behind proxies that terminate TLS). */
export const selfHost = (request: Request) => request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;

/** Client IP for rate limiting (Cloudflare sets cf-connecting-ip). */
export const clientIp = (request: Request) =>
  request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

/**
 * Returns an error Response when the request is not from a signed-in admin, otherwise null.
 * State-changing requests must also come from this site (CSRF defence in depth on top of SameSite=Strict).
 */
export async function requireAdmin(request: Request): Promise<Response | null> {
  if (!adminPassword()) return Response.json({ error: "ADMIN_PASSWORD is not configured on the server" }, { status: 500 });
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (origin) {
      let host = "";
      try { host = new URL(origin).host; } catch { /* invalid origin */ }
      if (host !== selfHost(request)) return Response.json({ error: "Cross-site request refused" }, { status: 403 });
    }
  }
  return (await isAdmin(request)) ? null : Response.json({ error: "Please sign in" }, { status: 401 });
}
