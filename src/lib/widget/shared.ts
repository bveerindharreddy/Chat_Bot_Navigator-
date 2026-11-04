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
  /** Optional https URL that receives a JSON POST for every new lead (Zapier, Make, a CRM...). */
  leadWebhook: z
    .string()
    .trim()
    .max(500)
    .refine((u) => u === "" || /^https:\/\/[^\s]+$/i.test(u), "Lead webhook must be an https:// URL")
    .default(""),
  /** Language the assistant starts in (it still follows the visitor if they clearly switch). */
  language: z.string().trim().min(2).max(30).default("English"),
  /** Up to 4 suggested first questions shown as tappable chips. */
  starters: z.array(z.string().trim().min(2).max(60)).max(4).default([]),
  /** Small pop-up bubble next to the launcher after `teaserDelay` seconds (0 = never). */
  teaser: z.string().trim().max(120).default(""),
  teaserDelay: z.number().int().min(0).max(120).default(8),
  /** "Talk to a human" options shown in the panel and offered by the assistant. */
  handoffPhone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/, "Invalid handoff phone number").default(""),
  handoffWhatsapp: z.string().trim().max(20).regex(/^\+?\d*$/, "WhatsApp number: digits only, with country code").default(""),
  handoffEmail: z.string().trim().max(200).email("Invalid handoff email").or(z.literal("")).default(""),
  /** Privacy policy link shown in the AI disclosure line. */
  privacyUrl: z.string().trim().max(300).refine((u) => u === "" || /^https?:\/\/[^\s]+$/i.test(u), "Privacy link must be a URL").default(""),
  /** "Powered by TechThrust" badge. Turning it off is the white-label option. */
  showBranding: z.boolean().default(true),
});
export type WidgetInput = z.infer<typeof widgetInput>;

/** Values for settings added after a widget was created (older records lack them). */
export const WIDGET_DEFAULTS = {
  leadWebhook: "",
  language: "English",
  starters: [] as string[],
  teaser: "",
  teaserDelay: 8,
  handoffPhone: "",
  handoffWhatsapp: "",
  handoffEmail: "",
  privacyUrl: "",
  showBranding: true,
  reportSecret: "",
  reportLeads: false,
};

export type WidgetStatus = "active" | "revoked";

/** Stored server-side in KV. The prompt never leaves the server (only the console API returns it, to the admin). */
export type WidgetRecord = WidgetInput & {
  id: string;
  origins: string[];
  status: WidgetStatus;
  created: number;
  updated: number;
  /** Secret part of the client report link ("" = no link). */
  reportSecret: string;
  /** Whether the client report shows lead names and contact details. */
  reportLeads: boolean;
};

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

/** What the embedded widget is allowed to know about itself (never the prompt, webhook or billing). */
export type PublicWidgetConfig = {
  name: string;
  color: string;
  icon: WidgetIcon;
  greeting: string;
  position: "right" | "left";
  starters: string[];
  teaser: string;
  teaserDelay: number;
  handoff: { phone: string; whatsapp: string; email: string };
  privacyUrl: string;
  showBranding: boolean;
};

export const publicConfig = (w: WidgetRecord): PublicWidgetConfig => ({
  name: w.name,
  color: w.color,
  icon: w.icon,
  greeting: w.greeting,
  position: w.position,
  starters: w.starters,
  teaser: w.teaser,
  teaserDelay: w.teaserDelay,
  handoff: { phone: w.handoffPhone, whatsapp: w.handoffWhatsapp, email: w.handoffEmail },
  privacyUrl: w.privacyUrl,
  showBranding: w.showBranding,
});

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
