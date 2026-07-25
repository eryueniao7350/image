import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Derived from SITE_URL so the bundle, the generated static pages (which use
// BASE from scripts/shared-utils.mjs) and the router all agree on one prefix.
// GitHub Pages without a custom domain serves the project under /<repo>/;
// a root deployment or local dev leaves this as "/".
const base = process.env.SITE_URL
  ? new URL(process.env.SITE_URL).pathname.replace(/\/*$/, "/")
  : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
})
