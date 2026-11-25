# 中國歷史互動書 v1.8

本目錄保存 2026-11-25 從現行本機工作樹複製的原始碼與必要素材，包含尚未提交的 v1.8 改版、核准的米白書皮與連續軟紙翻頁。它是一個獨立的 React／vinext／Vite／Cloudflare Worker 專案。

## 本次內容

- 來源檔案 282 個，共 428,323,362 bytes；逐檔大小、SHA-256 與 Git blob SHA-1 見 [upload-manifest.json](upload-manifest.json)。
- 84 張軍事插畫與 18 張裝備插畫，共 102 張已採用主圖，各保留 PNG 原圖及 WebP 網頁版。
- 正式開場引用的米白底書、山水與城門圖層，以及 page-flip 2.0.7 程式與 MIT 授權。部分必要素材的既有路徑仍含 opening-c-preview 字樣。
- 地圖重建工具、必要來源子集、授權與來源查核紀錄、素材紀錄及既有測試。
- 保留既有 .openai/hosting.json 與 Sites 專案識別；build/sites-vite-plugin.ts 是必要原始碼，已保留。

未包含 node_modules、.git、快取、dist／其他可重建輸出、未採候選、封面候選影片及本機治理文件。本機原始來源、未提交修改與 Git 歷史仍保留。

## 本機使用

需要 Node.js 22.13.0 以上。在此目錄執行：

```sh
npm ci
npm run dev
```

`npm run build` 會執行現有 vinext 建置流程。本專案使用 Worker 執行環境；放入 GitHub 子目錄不等於已轉成 GitHub Pages 可執行的靜態網站。

## 驗證與已知限制

本次上傳前，素材引用、大小及雜湊、地圖投影、地點與標籤等 16 項既有測試通過；續傳時全部 282 個來源檔的 SHA-256 與暫停清單一致。本次沒有重新建置或進行瀏覽器／手機／兒童教學驗收。

- 既有 tests/rendered-html.test.mjs 兩項 starter 測試債未修，不能宣稱整套 npm test 通過。
- 既有全專案 Cloudflare 型別環境問題，以及過往建置的分塊大小／路由分類警告保留。
- app/page.tsx 顯示 v1.8；app/layout.tsx 的標頭／metadata 仍標 v1.7，package.json 的套件版本仍為 0.1.0。本次按原始內容複製，未順手改版號。
- 地圖疆界、題庫品質與整體閱讀體驗仍有既有待辦；插畫完工不等於史學定稿或使用者真人驗收。

## 素材權利

專案自製內容：© 2026 Tso KY - All Rights Reserved  
Protected against reverse engineering and unauthorized modification

第三方素材與函式庫各依原授權，不由上列署名取代。地圖來源、CC0／CC BY-SA／公有領域範圍及限制見「地圖資料查核紀錄.md」與「地圖重建工具/來源/README.md」；page-flip 授權見 public/opening-c-preview-v2/vendor/LICENSE.txt。插畫提示、來源支持範圍與想像復原界線見「百科重繪素材紀錄.json」。

## 上傳與復原邊界

本次僅建立獨立分支與 PR，所有新增檔案位於 chinese-history/。未合併、未部署、未修改首頁、Pages、儲存庫可見性或其他權限。

審核前可關閉 PR，不影響 main；若日後另獲授權合併後需要復原，可透過 PR 反向提交移除本次新增子目錄。本機來源不依賴此上傳結果，不需要重設或清理本機 Git。
