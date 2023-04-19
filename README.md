# Weread-Scraper

Export Weread Books as HTML Files

<img src="https://user-images.githubusercontent.com/10386119/186714588-97e1b755-ce62-4f89-a64d-268824f39e9e.png" width=480/>

## How to Use

1. Install [this userscript](https://greasyfork.org/zh-CN/scripts/450169-weread-scraper) in [Tampermonkey](https://www.tampermonkey.net/).
2. Select the book you want to save in Weread (e.g., https://weread.qq.com/web/bookDetail/f6432a905b73c0f64797a8d).
3. Browse the first page of the book or any other page from which you want to start saving (e.g., https://weread.qq.com/web/reader/f6432a905b73c0f64797a8dkc81322c012c81e728d9d180).
4. Left-click the Tampermonkey icon and then click "Start Scraping" in the pop-up menu.
5. Wait for the scraping process to complete; an HTML file will be automatically generated and downloaded.
6. You can cancel an ongoing scraping process by clicking "Cancel Scraping."
7. You can stop an ongoing scraping process and save the scraped contents that are available by clicking "Stop Scraping & Save."
8. You can set a click interval for the next page by clicking "Set Click Interval" and entering the desired value (in milliseconds).
9. That's it!

## Additional Notes

- It is recommended to use Chrome or MS Edge to run this script.
- It is recommended to use Firefox to print the downloaded HTML to PDF.
- Many of the books use these fonts. Install them to have a better reading experience: [汉仪旗黑 50S](https://www.hanyi.com.cn/productdetail?id=831), [汉仪旗黑 65S](https://www.hanyi.com.cn/productdetail.php?id=834), and [汉仪楷体S](https://www.hanyi.com.cn/productdetail.php?id=814). There might be more fonts, but I didn't check them all. If you know of any others, feel free to create issues. By the way, `PingFang SC` would be a good choice to use as a fallback font.
- Scraping books with many pages can slow down your browser because I didn't use any mechanism for streaming, chunking, or garbage collection. Further work can be done to address this issue.

Enjoy using this script, and please do not use it for pirating books or selling them!
