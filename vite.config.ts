/// <reference types="vitest/config" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { playwright } from "@vitest/browser-playwright";

const LITERT_WASM_DIR = "node_modules/@litertjs/core/wasm";

// LiteRT.js loads its wasm runtime from a directory at runtime, so copy it into builds
const litertWasm = (): Plugin => ({
  name: "litert-wasm",
  apply: "build",
  generateBundle() {
    for (const fileName of readdirSync(LITERT_WASM_DIR)) {
      this.emitFile({
        type: "asset",
        fileName: `litert/${fileName}`,
        source: readFileSync(join(LITERT_WASM_DIR, fileName))
      });
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": {},
  },
  plugins: [
    react(),
    litertWasm(),
    VitePWA({
      workbox: {
        globPatterns: ["**/*"],
        // The model and the LiteRT.js runtime are cached on first use instead
        globIgnores: ["**/*.tflite", "litert/**"],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            // Cross-origin patterns must match from the start of the URL. The model URL is pinned
            // to a commit, so it never changes in place, and caching it skips Hugging Face's redirect
            // to a freshly signed CDN URL that the browser can't cache.
            urlPattern: /^https:\/\/huggingface\.co\/.*\.tflite$/,
            handler: "CacheFirst",
            options: {
              cacheName: "chessqueries-model",
              // Only the current model; the old one is dropped once a new one is cached
              expiration: { maxEntries: 1 }
            }
          },
          {
            urlPattern: /(\.tflite|\/litert\/.*)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "models",
              expiration: { maxEntries: 8 }
            }
          }
        ]
      },
      includeAssets: [
          "**/*",
      ],
      manifest: {
        "name": "ChessCam",
        "short_name": "ChessCam",
        "start_url": ".",
        "icons": [
          {
              "src": "/android-chrome-192x192.png",
              "sizes": "192x192",
              "type": "image/png"
          },
          {
              "src": "/android-chrome-512x512.png",
              "sizes": "512x512",
              "type": "image/png"
          }
        ],
        "theme_color": "#212529",
        "background_color": "#212529",
        "display": "standalone"
      }
    })
  ],
  server: {
    watch: { ignored: ["**/.venv/**"] },
  },
  build: {
    chunkSizeWarningLimit: 2000, // handle warning on vendor.js bundle size
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.ts"] }
      },
      {
        // Measures real layout, so it needs a browser; jsdom has no layout engine
        extends: true,
        test: {
          name: "layout",
          include: ["src/**/*.layout.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            // Headed, as headless Chrome isn't representative of the real app
            headless: false,
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  },
});
