
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Smart QR Student Verification",
        short_name: "QR Verify",
        description:
          "Student identity verification using secure QR credentials.",
        theme_color: "#123b70",
        background_color: "#f1f5f9",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },

      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
});
