import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  preview: {
    host: "0.0.0.0",
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    allowedHosts: [
      "finpal-pocket-planner-55-development.up.railway.app",
      "pocketpenny.site",
      "www.pocketpenny.site"
    ],
  },
  plugins: [
    react(),
    // Only include lovable-tagger in development mode
    ...(mode === 'development' ? [
      async () => {
        try {
          const { componentTagger } = await import("lovable-tagger");
          return componentTagger();
        } catch {
          // Gracefully handle missing lovable-tagger in production
          return null;
        }
      }
    ] : [])
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
