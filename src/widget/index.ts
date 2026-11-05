// Website embed, built to public/widget.js.
// Install: <script src="https://<host>/widget.js" data-key="<widget key>" defer></script>
// The key is just an id. Prompt, tools and model settings are stored and applied on the server.
import type { LiveModule } from "./live";
import { fetchConfig, Widget, WidgetError, type WidgetIO } from "./core";

declare const __WIDGET_BUILD__: string;

const script = document.currentScript as HTMLScriptElement | null;
const API = script?.src ? new URL(script.src).origin : location.origin;
const KEY = script?.dataset.key ?? "";

// The realtime client and audio code live in widget-live.js and load on first use (see live.ts).
let liveModule: Promise<LiveModule> | null = null;
function loadLive(): Promise<LiveModule> {
  return (liveModule ??= new Promise<LiveModule>((resolve, reject) => {
    const w = window as unknown as { __techthrustWidgetLive?: LiveModule };
    if (w.__techthrustWidgetLive) return resolve(w.__techthrustWidgetLive);
    const s = document.createElement("script");
    s.src = `${API}/widget-live.js?v=${__WIDGET_BUILD__}`;
    s.async = true;
    s.onload = () => (w.__techthrustWidgetLive ? resolve(w.__techthrustWidgetLive) : reject(new WidgetError("failed")));
    s.onerror = () => { liveModule = null; reject(new WidgetError("connection")); };
    document.head.appendChild(s);
  }));
}

const io: WidgetIO = {
  key: KEY,
  home: API,
  hostId: "techthrust-widget",
  storeKey: "techthrust-widget",
  loadLive,
  post: async (path, body) => {
    const res = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
  },
  // text/plain keeps it a simple request that survives page unload.
  beacon: (type, extra = {}) => {
    const data = JSON.stringify({ key: KEY, type, ...extra });
    const url = `${API}/api/widget/event`;
    try { if (navigator.sendBeacon?.(url, new Blob([data], { type: "text/plain" }))) return; } catch { /* fall back to fetch */ }
    fetch(url, { method: "POST", body: data, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  },
};

async function boot() {
  if (document.getElementById(io.hostId)) return;
  if (!KEY) { console.warn("[widget] missing data-key"); return; }
  try {
    const cfg = await fetchConfig(io);
    if (!cfg) { console.warn("[widget] not available on this site"); return; }
    new Widget(cfg, io);
  } catch { /* the host site must never break because of the widget */ }
}

if (document.body) void boot();
else addEventListener("DOMContentLoaded", () => void boot());
