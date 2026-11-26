/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * v1.0：GitHub Pages 靜態入口，沿用既有元件與 public 素材。
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = dirname(fileURLToPath(import.meta.url));
const base = "/GPT/chinese-history/";
const publicDirectory = resolve(project, "public");
const publicFiles = new Set();
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) await collect(filename);
    else publicFiles.add(relative(publicDirectory, filename).replaceAll("\\", "/"));
  }
}
await collect(publicDirectory);

export default defineConfig({
  root: resolve(project, "pages"),
  base,
  publicDir: publicDirectory,
  cacheDir: resolve(project, ".pages-cache"),
  plugins: [
    {
      name: "history-pages-public-paths",
      enforce: "pre",
      transform(code, id) {
        if (!/[/\\]app[/\\].*\.(tsx?|json)$/.test(id.split("?")[0])) return;
        const result = code.replace(/(["'])(\/[^"'\s]+)\1/g, (original, quote, filename) =>
          publicFiles.has(filename.slice(1)) ? quote + base + "public/" + filename.slice(1) + quote : original);
        return result === code ? undefined : { code: result, map: null };
      },
    },
    react(),
  ],
  experimental: {
    renderBuiltUrl(filename, { type }) {
      if (type === "public") return base + "public/" + filename;
    },
  },
  build: {
    outDir: resolve(project, "pages-dist"),
    emptyOutDir: false,
    copyPublicDir: false,
    assetsDir: "pages-assets",
  },
});
