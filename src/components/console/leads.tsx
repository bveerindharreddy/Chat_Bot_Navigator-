// Console: leads the assistant collected for one widget. Talks to /api/console/leads.
import { useEffect, useState } from "react";
import { Download, Loader2, Mail, Phone, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/widget/leads";
import type { ApiFn } from "./usage";

const STATUS_LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", closed: "Closed" };
const fmtTs = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function LeadsPanel({ api, widgetId }: { api: ApiFn; widgetId: string }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let live = true;
    setLeads(null); setErr("");
    void api<{ configured?: boolean; leads?: Lead[] }>("GET", `/api/console/leads?id=${widgetId}`).then((r) => {
      if (!live) return;
      if (!r.ok) return setErr(r.data.error ?? "Could not load leads");
      setConfigured(r.data.configured !== false);
      setLeads(r.data.leads ?? []);
    });
    return () => { live = false; };
  }, [api, widgetId]);

  const setStatus = async (l: Lead, status: LeadStatus) => {
    setBusy(`s${l.id}`);
    const r = await api("PATCH", `/api/console/leads?id=${widgetId}`, { lead: l.id, status });
    setBusy("");
    if (!r.ok) return setErr(r.data.error ?? "Could not update the lead");
    setLeads((ls) => ls?.map((x) => (x.id === l.id ? { ...x, status } : x)) ?? null);
  };

  const remove = async (l: Lead) => {
    if (!confirm(`Delete the lead from ${l.name} permanently? Use this for privacy (erasure) requests.`)) return;
    setBusy(`d${l.id}`);
    const r = await api("DELETE", `/api/console/leads?id=${widgetId}`, { lead: l.id });
    setBusy("");
    if (!r.ok) return setErr(r.data.error ?? "Could not delete the lead");
    setLeads((ls) => ls?.filter((x) => x.id !== l.id) ?? null);
  };

  const exportCsv = async () => {
    setBusy("csv");
    const res = await fetch(`/api/console/leads?id=${widgetId}&format=csv`, { credentials: "same-origin" }).catch(() => null);
    setBusy("");
    if (!res?.ok) return setErr("Could not export leads");
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: `leads-${widgetId}.csv` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fresh = leads?.filter((l) => l.status === "new").length ?? 0;

  return (
    <section className="card-premium space-y-4 p-6" aria-labelledby="leads-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="leads-h" className="flex items-center gap-2 text-lg font-semibold">
          Leads {leads && <span className="text-sm font-normal text-muted-foreground">({leads.length}{fresh ? `, ${fresh} new` : ""})</span>}
        </h2>
        <Button size="sm" variant="heroOutline" onClick={exportCsv} disabled={!leads?.length || busy !== ""}>
          {busy === "csv" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Export CSV
        </Button>
      </div>
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
      {!configured && <p className="text-sm text-muted-foreground">Lead storage needs the D1 database (set <code>WIDGETS_D1_ID</code>).</p>}
      {leads === null && !err && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading leads…</p>}
      {leads?.length === 0 && configured && (
        <p className="text-sm text-muted-foreground">No leads yet. When a visitor asks for a quote, a booking or a call back, the assistant collects their details, reads them back and saves them here.</p>
      )}
      {!!leads?.length && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {leads.map((l) => (
            <li key={l.id} className={cn("grid gap-2 p-3 sm:grid-cols-[1fr_auto]", l.status === "closed" && "opacity-60")}>
              <div className="min-w-0 space-y-1 text-sm">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5 font-semibold"><UserRound className="size-3.5 text-muted-foreground" aria-hidden />{l.name}</span>
                  {l.email && <a className="flex items-center gap-1 text-primary hover:underline" href={`mailto:${l.email}`}><Mail className="size-3.5" aria-hidden />{l.email}</a>}
                  {l.phone && <a className="flex items-center gap-1 text-primary hover:underline" href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}><Phone className="size-3.5" aria-hidden />{l.phone}</a>}
                </p>
                {l.message && <p className="text-muted-foreground">{l.message}</p>}
                <p className="text-xs text-muted-foreground">
                  {fmtTs(l.ts)}{l.page && ` · from ${l.page}`}
                  {l.webhook && <span className={cn("ml-1", l.webhook === "delivered" ? "" : "text-destructive")}> · webhook {l.webhook}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 sm:flex-col sm:items-end">
                <select value={l.status} onChange={(e) => void setStatus(l, e.target.value as LeadStatus)} disabled={busy !== ""}
                  aria-label={`Status of the lead from ${l.name}`} className="h-8 rounded-md border border-border bg-background px-2 text-xs">
                  {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-destructive hover:text-destructive" disabled={busy !== ""} onClick={() => void remove(l)} aria-label={`Delete the lead from ${l.name}`}>
                  {busy === `d${l.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
