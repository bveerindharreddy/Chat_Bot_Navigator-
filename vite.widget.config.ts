import { defineConfig } from "vite";
import path from "node:path";

// Builds the embeddable widgets as single self-contained scripts in public/.
//   vite build --config vite.widget.config.ts --mode shopify  -> public/shopify-agent.js
//   vite build --config vite.widget.config.ts --mode widget   -> public/widget.js  (customer widgets from the console)
//   vite build --config vite.widget.config.ts --mode widget-live -> public/widget-live.js (lazy-loaded by widget.js)
const TARGETS = {
  shopify: { entry: "src/shopify-widget/index.ts", name: "TechThrustShopAgent", file: "shopify-agent.js" },
  widget: { entry: "src/widget/index.ts", name: "TechThrustWidget", file: "widget.js" },
  // realtime client + audio, loaded by widget.js only when a visitor starts a conversation
  "widget-live": { entry: "src/widget/live.ts", name: "TechThrustWidgetLive", file: "widget-live.js" },
} as const;

// Same value baked into widget.js and used to request the matching widget-live.js (cache-safe across deploys).
const BUILD = process.env.WIDGET_BUILD || Date.now().toString(36);

export default defineConfig(({ mode }) => {
  const t = TARGETS[mode as keyof typeof TARGETS] ?? TARGETS.shopify;
  return {
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    define: { "process.env.NODE_ENV": '"production"', __WIDGET_BUILD__: JSON.stringify(BUILD) },
    build: {
      lib: { entry: t.entry, formats: ["iife"], name: t.name, fileName: () => t.file },
      outDir: "public",
      emptyOutDir: false, // public/ may hold other static files
      target: "es2020",
      minify: true,
    },
  };
});
