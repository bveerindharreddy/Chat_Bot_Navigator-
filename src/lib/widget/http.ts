import { StorageNotConfigured } from "./store";
import { rateLimit, UsageNotConfigured } from "./usage";
import { clientIp, selfHost } from "./admin";

export const widgetCors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin || "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
});

/** The request must come from a site the widget was created for (or from this app itself, for console testing). */
export function widgetOriginAllowed(request: Request, origins: string[]): boolean {
  const origin = request.headers.get("origin") ?? "";
  if (!origin) return false;
  if (origins.includes(origin)) return true;
  try {
    return new URL(origin).host === selfHost(request); // the console's own "Try it live" test
  } catch {
    return false;
  }
}

/**
 * Per-IP limits for the public widget endpoints. The Origin header can be faked outside a browser, so these
 * (together with credits) are what stop a script from burning a customer's credits or the Gemini bill.
 */
export const LIMITS = {
  config: { max: 120, secs: 60 },
  token: { max: 20, secs: 600 },
  tokenPerWidget: { max: 600, secs: 600 },
  event: { max: 120, secs: 60 },
  lead: { max: 10, secs: 600 },
} as const;

/** Returns a 429 Response if this IP (and optionally the widget as a whole) is over its limit. */
export async function limited(request: Request, kind: keyof typeof LIMITS, widgetId: string, headers: Record<string, string> = {}): Promise<Response | null> {
  const { max, secs } = LIMITS[kind];
  let wait = await rateLimit(`${kind}:${widgetId}:${clientIp(request)}`, max, secs);
  if (!wait && kind === "token") wait = await rateLimit(`tokenPerWidget:${widgetId}`, LIMITS.tokenPerWidget.max, LIMITS.tokenPerWidget.secs);
  return wait ? Response.json({ error: "Too many requests, please try again shortly" }, { status: 429, headers: { ...headers, "Retry-After": String(wait) } }) : null;
}

/** Uniform JSON error for console API routes. */
export function serverError(e: unknown, where: string): Response {
  if (e instanceof StorageNotConfigured || e instanceof UsageNotConfigured) return Response.json({ error: e.message }, { status: 503 });
  console.error(where, e);
  return Response.json({ error: "Something went wrong on the server" }, { status: 500 });
}

/** Clamp a ?days= query to the periods the console offers. */
export const daysParam = (url: string) => {
  const d = Number(new URL(url).searchParams.get("days"));
  return [7, 30, 90].includes(d) ? d : 30;
};
