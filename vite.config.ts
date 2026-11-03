// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Expose server-only secrets (e.g. GEMINI_API_KEY) from .env to server routes in dev.
for (const [k, v] of Object.entries(loadEnv("development", process.cwd(), ""))) {
  if (!k.startsWith("VITE_")) process.env[k] ??= v;
}

// Cloudflare KV namespace that stores the widgets made in /console. Create it once with
//   npx wrangler kv namespace create WIDGETS
// and set its id in WIDGETS_KV_ID (build env / .env) or paste it here. Without it, /console cannot save in production.
const WIDGETS_KV_ID = process.env.WIDGETS_KV_ID || "";

export default defineConfig({
  nitro: {
    cloudflare: {
      wrangler: {
        name: "tachthrust-agent", // Must match the Worker name in Cloudflare Workers Builds.
        ...(WIDGETS_KV_ID ? { kv_namespaces: [{ binding: "WIDGETS", id: WIDGETS_KV_ID }] } : {}),
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
