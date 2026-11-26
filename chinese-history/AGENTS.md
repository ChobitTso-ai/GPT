# 中國歷史互動書 GitHub 部署規則

- 正式儲存庫：ChobitTso-ai/GPT。此目錄由中國歷史書上傳與部署對話維護。
- GitHub Pages 正式入口為 /GPT/chinese-history/；僅維護此子目錄。
- 使用既有 React 元件與資料，pages/ 提供純靜態掛載；npm run build:pages 產生 pages-dist/，發布其 index.html 與 pages-assets/。
- 圖片及翻頁函式庫沿用 public/；不要重複複製整套素材至部署輸出。
- 原 vinext／Worker 與 .openai/hosting.json 保留，不改原 Sites 身分、不另建計費服務。
- index.html、homepage/island.js、homepage/island.css 由首頁對話唯一維護；本對話僅可在互動書實際上線後修改 homepage/course-links.js 的 history。
- 本機 Local project 仍由原主任務維護；本部署對話對其採唯讀，不能刪除來源、重設 Git 或同步覆寫正式來源。
- 維持核准的米白外皮、連續軟紙翻頁與既有美術；部署相容調整不代表授權重畫。
- 必須檢查 Pages 成功、線上頁面與素材、首頁入口；手機尺寸模擬不代表實體手機或兒童驗收。
