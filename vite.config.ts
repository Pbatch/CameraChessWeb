import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

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
        "theme_color": "#ffffff",
        "background_color": "#ffffff",
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
});
