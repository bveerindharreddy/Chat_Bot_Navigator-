/**
 * Analytics helper. GA4 loads only when VITE_GA4_MEASUREMENT_ID is set AND the
 * visitor has accepted analytics cookies. Events are no-ops otherwise.
 */
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export const GA_ID = (import.meta.env["VITE_GA4_MEASUREMENT_ID"] as string | undefined) || "";
export const CONSENT_KEY = "tt-analytics-consent";

let loaded = false;

export function loadAnalytics() {
  if (typeof window === "undefined" || loaded || !GA_ID) return;
  if (localStorage.getItem(CONSENT_KEY) !== "granted") return;
  loaded = true;
  const w = window as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID, { anonymize_ip: true });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

const fired = new Set<string>();

export function track(event: string, params: Record<string, unknown> = {}, onceKey?: string) {
  if (typeof window === "undefined") return;
  if (onceKey) {
    if (fired.has(onceKey)) return;
    fired.add(onceKey);
  }
  const w = window as GtagWindow;
  if (w.gtag) w.gtag("event", event, params);
}
