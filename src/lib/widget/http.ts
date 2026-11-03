import type { WidgetPayload } from "./shared";

export const widgetCors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin || "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
});

/** The request must come from a site the widget was created for (or from this app itself, for console testing). */
export function widgetOriginAllowed(request: Request, w: WidgetPayload): boolean {
  const origin = request.headers.get("origin") ?? "";
  if (!origin) return false;
  return w.o.includes(origin) || origin === new URL(request.url).origin;
}
