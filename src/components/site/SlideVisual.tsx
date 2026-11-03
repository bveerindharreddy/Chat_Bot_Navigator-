import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronRight } from "lucide-react";
import type { Visual } from "@/lib/presentation/slides";

// Theme variables (not Tailwind classes) so charts follow light/dark mode.
const PRIMARY = "var(--primary)";
const GRID = "var(--border)";
const TICK = { fill: "var(--muted-foreground)", fontSize: 12 };
const TIP = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--popover-foreground)" };

function ChartCard({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-4">
      <div className="font-display text-sm font-semibold">{title}</div>
      <div className="mt-2 h-44">{children}</div>
      <div className="mt-2 text-[11px] leading-snug text-muted-foreground">Source: {source}</div>
    </div>
  );
}

export default function SlideVisual({ v }: { v: Visual }) {
  if (v.type === "bars")
    return (
      <ChartCard title={v.title} source={v.source}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={v.data} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TIP} cursor={{ fill: "var(--muted)" }} formatter={(x) => [`${x} ${v.unit}`, ""]} />
            <Bar dataKey="value" fill={PRIMARY} radius={[6, 6, 0, 0]}>
              <LabelList dataKey="value" position="top" fill="var(--foreground)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );

  if (v.type === "area")
    return (
      <ChartCard title={v.title} source={v.source}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={v.data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TIP} formatter={(x) => [`${x} ${v.unit}`, ""]} />
            <Area type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2.5} fill="url(#areaFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    );

  if (v.type === "compare")
    return (
      <div className="card-premium overflow-hidden text-sm">
        <div className="grid grid-cols-[1.1fr_1fr_1.4fr] bg-muted eyebrow !text-[11px]">
          {v.head.map((h, i) => <div key={i} className={`px-4 py-3 ${i === 2 ? "" : "!text-muted-foreground"}`}>{h}</div>)}
        </div>
        {v.rows.map((r) => (
          <div key={r[0]} className="grid grid-cols-[1.1fr_1fr_1.4fr] border-t border-border">
            <div className="px-4 py-3 text-muted-foreground">{r[0]}</div>
            <div className="px-4 py-3 text-muted-foreground/80">{r[1]}</div>
            <div className="px-4 py-3 font-semibold">{r[2]}</div>
          </div>
        ))}
      </div>
    );

  if (v.type === "flow")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {v.steps.map((s, i) => (
          <div key={s.label} className="card-premium relative p-4">
            <div className="font-display text-xs font-semibold text-brand">0{i + 1}</div>
            <div className="mt-1 font-display text-lg font-semibold">{s.label}</div>
            <div className="mt-1 text-xs leading-snug text-muted-foreground">{s.sub}</div>
            {i % 2 === 0 && i < v.steps.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-primary sm:block" />}
          </div>
        ))}
      </div>
    );

  return (
    <div className="flex flex-wrap gap-2">
      {v.items.map((m) => <span key={m} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">{m}</span>)}
    </div>
  );
}
