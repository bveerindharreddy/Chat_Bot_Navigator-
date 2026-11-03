import { defineConfig } from "vite";
import path from "node:path";

// Builds the embeddable widgets as single self-contained scripts in public/.
//   vite build --config vite.widget.config.ts --mode shopify  -> public/shopify-agent.js
//   vite build --config vite.widget.config.ts --mode widget   -> public/widget.js  (customer widgets from the console)
const TARGETS = {
  shopify: { entry: "src/shopify-widget/index.ts", name: "TechThrustShopAgent", file: "shopify-agent.js" },
  widget: { entry: "src/widget/index.ts", name: "TechThrustWidget", file: "widget.js" },
} as const;

export default defineConfig(({ mode }) => {
  const t = TARGETS[mode as keyof typeof TARGETS] ?? TARGETS.shopify;
  return {
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    define: { "process.env.NODE_ENV": '"production"' },
    build: {
      lib: { entry: t.entry, formats: ["iife"], name: t.name, fileName: () => t.file },
      outDir: "public",
      emptyOutDir: false, // public/ may hold other static files
      target: "es2020",
      minify: true,
    },
  };
});
