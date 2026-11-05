// Toolbar popup: status for the current site, on/off for this site, everywhere switch, open the assistant.
import { chromeApi, getSettings, saveSettings, type TabStatus } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const REASONS: Record<string, string> = {
  setup: "Add your server and widget key in Settings to start.",
  off: "The assistant is switched off everywhere.",
  "site-off": "The assistant is hidden on this site.",
  "site-has-widget": "This site already has its own assistant.",
  "not-allowed": "This widget is not enabled for the Chrome extension, or the key is wrong. Check Settings.",
};

async function tabStatus(tabId: number): Promise<TabStatus | null> {
  try { return (await chromeApi.tabs.sendMessage(tabId, { type: "status" })) as TabStatus; } catch { return null; }
}

async function render() {
  const s = await getSettings();
  const [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
  const st = tab?.id !== undefined ? await tabStatus(tab.id) : null;
  $("server").textContent = s.server ? new URL(s.server).host : "Not set up";
  $<HTMLInputElement>("everywhere").checked = s.enabled;
  const site = st?.site ?? "";
  $("site-name").textContent = site || "this page";
  $<HTMLInputElement>("here").checked = !!site && !s.disabledSites.includes(site);
  $<HTMLInputElement>("here").disabled = !site;
  $<HTMLButtonElement>("open").disabled = !st?.mounted;
  $("status").textContent = !st ? "The assistant can't run on this page (browser or store pages)." : st.mounted ? "Ready on this site." : REASONS[st.reason ?? ""] ?? "Starting…";
  $("status").dataset.ok = String(!!st?.mounted);

  $<HTMLInputElement>("everywhere").onchange = async (e) => { await saveSettings({ enabled: (e.target as HTMLInputElement).checked }); setTimeout(render, 300); };
  $<HTMLInputElement>("here").onchange = async (e) => {
    const on = (e.target as HTMLInputElement).checked;
    const list = new Set(s.disabledSites);
    if (on) list.delete(site); else list.add(site);
    await saveSettings({ disabledSites: [...list] });
    setTimeout(render, 300);
  };
  $("open").onclick = async () => { if (tab?.id !== undefined) await chromeApi.tabs.sendMessage(tab.id, { type: "open" }); window.close(); };
  $("settings").onclick = () => chromeApi.runtime.openOptionsPage();
}

void render();
