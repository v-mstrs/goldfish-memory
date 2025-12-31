import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Keep the root at the project level so it finds the 'public' folder
  root: resolve(__dirname, "src/popup"),
  publicDir: resolve(__dirname, "public"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Since root is src/popup, index.html is just "index.html"
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {
        // This flattens the output so index.html and popup.js 
        // end up in the root of /dist/
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      }
    }
  }
});