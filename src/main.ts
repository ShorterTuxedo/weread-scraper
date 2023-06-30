import {
  GM_deleteValue,
  GM_getValue,
  GM_registerMenuCommand,
  GM_setValue,
  GM_webRequest,
} from "$";
import { createStore } from "zustand/vanilla";
import {
  persist,
  createJSONStorage,
  StateStorage,
  subscribeWithSelector,
} from "zustand/middleware";
import { minify } from "html-minifier-terser";

// 初始化用来存储书籍内容的元素
const htmlElement = document.createElement("html");
const headElement = document.createElement("head");
const styleElement = document.createElement("style");
const bodyElement = document.createElement("body");
headElement.append(styleElement);
htmlElement.append(headElement, bodyElement);

// 初始化一个 Mutation Observer 用来监测书籍页面内容 DOM 元素 preRenderContainer 的出现
const preRenderContainerObserver = new MutationObserver(async () => {
  const preRenderContainer = document.querySelector(
    ".preRenderContainer:not([style])"
  );
  if (!preRenderContainer) {
    return;
  }
  const preRenderContent =
    preRenderContainer.querySelector("#preRenderContent");
  if (!preRenderContent) {
    return;
  }
  scraperPageStore.setState({
    preRenderContainer,
  });
});

// session storage 用来存取是否正在进行内容抓取这一状态
interface ScraperSessionState {
  scraping: boolean;
}

const scraperSessionInitialState: ScraperSessionState = {
  scraping: false,
};

const scraperSessionStore = createStore<ScraperSessionState>()(
  subscribeWithSelector(
    persist(() => scraperSessionInitialState, {
      name: "scraper-session-storage",
      storage: createJSONStorage(() => sessionStorage),
    })
  )
);

// GM storage 用来存取用户设定的翻页时间间隔（毫秒）
const GMStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return GM_getValue(name);
  },
  setItem: (name: string, value: string): void => {
    GM_setValue(name, value);
  },
  removeItem: (name: string): void => {
    GM_deleteValue(name);
  },
};

interface ScraperGMState {
  clickInterval: number;
}

const scraperGMInitialState: ScraperGMState = {
  clickInterval: 0,
};

const scraperGMStore = createStore<ScraperGMState>()(
  persist(() => scraperGMInitialState, {
    name: "scraper-gm-storage",
    storage: createJSONStorage(() => GMStorage),
  })
);

// 页面 storage 用来存取关于页面的一些状态信息（翻页前和结束抓取时会被重置）
interface ScraperPageState {
  preRenderContainer: Element | null;
  pageContentLoaded: boolean;
  isNewChapter: boolean;
  timeout: number;
  pageContentLoadedCleanUp: () => void;
}

const scraperPageInitialState: ScraperPageState = {
  preRenderContainer: null,
  pageContentLoaded: false,
  isNewChapter: false,
  timeout: 0,
  pageContentLoadedCleanUp: () => {
    /* void */
  },
};

const scraperPageStore = createStore<ScraperPageState>()(
  subscribeWithSelector(() => scraperPageInitialState)
);

// 开始抓取书籍内容时应该执行的函数
function scrapingOn() {
  GM_webRequest(
    [
      // 阻截微信读书的阅读进度请求，避免抓取过程中的翻页信息被记录为阅读进度
      // 发出这个请求表示此时页面已经加载完毕
      {
        selector: "https://weread.qq.com/web/book/read*",
        action: "cancel",
      },
      // 订阅微信读书的章节内容获取请求
      // 发出这个请求表示内容为新章节，否则为接续页
      {
        selector: "https://weread.qq.com/web/book/chapter/e_*",
        action: {
          redirect: {
            from: ".*",
            to: "$&",
          },
        },
      },
    ],
    (_, __, { url }) => {
      if (url.startsWith("https://weread.qq.com/web/book/read")) {
        scraperPageStore.setState({ pageContentLoaded: true });
      } else if (url.startsWith("https://weread.qq.com/web/book/chapter/e_")) {
        scraperPageStore.setState({
          isNewChapter: true,
        });
      }
    }
  );
  // 开始监测文档中的 preRenderContainer 元素
  preRenderContainerObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  // 订阅页面加载完毕事件，添加相应的回调函数，并存储相应的收尾函数
  const unsub = subscribePageContentLoaded();
  scraperPageStore.setState({
    pageContentLoadedCleanUp: getPageContentLoadedCleanUpFunction(unsub),
  });
}

// 停止抓取书籍内容时应该执行的函数
function scrapingOff() {
  // 执行取消订阅页面加载完毕事件的收尾函数
  scraperPageStore.getState().pageContentLoadedCleanUp();
  // 停止监测文档中的 preRenderContainer 元素
  preRenderContainerObserver.disconnect();
  // 取消订阅微信读书的阅读进度请求和章节内容获取请求
  GM_webRequest([], () => {
    /* void */
  });
}

// 订阅抓取状态，并根据状态执行相应的函数
scraperSessionStore.subscribe(
  (state) => state.scraping,
  (scraping) => {
    if (scraping) {
      scrapingOn();
    } else {
      scrapingOff();
    }
  },
  {
    fireImmediately: true,
  }
);

// 订阅页面加载完毕事件并执行相关操作，返回一个取消订阅的函数
function subscribePageContentLoaded() {
  return scraperPageStore.subscribe(
    (state) => state.pageContentLoaded,
    async (pageContentLoaded) => {
      if (!pageContentLoaded) {
        return;
      }
      // 页面加载完毕时，preRenderContainer 才是最终我们需要的结果
      const { preRenderContainer } = scraperPageStore.getState();
      if (preRenderContainer) {
        await feed(
          preRenderContainer.cloneNode(true) as typeof preRenderContainer
        );
      } else {
        console.warn("内容丢失");
      }
      // 寻找是否有下一页按钮
      let nextPageButton = document.querySelector(".readerFooter_button");
      if (!nextPageButton) {
        // 如果没有下一页按钮，但是有全书完的信息，则停止抓取
        const ending = document.querySelector(".readerFooter_ending");
        if (ending) {
          stopScrapingAndSave();
        }
        return;
      }
      // 如果有下一页的按钮，那么先等待用户所设定的页面翻页间隔
      await new Promise<void>((resolve) => {
        scraperPageStore.setState({
          timeout: setTimeout(() => {
            resolve();
          }, scraperGMStore.getState().clickInterval),
        });
      });
      // 清空页面加载完毕状态
      scraperPageStore.setState(scraperPageInitialState);
      // 重新获取下一页按钮
      // 如果不重新获取，这个按钮有可能会被重新渲染
      // 那么原来获取到的按钮会从文档中消失，导致无法翻页
      // TODO: 待证实
      nextPageButton = document.querySelector(".readerFooter_button");
      // 给下一页按钮施加一个点击操作，这里要注意 clientX 和 clientY 必须不为 0
      // 否则微信读书会将其判断为非人为翻页从而不执行翻页操作
      nextPageButton?.dispatchEvent(
        new MouseEvent("click", {
          clientX: 1,
          clientY: 1,
        })
      );
    }
  );
}

// 页面加载完毕事件取消订阅的收尾函数
// 接受一个取消订阅页面加载完毕事件的函数，并在取消订阅后执行相关收尾工作
function getPageContentLoadedCleanUpFunction(unsub: () => void) {
  return () => {
    // 取消订阅
    unsub();
    // 清除翻页间隔计时器
    clearTimeout(scraperPageStore.getState().timeout);
    // 重置相关的状态
    scraperPageStore.setState(scraperPageInitialState);
  };
}

// 将获取到的 preRenderContainer 中的内容稍作变换并存入目标位置
async function feed(preRenderContainer: Element) {
  if (styleElement.childNodes.length === 0) {
    const style = preRenderContainer.querySelector("style");
    if (style?.childNodes.length) {
      styleElement.innerHTML = style.innerHTML.replaceAll(
        ".readerChapterContent",
        ".preRenderContent"
      );
      styleElement.append(".preRenderContent { page-break-after: always; }");
      styleElement.prepend(
        `@font-face { font-family: "汉仪旗黑50S"; src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYQiHei_50S.woff2") format("woff2"); }`,
        `@font-face { font-family: "汉仪旗黑65S"; src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYQiHei_65S.woff2") format("woff2"); }`,
        `@font-face { font-family: "汉仪楷体"; src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYKaiTiS.woff2") format("woff2"); }`,
        `@font-face { font-family: "方正仿宋"; src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/FZFSJW.woff2") format("woff2"); }`,
        `@font-face { font-family: "PingFang SC"; src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/PingFang-SC-Regular.woff2") format("woff2"); }`
      );
      styleElement.outerHTML = await minify(styleElement.outerHTML, {
        minifyCSS: true,
      });
    }
  }
  const preRenderContent = preRenderContainer.querySelector(
    "#preRenderContent"
  ) as Element;
  preRenderContent.removeAttribute("id");
  for (const image of preRenderContent.querySelectorAll("img")) {
    image.src = image.getAttribute("data-src") ?? image.src;
  }
  recursivelyRemoveDataAttr(preRenderContent);
  collapseSpans(preRenderContent);
  bodyElement.insertAdjacentHTML(
    "beforeend",
    await minify(preRenderContent.outerHTML, {
      collapseWhitespace: true,
      removeComments: true,
    })
  );
}

// 添加一个开启抓取的按钮
GM_registerMenuCommand("Start Scraping", startScraping);
function startScraping() {
  scraperSessionStore.setState({ scraping: true });
  window.location.reload();
}

// 添加一个取消抓取的按钮
GM_registerMenuCommand("Cancel Scraping", cancelScraping);
function cancelScraping() {
  scraperSessionStore.setState({ scraping: false });
  styleElement.innerHTML = "";
  bodyElement.innerHTML = "";
}

// 添加一个停止抓取并保存书籍内容的按钮
GM_registerMenuCommand("Stop Scraping & Save", stopScrapingAndSave);
async function stopScrapingAndSave() {
  scraperSessionStore.setState({
    scraping: false,
  });
  saveContent(
    htmlElement.outerHTML,
    document
      .querySelector(".readerCatalog_bookInfo_title_txt")
      ?.textContent?.trim()
  );
  styleElement.innerHTML = "";
  bodyElement.innerHTML = "";
}

// 添加一个设定翻页时间间隔的按钮
GM_registerMenuCommand("Set Click Interval", setClickInterval);
function setClickInterval() {
  const prevClickInterval = scraperGMStore.getState().clickInterval;
  let newClickInterval = parseFloat(
    window.prompt("Click interval (ms): ", prevClickInterval.toString()) || ""
  );
  if (!Number.isFinite(newClickInterval) || newClickInterval < 0) {
    newClickInterval = prevClickInterval;
  }
  scraperGMStore.setState({
    clickInterval: newClickInterval,
  });
}

// helper 函数用于移除所有 "data-wr-id" 和 "data-wr-co" 属性
function recursivelyRemoveDataAttr(element: Element) {
  const attributes = element.attributes;
  for (let i = attributes.length - 1; i >= 0; --i) {
    const attributeName = attributes[i].name;
    if (["data-wr-id", "data-wr-co"].includes(attributeName)) {
      element.removeAttribute(attributeName);
    }
  }
  for (const child of element.children) {
    recursivelyRemoveDataAttr(child);
  }
}

// helper 函数用于判断是否是简单的 span 元素
function isSimpleSpan(element: Element | null): element is HTMLSpanElement {
  return (
    element?.tagName === "SPAN" &&
    element?.attributes.length === 0 &&
    element.innerHTML.length <= 1
  );
}

// helper 函数用于合并连续的 span 元素
function collapseSpans(element: Element) {
  for (const span of element.querySelectorAll("span")) {
    if (!isSimpleSpan(span)) {
      continue;
    }
    let nextElementSibling = span.nextElementSibling;
    while (isSimpleSpan(nextElementSibling)) {
      span.append(nextElementSibling.textContent ?? "");
      nextElementSibling.remove();
      nextElementSibling = span.nextElementSibling;
    }
  }
}

// helper 函数用于将内容保存至本地
function saveContent(content: string, fileName = "微信读书") {
  const contentBlob = new Blob([content], {
    type: "text/html;charset=utf-8",
  });
  const dummyLink = document.createElement("a");
  dummyLink.href = URL.createObjectURL(contentBlob);
  dummyLink.download = `${fileName}.html`;
  document.body.appendChild(dummyLink);
  dummyLink.click();
  document.body.removeChild(dummyLink);
  URL.revokeObjectURL(dummyLink.href);
}
