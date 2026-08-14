# 拾色日記 Niji Diary

每天在路上蒐集紅、橙、黃、綠、藍、靛、紫七種喜歡的顏色，完成一道只屬於你們的彩虹。

採用 Y2K 小遊戲式 App 介面。玩家先拍照，瀏覽器會從照片正中央取色並預選最接近的彩虹色；點按照片會進入全螢幕取色器，支援雙指縮放、單指拖移、按鈕縮放與任意位置重新取色，也能透過七色輪盤自由更改分類。輪盤中央會即時顯示目前取樣色色塊與 RGB 數值。

集滿七色後會進入 Rainbow Studio：再拍一張背景照片，把由七個取樣色組成的彩虹拖曳到照片上，並調整位置、大小與旋轉。完成後保存為拍立得卡片，卡片下方保留七張色彩來源照片。

## 本機執行

```bash
npm install
npm run dev
```

## 部署到 GitHub Pages

執行 `npm run build` 後，靜態網站會輸出至 `docs` 資料夾。Repository 的 Pages 來源設定為 `main` 分支的 `/docs`，推送更新後 GitHub Pages 會自動發布。

## 部署到 Cloudflare Pages

GitHub Actions 已設定兩種部署方式：

- `.github/workflows/deploy-release.yml`：推送 `v*` 格式的 release tag 後，先執行測試與建置，再更新正式站與測試站。
- `.github/workflows/deploy-test.yml`：在 GitHub Actions 手動執行，輸入要部署的 branch、tag 或 commit，只更新測試站。

正式站為 [niji.mia-and-max.com](https://niji.mia-and-max.com)，測試站使用 Cloudflare Pages 的 `test` preview branch，網址為 `https://test.niji-diary.pages.dev`。

請在 GitHub Repository 的 Settings → Secrets and variables → Actions → Secrets 新增：

- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 帳戶 ID。
- `CLOUDFLARE_API_TOKEN`：只授予 Account → Cloudflare Pages → Edit 的 API Token。

API Token 不要寫入程式碼或 commit；Cloudflare 官方的 Direct Upload CI 流程也使用這兩個 GitHub Secrets。

## 從舊 GitHub Pages 搬移資料

舊站 `https://maxzh1999tw.github.io/niji-diary/` 的設定頁提供「帶到新正式站」按鈕。按下後會開啟 [niji.mia-and-max.com](https://niji.mia-and-max.com)，再以受限來源的 `postMessage` 將舊站本機資料傳給新站；新站只新增尚未存在的 IndexedDB 與 localStorage 資料，不會刪除或覆蓋舊站資料。搬移前請允許瀏覽器開啟新視窗，且新正式站必須已部署包含接收橋接的版本。

創作中的照片會暫存在瀏覽器本機；拍立得完成後，系統只在 IndexedDB 保存底片已定稿的壓縮成品圖、可編輯文字、日期、完成時間與解鎖中繼資料，並刪除填色紀錄、來源照片與合成中間資料。資料不會上傳到伺服器，清除網站資料或更換瀏覽器／裝置後也不會自動同步。
