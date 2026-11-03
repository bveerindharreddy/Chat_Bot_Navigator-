import { clickElement, clickableLabels, goBack, goForward, scrollPage, sleep, labelOf } from "@/lib/voice/page-control";

type Args = Record<string, unknown>;

/** Same-site links the assistant can use to guide the visitor. */
function siteLinks(): { label: string; path: string }[] {
  const seen = new Set<string>();
  const out: { label: string; path: string }[] = [];
  for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (a.origin !== location.origin || !labelOf(a)) continue;
    const path = a.pathname + a.search;
    if (seen.has(path)) continue;
    seen.add(path);
    out.push({ label: labelOf(a).slice(0, 50), path });
    if (out.length >= 30) break;
  }
  return out;
}

export async function runWidgetTool(name: string, args: Args, hooks: { beforeNavigate: () => void }): Promise<Args> {
  try {
    switch (name) {
      case "navigate_to": {
        const path = String(args.path ?? "");
        if (!path.startsWith("/") || path.startsWith("//")) return { ok: false, error: "path must start with a single /" };
        hooks.beforeNavigate();
        setTimeout(() => location.assign(path), 150); // let the tool result reach the model first
        return { ok: true, navigating_to: path, note: "The page is loading; the assistant reconnects on the new page." };
      }
      case "scroll_to": return scrollPage(args);
      case "click_element": return await clickElement(args);
      case "go_back": return await goBack();
      case "go_forward": return await goForward();
      case "get_page_context": {
        await sleep(0);
        return {
          ok: true,
          path: location.pathname + location.search,
          title: document.title,
          headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => h.textContent?.trim()).filter(Boolean).slice(0, 15),
          buttons_and_links: clickableLabels(),
          site_links: siteLinks(),
        };
      }
      default: return { ok: false, error: `unknown tool ${name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "tool failed" };
  }
}
