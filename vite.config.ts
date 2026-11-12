/// <reference types="vitest/config" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { playwright } from "@vitest/browser-playwright";

const LITERT_WASM_DIR = "node_modules/@litertjs/core/wasm";
const LITERT_VERSION: string = JSON.parse(readFileSync("node_modules/@litertjs/core/package.json", "utf8")).version;

// LiteRT.js loads its wasm runtime from a directory at runtime, so copy it into builds.
// The directory is versioned, as the service worker caches it first and a newer LiteRT.js
// breaks on an older runtime.
const litertWasm = (): Plugin => ({
  name: "litert-wasm",
  apply: "build",
  generateBundle() {
    for (const fileName of readdirSync(LITERT_WASM_DIR)) {
      this.emitFile({
        type: "asset",
        fileName: `litert/${LITERT_VERSION}/${fileName}`,
        source: readFileSync(join(LITERT_WASM_DIR, fileName))
      });
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    litertWasm(),
    VitePWA({
      workbox: {
        globPatterns: ["**/*"],
        // The model, the LiteRT.js runtime and Stockfish (upload mode only) are cached on first use instead
        globIgnores: ["**/*.tflite", "litert/**", "**/stockfish-*"],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          {
            // The piece model, fetched by scripts/fetchModel.mjs. Each model has its own file name, so
            // it never changes in place; too big to precache with the app.
            urlPattern: /\/models\/[^/]*\.tflite$/,
            handler: "CacheFirst",
            options: {
              cacheName: "chessqueries-model",
              // Only the current model; the old one is dropped once a new one is cached
              expiration: { maxEntries: 1 }
            }
          },
          {
            // Hashed by Vite, so never changes in place
            urlPattern: /\/assets\/stockfish-[^/]*\.(js|wasm)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "stockfish",
              expiration: { maxEntries: 2 }
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
      manifest: {
        "id": "/",
        "name": "ChessCam",
        "short_name": "ChessCam",
        "description": "Turn your phone camera into a chess eBoard. ChessCam recognises moves on a real board, entirely on your device, so you can record games, play and broadcast on Lichess, or digitise videos.",
        "categories": ["games", "sports"],
        "orientation": "landscape",
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
  optimizeDeps: {
    // Pre-bundling would move the recorder's code away from its worker file, which it loads by a URL relative to
    // itself
    exclude: ["@chesscam/recorder"]
  },
  preview: {
    // Cross-origin isolation enables SharedArrayBuffer, so the CPU fallback can use wasm threads.
    // credentialless still allows CORS requests, such as the icons from jsDelivr.
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless"
    }
  },
  build: {
    chunkSizeWarningLimit: 2000, // handle warning on vendor.js bundle size
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["src/**/*.test.ts"], setupFiles: ["src/test/setup.ts"] }
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
            headless: true,
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  },
});
