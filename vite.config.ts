import { defineConfig } from "vite";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: false,
  plugins: [
    monkey({
      build: {
        externalGlobals: {
          "html-minifier-terser": cdn.jsdelivrFastly(
            "HTMLMinifier",
            "dist/htmlminifier.umd.bundle.min.js"
          ),
        },
      },
      entry: "src/main.ts",
      userscript: {
        icon: "https://weread.qq.com/favicon.ico",
        namespace: "https://github.com/Sec-ant/weread-scraper",
        match: [
          "https://weread.qq.com/web/reader/*",
          "https://weread.qq.com/web/book/read*",
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
