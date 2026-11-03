import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="container-site max-w-3xl py-20">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{title}</h1>
      <p className="mt-4 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm">
        Draft for review. This document must be reviewed by qualified legal counsel and completed with business-specific details before final publication.
      </p>
      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground">{children}</div>
    </article>
  );
}
