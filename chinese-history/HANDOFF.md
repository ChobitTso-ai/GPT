# 中國歷史互動書 GitHub Pages 交接

- 2026-11-26，維護者：本中國歷史書上傳與部署對話。
- 使用者已在首頁對話授權：首頁部署完成後，完成互動書靜態化、必要提交／合併、上線與歷史館串接。
- 保留 v1.8 的 282 個上傳來源檔與本機來源；新增 pages/、vite.pages.config.mjs、npm run build:pages，以及根 index.html 與 pages-assets/ 靜態產物。
- 純 React 主頁沒有使用伺服器 API。靜態版本不載入 Worker、DB 或登入範例，原檔與原 Sites 身分仍保留。
- public/ 直接供應素材；建置不再複製整套 PNG／WebP。Vite base 與 public URL 分流依 vite.pages.config.mjs 設定。
- 本機靜態建置通過；產物三檔，JavaScript 約763kB（gzip 約261kB），保留大於500kB警告。
- 本機瀏覽器：1280×720／390×844，米白開場、翻頁完成進正文、手機無橫向溢出；21 軍事時代各4卡，84個獨立引用，102個主圖皆在產物且來源檔存在；瀏覽器 error=0。
- 原有兩項starter測試債、地圖疆界／題庫／閱讀品質待辦仍保留；不宣稱整套測試、史學或兒童真人驗收完成。
- PR #3 已於2026-11-26合併；部署commit b1a9ffbe543c070118cea609a45ebd50597801e8，Pages run 45822091143 success。
- 正式網址：https://chobittso-ai.github.io/GPT/chinese-history/ 。已實際載入米白開場、翻頁進正文、三國地圖縮放、蒙古到元及明到清轉場、21個軍事時代各4卡；線上瀏覽器error=0，390×844無橫向溢出。
- 線上入口與程式／素材共118個URL全部HTTP 200；清朝四主圖實際解碼1200px。
- 使用者已在本對話直接核准合併、上線與歷史館串接。本輪只把homepage/course-links.js的history設為./chinese-history/，保留首頁index.html、island.js與island.css。
- 本機原始來源與Git歷史、原Sites身分均保留；實體手機、兒童試玩、史學及既有品質債仍未驗收。
