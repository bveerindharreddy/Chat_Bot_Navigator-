// Background service worker: the only part of the extension that talks to the TechThrust server.
// Requests leave with the extension's own origin (chrome-extension://<id>), which a widget accepts only when
// "Allow in the Chrome extension" is on in the console. Only the four widget endpoints can be called, and the
// widget key always comes from the extension's settings, never from the web page.
import { chromeApi, getSettings, type ApiMessage, type BeaconMessage } from "./settings";

const ALLOWED = /^\/api\/widget\/(config|token|event|lead)$/;

async function call(path: string, body: Record<string, unknown>, asText = false) {
  const { server, key } = await getSettings();
  if (!server || !key || !ALLOWED.test(path)) return { ok: false, status: 0, body: null };
  try {
    const res = await fetch(`${server}${path}`, {
      method: "POST",
      headers: { "Content-Type": asText ? "text/plain" : "application/json" },
      body: JSON.stringify({ ...body, key }),
    });
    return { ok: res.ok, status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

chromeApi.runtime.onMessage.addListener((msg: ApiMessage | BeaconMessage, _sender: unknown, reply: (r: unknown) => void) => {
  if (msg?.type === "api") {
    void call(msg.path, msg.body ?? {}).then(reply);
    return true; // async reply
  }
  if (msg?.type === "beacon") void call("/api/widget/event", msg.body ?? {}, true);
  return false;
});

// First install: open the settings page so the server and widget key can be entered.
chromeApi.runtime.onInstalled.addListener((d: { reason: string }) => {
  if (d.reason === "install") chromeApi.runtime.openOptionsPage();
});
