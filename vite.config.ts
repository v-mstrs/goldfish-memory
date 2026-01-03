import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // This is the "Magic" part: Make Vite think the project lives inside the popup folder
  root: resolve(__dirname, "src/popup"),
  
  // Point this back to your actual public folder so manifest.json works
  publicDir: resolve(__dirname, "public"),

  build: {
    // Point this back to your actual dist folder
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Since 'root' is src/popup, Vite looks for index.html right here
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {

        // Forces the JS and CSS to be named exactly this, no folders
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]", 

      }
    }
  }
});