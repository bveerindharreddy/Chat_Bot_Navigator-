import { z } from "zod";

// Shared by the admin console (browser) and the API routes (server). Contains NO prompts or secrets.
export const WIDGET_ICONS = ["chat", "headset", "sparkle", "bot", "phone"] as const;
export type WidgetIcon = (typeof WIDGET_ICONS)[number];

export const WIDGET_COLORS = ["#0e7fae", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#16a34a", "#0f172a"] as const;

export const widgetInput = z.object({
  name: z.string().trim().min(2).max(40),
  url: z.string().trim().url().max(300).refine((u) => /^https?:\/\//i.test(u), "Must start with http:// or https://"),
  extraDomains: z.array(z.string().trim().min(3).max(200)).max(5).default([]),
  prompt: z.string().trim().min(20).max(8000),
  greeting: z.string().trim().max(200).default(""),
  icon: z.enum(WIDGET_ICONS),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  position: z.enum(["right", "left"]).default("right"),
});
export type WidgetInput = z.infer<typeof widgetInput>;

/** What the sealed key contains. Only name/color/icon/greeting/position are ever sent to a browser, in clear. */
export type WidgetPayload = { v: 1; n: string; c: string; i: WidgetIcon; g: string; pos: "right" | "left"; p: string; o: string[]; t: number };

/** What the embedded widget is allowed to know about itself. */
export type PublicWidgetConfig = { name: string; color: string; icon: WidgetIcon; greeting: string; position: "right" | "left" };

/** Normalises "shop.example.com" or "https://shop.example.com/page" to an origin; null if invalid. */
export function toOrigin(raw: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return null;
  }
}

/** The site origin plus its www / non-www twin. */
export function allowedOrigins(url: string, extra: string[]): string[] {
  const set = new Set<string>();
  for (const raw of [url, ...extra]) {
    const o = toOrigin(raw);
    if (!o) continue;
    set.add(o);
    const u = new URL(o);
    if (!/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(u.hostname)) {
      u.hostname = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
      set.add(u.origin);
    }
  }
  return [...set];
}
