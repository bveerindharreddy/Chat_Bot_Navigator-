// Content script: mounts the same widget as the website embed on the pages you visit, as a companion.
// The realtime client and audio code are bundled into the extension (extensions may not load remote code).
import { GoogleGenAI } from "@google/genai";
import { MicCapture, Player } from "@/lib/voice/audio";
import { fetchConfig, Widget, type WidgetIO } from "@/widget/core";
import type { LiveModule } from "@/widget/live";
import { chromeApi, getSettings, type TabMessage, type TabStatus } from "./settings";

const live: LiveModule = { Client: GoogleGenAI, Mic: MicCapture, Speaker: Player };

const io: WidgetIO = {
  key: "",
  home: "",
  hostId: "techthrust-ext-widget",
  storeKey: "techthrust-ext-widget",
  loadLive: async () => live,
  post: async (path, body) => (await chromeApi.runtime.sendMessage({ type: "api", path, body })) ?? { ok: false, status: 0, body: null },
  beacon: (type, extra = {}) => {
    try { void chromeApi.runtime.sendMessage({ type: "beacon", body: { type, ...extra } }); } catch { /* extension reloaded */ }
  },
};

/** The site embeds its own TechThrust widget (already mounted, or its script tag is still loading). */
const siteHasWidget = () => !!document.getElementById("techthrust-widget") || !!document.querySelector('script[src*="/widget.js"][data-key]');

let widget: Widget | null = null;
let mountedFor = ""; // server + key the current widget was mounted with
let busy = false;
let again = false; // settings changed while a sync was running
let reason = "";

/** Mount, unmount or remount the widget to match the settings for this site. */
async function sync() {
  if (busy) { again = true; return; }
  busy = true;
  try {
    const s = await getSettings();
    const want = `${s.server}|${s.key}`;
    reason = !s.enabled ? "off" : !s.server || !s.key ? "setup" : s.disabledSites.includes(location.host) ? "site-off"
      : siteHasWidget() ? "site-has-widget" : "";
    if ((reason || mountedFor !== want) && widget) { widget.destroy(); widget = null; mountedFor = ""; }
    if (!reason && !widget) {
      io.key = s.key; io.home = s.server;
      const cfg = await fetchConfig(io).catch(() => null);
      if (cfg) { widget = new Widget(cfg, io); mountedFor = want; }
      else reason = "not-allowed";
    }
  } finally {
    busy = false;
    if (again) { again = false; void sync(); }
  }
}

chromeApi.runtime.onMessage.addListener((msg: TabMessage, _sender: unknown, reply: (r: TabStatus) => void) => {
  if (msg?.type === "open") widget?.show();
  reply({ mounted: !!widget, site: location.host, reason: widget ? undefined : reason });
  return false;
});
chromeApi.storage.onChanged.addListener(() => void sync());

if (window.top === window && /^https?:$/.test(location.protocol)) {
  void sync();
  // A site widget added later (single-page apps, tag managers) takes over: the extension steps aside.
  new MutationObserver(() => { if (widget && siteHasWidget()) void sync(); }).observe(document.documentElement, { childList: true, subtree: true });
}
