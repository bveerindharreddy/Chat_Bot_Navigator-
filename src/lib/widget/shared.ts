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

export type WidgetStatus = "active" | "revoked";

/** Stored server-side in KV. The prompt never leaves the server (only the console API returns it, to the admin). */
export type WidgetRecord = WidgetInput & { id: string; origins: string[]; status: WidgetStatus; created: number; updated: number };

/** The console list row (kept in KV metadata, so listing needs no extra reads). */
export type WidgetSummary = { id: string; name: string; host: string; color: string; icon: WidgetIcon; status: WidgetStatus; created: number; updated: number };

export const summarize = (w: WidgetRecord): WidgetSummary => ({
  id: w.id,
  name: w.name,
  host: new URL(w.url).hostname,
  color: w.color,
  icon: w.icon,
  status: w.status,
  created: w.created,
  updated: w.updated,
});

export const WIDGET_ID = /^wid_[A-Za-z0-9]{20}$/;

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
