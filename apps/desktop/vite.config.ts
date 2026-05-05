import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@alt-zmk-studio/ui/styles.css",
        replacement: fileURLToPath(new URL("../../packages/ui/src/styles.css", import.meta.url))
      },
      {
        find: "@alt-zmk-studio/core",
        replacement: fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url))
      },
      {
        find: "@alt-zmk-studio/transport",
        replacement: fileURLToPath(new URL("../../packages/transport/src/index.ts", import.meta.url))
      },
      {
        find: "@alt-zmk-studio/tauri-transport",
        replacement: fileURLToPath(new URL("../../packages/tauri-transport/src/index.ts", import.meta.url))
      },
      {
        find: "@alt-zmk-studio/ui",
        replacement: fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url))
      }
    ]
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ["VITE_", "TAURI_"]
});
