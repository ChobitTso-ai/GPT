# GPT App

一個可安裝的漸進式網頁應用（PWA）。可以直接在瀏覽器使用，也可以「加入主畫面」，像原生 APP 一樣開啟與離線使用。

**🌐 線上網址：** https://chobittso-ai.github.io/GPT/

## 如何啟用 GitHub Pages（只需做一次）

1. 到本倉庫的 **Settings → Pages**
2. 在 **Build and deployment → Source** 選擇 **GitHub Actions**
3. 合併此分支到 `main` 後，`Deploy to GitHub Pages` workflow 會自動部署
4. 部署完成後，APP 就會出現在上面的網址

## 讓 APP 顯示在倉庫首頁

到倉庫首頁右側的 **About** 區塊，點齒輪 ⚙️，在 **Website** 欄位填入
`https://chobittso-ai.github.io/GPT/`，訪客就能在 GitHub 上直接看到並點開 APP。

## 專案結構

| 檔案 | 用途 |
| --- | --- |
| `index.html` | APP 主頁面（含 Open Graph 分享卡片設定） |
| `manifest.webmanifest` | PWA 設定：名稱、圖示、主畫面安裝行為 |
| `sw.js` | Service Worker：離線快取 |
| `icons/` | APP 圖示與分享預覽圖 |
| `.github/workflows/deploy-pages.yml` | 自動部署到 GitHub Pages |

## 安裝方式

- **iPhone / iPad**：用 Safari 開啟網址 → 點「分享」→「加入主畫面」
- **Android / 電腦 Chrome**：開啟網址後點「安裝」按鈕，或網址列右側的安裝圖示
