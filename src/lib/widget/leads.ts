// Server-only lead storage (same D1 database as usage) and webhook delivery.
import { z } from "zod";
import { db, UsageNotConfigured } from "./usage";
import type { WidgetRecord } from "./shared";

export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type Lead = { id: number; ts: number; name: string; email: string; phone: string; message: string; page: string; status: LeadStatus; webhook: string };

export const leadInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().max(200).email().or(z.literal("")).default(""),
    phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/, "Invalid phone number").default(""),
    message: z.string().trim().max(1000).default(""),
    page: z.string().trim().max(300).default(""),
  })
  .refine((l) => l.email || l.phone, "An email or a phone number is required");
export type LeadInput = z.infer<typeof leadInput>;

async function conn() {
  const d = await db();
  if (!d) throw new UsageNotConfigured();
  return d;
}

/** Saves the lead, then notifies the widget's webhook (if any) and records the delivery result. */
export async function createLead(w: WidgetRecord, input: LeadInput): Promise<Lead> {
  const d = await conn();
  const ts = Date.now();
  const row = await d
    .prepare("INSERT INTO leads (widget_id, ts, name, email, phone, message, page) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id")
    .bind(w.id, ts, input.name, input.email, input.phone, input.message, input.page)
    .first<{ id: number }>();
  const lead: Lead = { id: row?.id ?? 0, ts, ...input, status: "new", webhook: "" };
  const hook = w.leadWebhook ?? "";
  if (hook) {
    lead.webhook = await deliver(hook, w, lead);
    await d.prepare("UPDATE leads SET webhook = ? WHERE id = ?").bind(lead.webhook, lead.id).run();
  }
  return lead;
}

async function deliver(url: string, w: WidgetRecord, lead: Lead): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "TechThrust-Widget-Webhook/1.0" },
      body: JSON.stringify({
        event: "lead.created",
        widget: { id: w.id, name: w.name, website: w.url },
        lead: { id: lead.id, created_at: new Date(lead.ts).toISOString(), name: lead.name, email: lead.email, phone: lead.phone, message: lead.message, page: lead.page },
      }),
      signal: AbortSignal.timeout(5000),
      redirect: "manual",
    });
    return res.ok ? "delivered" : `failed (HTTP ${res.status})`;
  } catch (e) {
    return `failed (${e instanceof Error && e.name === "TimeoutError" ? "timeout" : "network error"})`;
  }
}

export async function listLeads(widgetId: string, limit = 500): Promise<Lead[]> {
  const d = await db();
  if (!d) return [];
  const { results } = await d
    .prepare("SELECT id, ts, name, email, phone, message, page, status, webhook FROM leads WHERE widget_id = ? ORDER BY ts DESC, id DESC LIMIT ?")
    .bind(widgetId, limit)
    .all<Lead>();
  return results;
}

export async function setLeadStatus(widgetId: string, id: number, status: LeadStatus): Promise<boolean> {
  const d = await conn();
  const r = await d.prepare("UPDATE leads SET status = ? WHERE id = ? AND widget_id = ? RETURNING id").bind(status, id, widgetId).first<{ id: number }>();
  return !!r;
}

/** Permanent erasure (e.g. a visitor's privacy request). */
export async function deleteLead(widgetId: string, id: number): Promise<boolean> {
  const d = await conn();
  const r = await d.prepare("DELETE FROM leads WHERE id = ? AND widget_id = ? RETURNING id").bind(id, widgetId).first<{ id: number }>();
  return !!r;
}

/** Lead counts per widget since `sinceTs` (for the console list). */
export async function leadCounts(sinceTs: number): Promise<Record<string, number>> {
  const d = await db();
  if (!d) return {};
  const { results } = await d.prepare("SELECT widget_id, COUNT(*) n FROM leads WHERE ts >= ? GROUP BY widget_id").bind(sinceTs).all<{ widget_id: string; n: number }>();
  return Object.fromEntries(results.map((r) => [r.widget_id, r.n]));
}
