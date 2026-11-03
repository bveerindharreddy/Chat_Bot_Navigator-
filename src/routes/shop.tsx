import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Brain, Check, MessageSquare, Minus, PhoneCall, Plus, Rocket, ShoppingCart, Trash2, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Reveal } from "@/components/ui-kit";
import { PRODUCTS, productById, type Category } from "@/lib/shop/catalog";
import { cart, useCart } from "@/lib/shop/cart";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  head: () => seo({ title: "Shop — Build Your TechThrust Package", description: "Pick the TechThrust products and services you need, add them to your cart and request a tailored quote.", path: "/shop" }),
  component: ShopPage,
});

const ICONS: Record<string, LucideIcon> = { bot: Bot, phone: PhoneCall, message: MessageSquare, zap: Zap, brain: Brain, trending: TrendingUp, rocket: Rocket };
const FILTERS: ("All" | Category)[] = ["All", "AI Products", "Services"];

function ShopPage() {
  const router = useRouter();
  const lines = useCart();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [flash, setFlash] = useState<string | null>(null);
  const shown = PRODUCTS.filter((p) => filter === "All" || p.category === filter);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const add = (id: string) => {
    cart.add(id);
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1400);
  };

  return (
    <>
      <PageHero eyebrow="Shop" title="Build Your Package." text="Add the products and services you need to your cart, then send it to us as a quote request. Every engagement is scoped to your requirements, so there are no fixed prices." />
      <section className="container-site grid items-start gap-8 py-16 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
            {FILTERS.map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "hero" : "heroOutline"} onClick={() => setFilter(f)}>{f}</Button>
            ))}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p, i) => {
              const Icon = ICONS[p.icon] ?? Bot;
              const inCart = lines.find((l) => l.id === p.id);
              return (
                <Reveal key={p.id} delay={(i % 3) * 60}>
                  <div data-product={p.id} className="card-premium card-hover flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
                      <span className="eyebrow !text-[10px] !text-muted-foreground">{p.category}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                    <ul className="mt-4 space-y-1.5 text-sm">
                      {p.includes.map((inc) => <li key={inc} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{inc}</li>)}
                    </ul>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="text-sm font-semibold text-brand">Custom quote</span>
                      <Button size="sm" variant="hero" onClick={() => add(p.id)} aria-label={`Add ${p.name} to cart`}>
                        {flash === p.id ? <><Check /> Added</> : <><ShoppingCart /> {inCart ? `In cart (${inCart.qty})` : "Add to cart"}</>}
                      </Button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <aside id="cart" className="card-premium p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><ShoppingCart className="size-5 text-primary" aria-hidden /> Your cart</h2>
            <span className="text-xs text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>
          </div>

          {lines.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Your cart is empty. Add a product or service to get started.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {lines.map((l) => {
                const p = productById(l.id)!;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button aria-label="Decrease" onClick={() => cart.setQty(l.id, l.qty - 1)} className="flex size-7 items-center justify-center rounded-full border border-border hover:border-primary/60"><Minus className="size-3" /></button>
                      <span className="w-5 text-center tabular-nums">{l.qty}</span>
                      <button aria-label="Increase" onClick={() => cart.setQty(l.id, l.qty + 1)} className="flex size-7 items-center justify-center rounded-full border border-border hover:border-primary/60"><Plus className="size-3" /></button>
                      <button aria-label={`Remove ${p.name}`} onClick={() => cart.remove(l.id)} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-semibold text-brand">Custom quote</span></div>
            <Button variant="hero" className="mt-4 w-full" disabled={lines.length === 0} onClick={() => router.navigate({ to: "/contact" })}>Request a quote</Button>
            {lines.length > 0 && <button onClick={() => cart.clear()} className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground">Clear cart</button>}
            <p className="mt-4 text-[11px] leading-snug text-muted-foreground">No payment is taken here. Your selection is sent to our team as a quote request. <Link to="/contact" className="text-primary underline">Contact us</Link></p>
          </div>
        </aside>
      </section>
    </>
  );
}
