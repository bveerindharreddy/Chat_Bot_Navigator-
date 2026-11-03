import { PAGES } from "./agent-config";
import { cart } from "@/lib/shop/cart";
import { clickableLabels, clickElement, goBack, goForward, scrollPage, sleep } from "./page-control";
import { voiceUi, type Personalization, type Pitch } from "./ui-store";

type Args = Record<string, unknown>;
type Navigate = (path: string) => Promise<void>;
export type Hooks = {
  startPresentation: () => void;
  stopPresentation: () => void;
  resumePresentation: () => void;
  openDemo: (product?: string) => void;
};

async function waitFor<T>(get: () => T | null, ms = 3000): Promise<T | null> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = get();
    if (v) return v;
    await sleep(100);
  }
  return null;
}

// Set a value the way React/native inputs expect, so listeners fire.
function setValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}


// The visible form: the demo dialog if open, otherwise the page's own form.
const form = () => document.querySelector<HTMLFormElement>("[role=dialog] form") ?? document.querySelector<HTMLFormElement>("main form");

export async function runTool(name: string, args: Args, navigate: Navigate, hooks?: Hooks): Promise<Args> {
  switch (name) {
    case "start_presentation": {
      hooks?.startPresentation();
      return { ok: true, note: "Presentation starting. The system will put each slide on screen and tell you what to say. Do not call any more tools for it." };
    }
    case "resume_presentation": {
      hooks?.resumePresentation();
      return { ok: true, note: "Resuming. The system will put the next slide on screen and tell you what to say. Say nothing about it now." };
    }
    case "stop_presentation": {
      hooks?.stopPresentation();
      return { ok: true };
    }
    case "navigate_to": {
      const path = String(args.path ?? "");
      if (!(PAGES as readonly string[]).includes(path)) return { ok: false, error: "unknown page" };
      await navigate(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return { ok: true, path };
    }
    case "scroll_to":
      return scrollPage(args);
    case "show_pitch": {
      voiceUi.set({
        pitch: {
          title: String(args.title ?? ""),
          tagline: String(args.tagline ?? ""),
          bullets: Array.isArray(args.bullets) ? args.bullets.map(String).slice(0, 5) : [],
          cta: args.cta ? String(args.cta) : undefined,
        } satisfies Pitch,
      });
      return { ok: true };
    }
    case "personalize_site": {
      voiceUi.set({
        personalization: {
          business_name: args.business_name ? String(args.business_name) : undefined,
          industry: args.industry ? String(args.industry) : undefined,
          headline: String(args.headline ?? "").slice(0, 120),
          subheadline: args.subheadline ? String(args.subheadline).slice(0, 200) : undefined,
        } satisfies Personalization,
      });
      return { ok: true };
    }
    case "open_demo_form": {
      hooks?.openDemo(typeof args.product === "string" ? args.product : undefined);
      const f = await waitFor(form);
      return f ? { ok: true } : { ok: false, error: "could not open the demo form" };
    }
    case "fill_contact_form": {
      let f = form();
      if (!f) { hooks?.openDemo(); f = await waitFor(form); } // no form on screen: open the Book a Demo dialog
      if (!f) return { ok: false, error: "no form available" };
      const filled: string[] = [];
      for (const key of ["name", "company", "email", "phone", "product", "message"]) {
        const v = args[key];
        if (typeof v !== "string" || !v) continue;
        const el = f.elements.namedItem(key) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (!el) continue;
        setValue(el, v);
        filled.push(key);
      }
      f.scrollIntoView({ behavior: "smooth", block: "center" });
      return { ok: true, filled };
    }
    case "submit_contact_form": {
      const f = form();
      if (!f) return { ok: false, error: "no form on this page" };
      f.requestSubmit();
      return { ok: true, note: "Submitted; validation errors, if any, are shown on screen." };
    }
    case "add_to_cart": {
      const ok = cart.add(String(args.item_id ?? ""), Number(args.quantity) || 1);
      return ok ? { ok: true, cart: cart.summary() } : { ok: false, error: "unknown item_id" };
    }
    case "remove_from_cart": {
      cart.remove(String(args.item_id ?? ""));
      return { ok: true, cart: cart.summary() };
    }
    case "view_cart":
      return { ok: true, cart: cart.summary(), empty: cart.get().length === 0 };
    case "click_element":
      return clickElement(args);
    case "go_back":
      return goBack();
    case "go_forward":
      return goForward();
    case "get_page_context": {
      const headings = [...document.querySelectorAll("main h1, main h2")].map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 12);
      return { ok: true, path: location.pathname, headings, clickable: clickableLabels() };
    }
    default:
      return { ok: false, error: `unknown tool ${name}` };
  }
}
