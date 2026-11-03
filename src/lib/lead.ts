import { voiceUi } from "@/lib/voice/ui-store";

export type LeadPayload = { name: string; email: string; phone?: string; company?: string; service?: string; message?: string; source: string; website?: string };

/** Sends the lead to the server. On success the voice agent is told so it can thank the visitor. */
export async function submitLead(payload: LeadPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, error: body?.error ?? "We couldn't submit your request. Please try again." };
    }
  } catch (e) {
    console.error("lead submit failed", e);
    return { ok: false, error: "Something went wrong. Please try again, or email us directly." };
  }
  voiceUi.set({ lead: { name: payload.name, ts: Date.now() } });
  return { ok: true };
}
