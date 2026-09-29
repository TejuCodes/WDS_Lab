import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The dev server talks to /api on port 5000. Using a proxy means the
    // frontend can just call "/api/owasp/timeline" and Vite forwards it to
    // the Express server. No CORS problems in development, and the
    // production build can be pointed at any host without code changes.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
