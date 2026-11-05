// Settings shared by the extension's background worker, content script, popup and options page (chrome.storage.sync).
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const __EXT_DEFAULT_SERVER__: string;
export const chromeApi = (globalThis as any).chrome;

export type ExtSettings = {
  /** The TechThrust server that hosts the console, e.g. https://www.techthrust.ae */
  server: string;
  /** Widget key (wid_...) of a widget with "Allow in the Chrome extension" switched on. */
  key: string;
  /** Master switch. */
  enabled: boolean;
  /** Sites (host names) where the assistant stays hidden. */
  disabledSites: string[];
};

export const DEFAULTS: ExtSettings = { server: __EXT_DEFAULT_SERVER__, key: "", enabled: true, disabledSites: [] };

export async function getSettings(): Promise<ExtSettings> {
  const s = (await chromeApi.storage.sync.get(DEFAULTS)) as Partial<ExtSettings>;
  return { ...DEFAULTS, ...s, disabledSites: Array.isArray(s.disabledSites) ? s.disabledSites : [] };
}

export const saveSettings = (patch: Partial<ExtSettings>) => chromeApi.storage.sync.set(patch) as Promise<void>;

/** "https://www.example.com/" -> "https://www.example.com" (null if not an http(s) URL). */
export function normaliseServer(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return /^https?:$/.test(u.protocol) ? u.origin : null;
  } catch {
    return null;
  }
}

/** Messages between the content script / pages and the background worker. */
export type ApiMessage = { type: "api"; path: string; body: Record<string, unknown> };
export type BeaconMessage = { type: "beacon"; body: Record<string, unknown> };
export type TabMessage = { type: "open" } | { type: "status" };
export type TabStatus = { mounted: boolean; site: string; reason?: string };
