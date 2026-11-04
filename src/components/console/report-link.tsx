// Console: create, copy, rotate or disable a widget's read-only client report link.
import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { WidgetRecord } from "@/lib/widget/shared";
import type { ApiFn } from "./usage";

export function ReportLinkCard({ api, widget, onChange }: { api: ApiFn; widget: WidgetRecord; onChange: (secret: string, leads: boolean) => void }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const url = widget.reportSecret ? `${location.origin}/report/${widget.id}.${widget.reportSecret}` : "";

  const act = async (action: "create" | "disable" | "leads", leads?: boolean) => {
    if (action === "create" && url && !confirm("Create a new link? The current link stops working.")) return;
    if (action === "disable" && !confirm("Disable the report link? Anyone holding it loses access.")) return;
    setBusy(action); setErr("");
    const r = await api<{ path?: string; leads?: boolean }>("POST", "/api/console/report", { id: widget.id, action, leads });
    setBusy("");
    if (!r.ok) return setErr(r.data.error ?? "Could not update the link");
    const secret = r.data.path ? r.data.path.split(".").pop() ?? "" : "";
    onChange(secret, !!r.data.leads);
  };

  const copy = async () => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <section className="card-premium space-y-4 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Link2 className="size-4" aria-hidden />Client report link</h2>
        <p className="mt-1 text-sm text-muted-foreground">A private, read-only page for the business owner: conversations, voice minutes, leads and credit balance for the last 30 days. No login needed.</p>
      </div>
      {url ? (
        <>
          <div className="flex flex-wrap gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 text-xs">{url}</code>
            <Button size="sm" variant="hero" onClick={copy}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy"}</Button>
            <Button size="sm" variant="heroOutline" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open</a></Button>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
            <span><span className="font-medium">Show lead names and contact details</span><span className="block text-xs text-muted-foreground">Off: the report shows only the number of leads. Turn on only if the link stays with the business owner.</span></span>
            <Switch checked={widget.reportLeads} disabled={busy !== ""} onCheckedChange={(v) => void act("leads", v)} aria-label="Show lead details in the report" />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => void act("create")} disabled={busy !== ""}>{busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}New link</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void act("disable")} disabled={busy !== ""}>Disable link</Button>
          </div>
        </>
      ) : (
        <Button size="sm" variant="heroOutline" onClick={() => void act("create")} disabled={busy !== ""}>{busy === "create" ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}Create report link</Button>
      )}
      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
    </section>
  );
}
