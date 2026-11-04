import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Phone, Sparkles } from "lucide-react";
import { fmtCredits, UsageChart, UsageTable, VIZ_CSS } from "@/components/console/usage";
import type { DailyUsage } from "@/lib/widget/usage";

export const Route = createFileRoute("/report/$token")({
  head: () => ({ meta: [{ title: "Assistant report" }, { name: "robots", content: "noindex,nofollow" }, { name: "referrer", content: "no-referrer" }] }),
  component: Report,
});

type Data = {
  name: string; website: string; status: "active" | "revoked"; days: number; configured: boolean;
  daily: DailyUsage[]; balance: number; leadCount: number; showLeads: boolean;
  leads: { ts: number; name: string; email: string; phone: string; message: string; status: string }[];
};

const num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

// Read-only report for the business owner: what their assistant did in the last 30 days.
function Report() {
  const { token } = Route.useParams();
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [table, setTable] = useState(false);
  useEffect(() => {
    void fetch(`/api/report/${encodeURIComponent(token)}`).then(async (r) => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) setErr(body.error ?? "This report link is not valid");
      else setD(body as Data);
    }).catch(() => setErr("Could not load the report"));
  }, [token]);

  if (err) return <Shell><p role="alert" className="py-24 text-center text-muted-foreground">{err}</p></Shell>;
  if (!d) return <Shell><p className="flex justify-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-label="Loading" /></p></Shell>;

  const t = d.daily.reduce((a, x) => ({ chats: a.chats + x.chats, calls: a.calls + x.calls, secs: a.secs + x.callSecs, opens: a.opens + x.opens, loads: a.loads + x.loads }), { chats: 0, calls: 0, secs: 0, opens: 0, loads: 0 });
  const tiles: [string, string][] = [
    ["Conversations", num.format(t.chats + t.calls)],
    ["Voice calls", num.format(t.calls)],
    ["Call minutes", num.format(t.secs / 60)],
    ["Leads captured", num.format(d.leadCount)],
    ["Chat opens", num.format(t.opens)],
    ["Credit balance", fmtCredits(d.balance)],
  ];

  return (
    <Shell>
      <style>{VIZ_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Assistant report · last {d.days} days</p>
          <h1 className="mt-1 text-3xl font-semibold">{d.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{new URL(d.website).hostname}{d.status === "revoked" && <span className="ml-2 font-medium text-destructive">· paused</span>}</p>
        </div>
      </div>
      {!d.configured ? <p className="mt-8 text-muted-foreground">Usage reporting is not available yet.</p> : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map(([k, v]) => (
              <div key={k} className="card-premium p-4">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <section className="card-premium mt-6 p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Conversations per day</h2>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="viz flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--s1)" }} />Chat</span>
                <span className="viz flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--s2)" }} />Voice</span>
                <button type="button" className="hover:text-foreground" onClick={() => setTable(!table)} aria-pressed={table}>{table ? "Chart" : "Table"}</button>
              </div>
            </div>
            {table ? <UsageTable daily={d.daily} /> : <UsageChart daily={d.daily} />}
          </section>
          {d.showLeads && (
            <section className="card-premium mt-6 p-5">
              <h2 className="text-sm font-semibold">Latest leads</h2>
              {d.leads.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No leads yet.</p> : (
                <ul className="mt-3 divide-y divide-border">
                  {d.leads.map((l) => (
                    <li key={`${l.ts}-${l.name}`} className="py-2.5 text-sm">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold">{l.name}</span>
                        {l.email && <a className="flex items-center gap-1 text-primary hover:underline" href={`mailto:${l.email}`}><Mail className="size-3.5" aria-hidden />{l.email}</a>}
                        {l.phone && <a className="flex items-center gap-1 text-primary hover:underline" href={`tel:${l.phone.replace(/[^\d+]/g, "")}`}><Phone className="size-3.5" aria-hidden />{l.phone}</a>}
                        <span className="text-xs text-muted-foreground">{new Date(l.ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                      </p>
                      {l.message && <p className="mt-0.5 text-muted-foreground">{l.message}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container-site flex h-14 items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" aria-hidden />AI Assistant report</div>
      </header>
      <main className="container-site max-w-4xl py-10">{children}</main>
      <footer className="container-site max-w-4xl pb-10 text-xs text-muted-foreground">Private link. Anyone with it can see this page; ask your provider to reset it if it was shared by mistake.</footer>
    </div>
  );
}
