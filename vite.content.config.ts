import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false, // Don't delete the popup build
    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      name: "content",
      fileName: () => "content.js",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});