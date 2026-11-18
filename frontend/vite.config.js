
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "EntryCode Campus Verification",
        short_name: "EntryCode",
        description:
          "Secure campus entry and identity verification using QR credentials.",
        theme_color: "#14251d",
        background_color: "#f3efe5",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/entrycode.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },

      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
    allowedHosts: [
      ".trycloudflare.com",
    ],
  },
});
