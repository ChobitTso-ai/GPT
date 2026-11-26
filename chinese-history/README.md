# 中國歷史互動書 v1.8

GitHub Pages 入口：[中國歷史冒險書](https://chobittso-ai.github.io/GPT/chinese-history/)。

本目錄保留原 React／vinext／Vite／Worker 專案與102張已採用插畫的PNG／WebP，另以純React靜態入口供GitHub Pages使用。原 Sites 身分與 Worker、DB 範例保留；靜態頁沒有伺服器功能需求。

## 建置與發布

需要 Node.js 22.13.0 以上。執行 npm ci，再執行 npm run build:pages。此命令使用 pages/index.html 與 pages/main.tsx，產生 pages-dist/index.html 與 pages-dist/pages-assets/。

將這兩項發布至 chinese-history/ 的 index.html 與 pages-assets/。圖片與翻頁函式庫直接沿用 public/，不複製整套素材。GitHub Pages 設定仍為 main 分支根目錄，首頁其他檔案不由本專案修改。

原 vinext 開發與建置命令仍保留，不代表會發布原 Sites 專案。

## 驗證與限制

部署適配前的282個來源檔清單見 upload-manifest.json；它是原始上傳快照，不包含本輪新增的靜態入口與部署產物。當前部署交接見 HANDOFF.md。

本機靜態建置與桌機／手機尺寸瀏覽器檢查已完成；既有starter測試債、Cloudflare型別、史學疆界、題庫與真人閱讀體驗待辦仍保留。實體手機與兒童試玩尚未驗收。

## 權利

© 2026 Tso KY - All Rights Reserved  
Protected against reverse engineering and unauthorized modification

第三方素材沿用各自授權：地圖來源與CC0／CC BY-SA／公有領域界線見「地圖資料查核紀錄.md」與「地圖重建工具/來源/README.md」；page-flip MIT授權見 public/opening-c-preview-v2/vendor/LICENSE.txt；插畫提示、來源及想像復原界線見「百科重繪素材紀錄.json」。

本機完整來源、未提交修改與Git歷史保留；本次未為節省空間刪除任何資料。
