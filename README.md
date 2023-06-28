# WeRead Scraper

将微信阅读书籍内容导出为 HTML 文件

## 使用方法

1. 在 [Tampermonkey](https://www.tampermonkey.net/) 中安装[这个脚本](https://greasyfork.org/zh-CN/scripts/450169-weread-scraper)

2. 在[微信阅读网页版](https://weread.qq.com/)选择你想要保存的书籍，通过**开始阅读**按钮浏览到书籍的首页（如：[《永恒的终结》](https://weread.qq.com/web/reader/f6432a905b73c0f64797a8d)），或通过目录选择书中的某一页

3. 左键单击 Tampermonkey 浏览器扩展图标，并点击弹出菜单中的 **Start Scraping**

4. 等待内容抓取过程结束，结束后脚本将自动保存一份 HTML 文档到本地

5. 点击 **Cancel Scraping** 可以取消当前的抓取过程

6. 点击 **Stop Scraping & Save** 可以停止当前的抓取过程，并保存已抓取的内容

7. 点击 **Set Click Interval** 可以设定自动翻页时间间隔，单位为毫秒（ms）

## 常见问题

1. **是否支持 ViolentMonkey？**

   本脚本使用了 [webRequest API](https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) 监听相关网络请求，由于 [ViolentMonkey 不支持 webRequest API](https://github.com/violentmonkey/violentmonkey/issues/583)，因此本脚本不支持使用 ViolentMonkey 安装。

2. **翻页时间间隔是不是越短越好？**

   翻页时浏览器会向腾讯服务器发起内容获取的请求，如果一本书页数很多且翻页时间间隔过短，则有可能触发反爬机制，从而导致一段时间内无法再获取书籍内容，所以这个时间间隔要根据实际情况调整。

3. **为什么将翻页时间间隔设为 0 时还会有等待时间？**

   除了花费在网络请求上的时间之外，为了尽可能压缩文件体积，脚本同时还会对内容做 [minification](https://zh.wikipedia.org/wiki/%E6%A5%B5%E7%B0%A1%E5%8C%96) 处理，这个过程会占用一定的时间。

4. **为什么获取到的书籍中没有注释、笔记等信息？**

   这部分信息和书籍的内容信息可以看成是不同“图层”中的信息，本脚本主要针对书籍内容这一“图层”，其它信息暂时未作处理，但欢迎贡献代码。

5. **为什么要以用户脚本的形式发布，而不做成浏览器扩展或可执行文件？**

   用户脚本是用户安装成本非常低的一种分发形式。浏览器扩展需要处理上架的流程，本脚本功能决定了它上架难度很大，而以开发者模式离线加载则体验不够好；如果做成可执行文件需要额外处理账号登录问题，会增加工作量。

6. **我该如何把 HTML 文件转换为 PDF 文件？**

   推荐使用[火狐浏览器](http://www.firefox.com/)打开保存下来的 HTML 文件，并通过浏览器的打印功能将其打印为 PDF 文件。其他浏览器也可以尝试，但是火狐浏览器在打印大量页面时速度表现会更出色，不容易出现卡顿。你也可以尝试使用 [Pandoc](https://pandoc.org/)，它支持非常多样的文档格式转换。
