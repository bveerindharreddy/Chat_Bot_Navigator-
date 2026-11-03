import { StorageNotConfigured } from "./store";

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
  return origins.includes(origin) || origin === new URL(request.url).origin;
}

/** Uniform JSON error for console API routes. */
export function serverError(e: unknown, where: string): Response {
  if (e instanceof StorageNotConfigured) return Response.json({ error: e.message }, { status: 503 });
  console.error(where, e);
  return Response.json({ error: "Something went wrong on the server" }, { status: 500 });
}
