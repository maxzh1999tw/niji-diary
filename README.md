# 拾色日記 Niji Diary

每天在路上蒐集紅、橙、黃、綠、藍、靛、紫七種喜歡的顏色，完成一道只屬於你們的彩虹。

## 本機執行

```bash
npm install
npm run dev
```

## 部署到 GitHub Pages

執行 `npm run build` 後，靜態網站會輸出至 `docs` 資料夾。Repository 的 Pages 來源設定為 `main` 分支的 `/docs`，推送更新後 GitHub Pages 會自動發布。

照片與完成紀錄使用 IndexedDB 儲存在瀏覽器本機，不會上傳到伺服器。清除網站資料或更換瀏覽器／裝置後，紀錄不會自動同步。
