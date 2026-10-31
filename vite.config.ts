import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import legacy from "@vitejs/plugin-legacy";

// Safety net: a Vercel *production* build without the Supabase keys would put the real site
// into demo mode (fake code 123456, nothing saved). Fail the build instead — Vercel then
// keeps the last working version live.
if (process.env.VERCEL_ENV === "production" && (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY)) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set for Production in Vercel → Settings → Environment Variables. Build stopped so the live site doesn't fall back to demo mode.",
  );
}

export default defineConfig({
  plugins: [
    react(),
    // Older phones/browsers (common across Nigeria) get a transpiled + polyfilled bundle.
    legacy({
      targets: ["defaults", "iOS >= 12", "Safari >= 12", "Android >= 5", "Chrome >= 49", "Samsung >= 6", "UCAndroid >= 11", "OperaMobile >= 46"],
      modernPolyfills: true,
    }),
    VitePWA({
      registerType: "autoUpdate", // fixes reach everyone on next load
      includeAssets: ["tyche-logo.png", "tyche-mark.png", "support-agent.jpg", "icons/apple-touch-icon.png", "icons/favicon-64.png"],
      manifest: {
        id: "/",
        name: "Tyche — Safety, support & justice",
        short_name: "Tyche",
        description:
          "Keep your evidence safe, talk to a verified lawyer, report when you're ready, and find your people. Built for women in Nigeria.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        background_color: "#FFFBF7",
        theme_color: "#5E268B",
        lang: "en-NG",
        categories: ["lifestyle", "social", "productivity"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Report harassment", short_name: "Report", url: "/report", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Hire a lawyer", short_name: "Lawyers", url: "/hire", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Messages", short_name: "Messages", url: "/messages", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "My space", short_name: "My space", url: "/me", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        // Only the app shell and static assets are cached — never user data.
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,woff2}"],
        globIgnores: ["**/*-legacy-*.js"], // old browsers fetch these on demand
        importScripts: ["/push-handler.js"], // push notifications
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Fonts are bundled (woff2 above), so nothing is fetched from Google.
      },
      devOptions: { enabled: false },
    }),
  ],
});
