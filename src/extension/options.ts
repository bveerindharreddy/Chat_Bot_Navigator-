// Settings page: TechThrust server address and widget key, with a live check against the server.
import { EXTENSION_ID } from "@/lib/widget/extension-id";
import { chromeApi, getSettings, normaliseServer, saveSettings } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function show(text: string, ok: boolean) {
  const el = $("result");
  el.textContent = text;
  el.dataset.ok = String(ok);
}

async function check() {
  const r = (await chromeApi.runtime.sendMessage({ type: "api", path: "/api/widget/config", body: {} })) as { ok: boolean; status: number; body: { name?: string } | null } | undefined;
  if (r?.ok && r.body?.name) return show(`Connected: “${r.body.name}” will appear on the sites you visit.`, true);
  if (!r || r.status === 0) return show("Can't reach the server. Check the address and your connection.", false);
  if (r.status === 403) return show("The server refused this widget. In the console, open the widget, switch on “Allow in the TechThrust Chrome extension”, save, and check the key.", false);
  if (r.status === 429) return show("Too many requests right now. Try again in a minute.", false);
  show(`The server answered with an error (HTTP ${r.status}).`, false);
}

async function init() {
  const s = await getSettings();
  $<HTMLInputElement>("server").value = s.server;
  $<HTMLInputElement>("key").value = s.key;
  $("ext-id").textContent = chromeApi.runtime.id || EXTENSION_ID;
  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const server = normaliseServer($<HTMLInputElement>("server").value);
    const key = $<HTMLInputElement>("key").value.trim();
    if (!server) return show("Enter the server address, e.g. https://www.yourcompany.com", false);
    if (!/^wid_[A-Za-z0-9]{20}$/.test(key)) return show("The widget key looks like wid_ followed by 20 letters and numbers.", false);
    await saveSettings({ server, key });
    $<HTMLInputElement>("server").value = server;
    show("Checking…", true);
    await check();
  });
  if (s.server && s.key) void check();
}

void init();
