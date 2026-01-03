import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  esbuild: {
    charset: "ascii",
  },
  build: {
    outDir: "dist",
    emptyOutDir: false, 
    lib: {
      entry: resolve(__dirname, "src/background.ts"),
      name: "background",
      fileName: () => "background.js",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});