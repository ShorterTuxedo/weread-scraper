import { defineConfig } from "vite";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: false,
  plugins: [
    monkey({
      build: {
        externalGlobals: {
          "zustand/vanilla": cdn.jsdelivrFastly(
            "zustandVanilla",
            "umd/vanilla.production.js"
          ),
          "zustand/middleware": cdn.jsdelivrFastly(
            "zustandMiddleware",
            "umd/middleware.production.js"
          ),
          "html-minifier-terser": cdn.jsdelivrFastly(
            "HTMLMinifier",
            "dist/htmlminifier.umd.bundle.min.js"
          ),
        },
      },
      entry: "src/main.ts",
      userscript: {
        name: "WeRead Scraper",
        icon: "https://weread.qq.com/favicon.ico",
        namespace: "https://github.com/Sec-ant/weread-scraper",
        match: [
          "https://weread.qq.com/web/reader/*",
          "https://weread.qq.com/web/book/read*",
          "https://weread.qq.com/web/book/chapter/e_*",
        ],
        grant: [
          "unsafeWindow",
          "GM_registerMenuCommand",
          "GM_getValue",
          "GM_setValue",
          "GM_deleteValue",
          "GM_webRequest",
        ],
        "run-at": "document-start",
      },
    }),
  ],
});
