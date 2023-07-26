import bs4

fileContent = None
with open(input(), "r", encoding="UTF-8") as f:
  fileContent = f.read()
  
html = bs4.BeautifulSoup(fileContent)
htmlContent = "<!DOCTYPE html><html><head><title>Title should go right here</title>" + str(html.select_one("head").encode_contents(),encoding="UTF-8") + "</head><body>HTML code should go right here</body></html>"

pageNumber = 1
for page in html.select("div.preRenderContent"):
  with open(f"page{pageNumber}.html", "w", encoding="UTF-8") as f:
    f.write(htmlContent.replace("Title should go right here", page["data-chapter-title"]).replace("HTML code should go right here", str(page)))
  pageNumber += 1
 
print("HTML文件已生成，首先安装 calibre 再利用 calibre 的编辑 epub 功能创建新 epub 文件将这些 html 文件丢进去")