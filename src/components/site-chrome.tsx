import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Mail, Menu, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { useDemo } from "@/components/demo";
import { PRODUCTS, SERVICES, SITE } from "@/lib/site";
import { CONSENT_KEY, GA_ID, loadAnalytics, track } from "@/lib/analytics";
import { useCartCount } from "@/lib/shop/cart";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight" aria-label="TechThrust home">
      <span className="relative inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="font-display text-sm font-bold">T</span>
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand" />
      </span>
      <span>Tech<span className="text-primary">Thrust</span></span>
    </Link>
  );
}

const navLink = "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

function CartBadge() {
  const count = useCartCount();
  return count > 0 ? <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{count}</span> : null;
}

export function Header() {
  const { openDemo } = useDemo();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobile, setMobile] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled || mobile ? "border-border bg-background/85 backdrop-blur-xl" : "border-transparent"}`}>
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-18">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <Dropdown label="AI Products">
            <Link to="/products" className="block rounded-lg px-3 py-2.5 hover:bg-accent">
              <span className="font-semibold">All AI Products</span>
              <span className="block text-xs text-muted-foreground">Compare and find the right fit</span>
            </Link>
            {PRODUCTS.map((p) => (
              <Link key={p.slug} to={p.to} className="block rounded-lg px-3 py-2.5 hover:bg-accent">
                <span className="font-semibold">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.positioning}</span>
              </Link>
            ))}
          </Dropdown>
          <Dropdown label="Services">
            {SERVICES.map((s) => (
              <Link key={s.id} to="/services" hash={s.id} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-accent">
                {s.name}
              </Link>
            ))}
          </Dropdown>
          <Link to="/about" className={navLink} activeProps={{ className: "text-foreground" }}>About</Link>
          <Link to="/presentation" className={navLink}>Presentation</Link>
          <Link to="/shop" className={navLink} activeProps={{ className: "text-foreground" }}>Shop<CartBadge /></Link>
          <Link to="/contact" className={navLink} activeProps={{ className: "text-foreground" }}>Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="hero" className="hidden sm:inline-flex" onClick={() => openDemo()}>Book a Demo</Button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border lg:hidden"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            aria-controls="mobile-nav"
            onClick={() => setMobile((m) => !m)}
          >
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobile && (
        <nav id="mobile-nav" aria-label="Mobile" className="container-site max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border pb-6 pt-2 lg:hidden">
          {[
            { k: "products", label: "AI Products", items: [{ to: "/products" as const, label: "All AI Products" }, ...PRODUCTS.map((p) => ({ to: p.to, label: p.name }))] },
          ].map((g) => (
            <div key={g.k} className="border-b border-border">
              <button type="button" className="flex w-full items-center justify-between py-4 text-left font-semibold" aria-expanded={sub === g.k} onClick={() => setSub(sub === g.k ? null : g.k)}>
                {g.label}
                <ChevronDown className={`size-4 transition-transform ${sub === g.k ? "rotate-180" : ""}`} />
              </button>
              {sub === g.k && (
                <div className="grid pb-3">
                  {g.items.map((i) => (
                    <Link key={i.to} to={i.to} className="py-2.5 pl-3 text-muted-foreground hover:text-primary">{i.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="border-b border-border">
            <button type="button" className="flex w-full items-center justify-between py-4 text-left font-semibold" aria-expanded={sub === "services"} onClick={() => setSub(sub === "services" ? null : "services")}>
              Services
              <ChevronDown className={`size-4 transition-transform ${sub === "services" ? "rotate-180" : ""}`} />
            </button>
            {sub === "services" && (
              <div className="grid pb-3">
                {SERVICES.map((s) => (
                  <Link key={s.id} to="/services" hash={s.id} onClick={() => setMobile(false)} className="py-2.5 pl-3 text-muted-foreground hover:text-primary">{s.name}</Link>
                ))}
              </div>
            )}
          </div>
          {([["/about", "About"], ["/presentation", "Presentation"], ["/shop", "Shop"], ["/contact", "Contact"]] as const).map(([to, l]) => (
            <Link key={to} to={to} className="block border-b border-border py-4 font-semibold">{l}</Link>
          ))}
          <Button variant="hero" size="lg" className="mt-6 w-full" onClick={() => { setMobile(false); openDemo(); }}>Book a Demo</Button>
        </nav>
      )}
    </header>
  );
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button type="button" className={`${navLink} inline-flex items-center gap-1`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        {label} <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2 animate-in fade-in slide-in-from-top-1">
          <div className="w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl" onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function ContactLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`}>
      <a href={`mailto:${SITE.email}`} onClick={() => track("email_click")} className="inline-flex items-center gap-2.5 hover:text-primary">
        <Mail className="size-4 text-primary" aria-hidden /> {SITE.email}
      </a>
      <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click")} className="inline-flex items-center gap-2.5 hover:text-primary">
        <MessageCircle className="size-4 text-primary" aria-hidden /> WhatsApp {SITE.whatsappDisplay}
      </a>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const col = "grid gap-2.5 text-sm text-muted-foreground";
  const h = "mb-4 text-sm font-semibold text-foreground";
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 font-display font-semibold">{SITE.tagline}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            An AI-first technology company based in the {SITE.location}, serving businesses internationally.
          </p>
          <ContactLinks className="mt-6 text-sm" />
        </div>
        <div>
          <p className={h}>AI Products</p>
          <div className={col}>
            <Link to="/products" className="hover:text-primary">Overview</Link>
            {PRODUCTS.map((p) => <Link key={p.slug} to={p.to} className="hover:text-primary">{p.name}</Link>)}
          </div>
        </div>
        <div>
          <p className={h}>Services</p>
          <div className={col}>
            {SERVICES.map((s) => <Link key={s.id} to="/services" hash={s.id} className="hover:text-primary">{s.name}</Link>)}
          </div>
        </div>
        <div>
          <p className={h}>Company</p>
          <div className={col}>
            <Link to="/about" className="hover:text-primary">About Us</Link>
            <Link to="/presentation" className="hover:text-primary">Presentation</Link>
            <Link to="/shop" className="hover:text-primary">Shop</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {year} {SITE.legal}. All rights reserved.</p>
          <p>{SITE.location} · Serving customers worldwide</p>
        </div>
      </div>
    </footer>
  );
}

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!GA_ID) return;
    const c = localStorage.getItem(CONSENT_KEY);
    if (!c) setShow(true);
    else loadAnalytics();
  }, []);
  if (!show) return null;
  const decide = (v: "granted" | "denied") => {
    localStorage.setItem(CONSENT_KEY, v);
    setShow(false);
    loadAnalytics();
  };
  return (
    <div role="dialog" aria-label="Analytics consent" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-popover p-5 text-sm shadow-2xl">
      <p className="text-muted-foreground">
        We'd like to use analytics cookies to understand how our website is used. See our{" "}
        <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="hero" onClick={() => decide("granted")}>Accept</Button>
        <Button size="sm" variant="heroOutline" onClick={() => decide("denied")}>Decline</Button>
      </div>
    </div>
  );
}
