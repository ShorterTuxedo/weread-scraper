import { defineConfig } from "vite";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: false,
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "WeRead Scraper",
        icon: "https://weread.qq.com/favicon.ico",
        namespace: "https://github.com/Sec-ant/weread-scraper",
        match: [
          "https://weread.qq.com/web/reader/*",
          "https://weread.qq.com/web/book/read*",
        ],
        grant: [
          "GM_registerMenuCommand",
          "GM_unregisterMenuCommand",
          "GM_getValue",
          "GM_setValue",
          "GM_deleteValue",
          "GM_webRequest",
          "GM_xmlhttpRequest",
          "GM_getResourceURL",
        ],
        connect: ["weread.qq.com", "tencent-cloud.com", "*"],
        "run-at": "document-start",
      },
      build: {
        externalGlobals: {
          "minify-html-wasm": cdn.jsdelivrFastly(
            "wasm_bindgen",
            "dist/no-modules/index.min.js"
          ),
          "zustand/vanilla": cdn.jsdelivrFastly(
            "zustandVanilla",
            "umd/vanilla.production.js"
          ),
          "zustand/middleware": cdn.jsdelivrFastly(
            "zustandMiddleware",
            "umd/middleware.production.js"
          ),
          "@trim21/gm-fetch": cdn.jsdelivrFastly(
            "GM_fetch",
            "dist/gm_fetch.min.js"
          ),
        },
        externalResource: {
          "minify-html-wasm/no-modules/wasm?url": cdn.jsdelivrFastly(),
        },
      },
    }),
  ],
});
