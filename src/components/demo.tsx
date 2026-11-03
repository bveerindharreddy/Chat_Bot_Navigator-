import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PRODUCT_OPTIONS, SITE, type ProductOption } from "@/lib/site";
import { demoSchema } from "@/lib/demo-schema";
import { submitLead } from "@/lib/lead";
import { track } from "@/lib/analytics";
import { cart } from "@/lib/shop/cart";
import { Link } from "@tanstack/react-router";

type Ctx = { openDemo: (product?: ProductOption) => void };
const DemoCtx = createContext<Ctx>({ openDemo: () => {} });
export const useDemo = () => useContext(DemoCtx);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<ProductOption>("General Enquiry");
  const [key, setKey] = useState(0);
  const openDemo = useCallback((p?: ProductOption) => {
    setProduct(p ?? "General Enquiry");
    setKey((k) => k + 1);
    setOpen(true);
    if (p) track("product_demo_click", { product: p });
  }, []);
  return (
    <DemoCtx.Provider value={{ openDemo }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Book a Demo</DialogTitle>
            <DialogDescription>
              Tell us what you're trying to achieve. We'll discuss the right approach for your business.
            </DialogDescription>
          </DialogHeader>
          <DemoForm key={key} defaultProduct={product} />
        </DialogContent>
      </Dialog>
    </DemoCtx.Provider>
  );
}

type Errors = Partial<Record<"name" | "email" | "phone" | "company" | "product" | "message", string>>;

const field =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-destructive";

export function DemoForm({ defaultProduct = "General Enquiry" }: { defaultProduct?: ProductOption }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Arriving from the shop cart: pre-fill the quote request.
  useEffect(() => {
    if (pathname !== "/contact") return;
    const items = cart.summary();
    const msg = formRef.current?.elements.namedItem("message") as HTMLTextAreaElement | null;
    if (items.length && msg && !msg.value) msg.value = `Quote request from the shop cart: ${items.join(", ")}.`;
  }, [pathname]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = demoSchema.safeParse({ ...raw, sourcePage: pathname });
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Errors;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setErrors({});
    busy.current = true;
    setState("loading");
    try {
      const d = parsed.data;
      const res = await submitLead({ name: d.name, email: d.email, phone: d.phone, company: d.company, service: d.product, message: d.message, source: pathname, website: d.website });
      if (res.ok) {
        setState("success");
        track("demo_submission_success", { product: d.product }, `demo-${Date.now()}`);
      } else {
        setServerError(res.error);
        setState("error");
      }
    } catch {
      setServerError("Something went wrong. Please try again, or email us directly.");
      setState("error");
    } finally {
      busy.current = false;
    }
  }

  if (state === "success") {
    return (
      <div role="status" className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h3 className="mt-4 text-xl font-semibold">Thank you — we've received your request.</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Our team will review your requirements and get back to you shortly.
        </p>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-err`} className="mt-1.5 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;
  const a = (k: keyof Errors) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${k}-err` : undefined,
  });

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name *</label>
          <input id="name" name="name" autoComplete="name" className={field} {...a("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" className={field} {...a("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">Phone / WhatsApp *</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+971 ..." className={field} {...a("phone")} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="company" className="mb-1.5 block text-sm font-medium">Company *</label>
          <input id="company" name="company" autoComplete="organization" className={field} {...a("company")} />
          {err("company")}
        </div>
      </div>
      <div>
        <label htmlFor="product" className="mb-1.5 block text-sm font-medium">Product of Interest *</label>
        <select id="product" name="product" defaultValue={defaultProduct} className={field} {...a("product")}>
          {PRODUCT_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {err("product")}
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Business requirements / additional information</label>
        <textarea id="message" name="message" rows={4} className={field} {...a("message")} />
        {err("message")}
      </div>
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state === "error" && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError} You can also reach us at {SITE.email}.
        </p>
      )}
      <Button type="submit" variant="hero" size="lg" disabled={state === "loading"}>
        {state === "loading" ? (<><Loader2 className="animate-spin" /> Sending…</>) : "Submit Request"}
      </Button>
      <p className="text-xs text-muted-foreground">
        We use these details only to respond to your enquiry. See our{" "}
        <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
      </p>
    </form>
  );
}
