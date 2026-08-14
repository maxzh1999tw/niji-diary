# 專案協作規則

本專案已經上線，使用者資料視為正式環境資料。所有開發與維護都必須優先確保既有資料不遺失、可讀取且語意不被破壞。

## 使用者資料相容性

- 修改資料模型、`localStorage`/IndexedDB 儲存格式、序列化內容、匯入匯出格式或 API payload 前，先檢查目前實作、測試與既有資料格式。
- 優先採用向後相容的新增式變更；既有資料必須仍可讀取，新增欄位要有合理的預設值，未知欄位不可被無意刪除。
- 若無法避免格式變更，必須提供具版本、可重複執行且失敗安全的遷移流程，並保留必要的回退或資料保全措施。
- 不得直接刪除、重命名或改變既有資料欄位的語意，也不得在未經明確需求的情況下清除、重置或覆寫使用者資料。
- 針對舊格式、空值、部分資料與遷移失敗情境補充測試；完成後確認新版本可讀取既有資料。

## 驗證與交付

- 完成功能或資料相關改動後，依專案 scripts 執行必要驗證；至少執行 `npm test` 與 `npm run build`，除非該改動明確不涉及程式或建置。
- 檢查 `git diff` 與 `git status`，只納入本次任務相關檔案，不要把既有的無關變更或未追蹤檔案一起提交。
- 改動完成並驗證後，一律主動建立清楚的 commit，接著立即 push 到目前工作的遠端分支，不等待額外確認。
- 不使用 force push、不重寫既有歷史，也不刪除遠端分支。若 commit 或 push 失敗，必須清楚回報原因與目前狀態，不能宣稱已完成。

## 網頁文字可讀性

- 全站可見文字的 CSS 計算字級不得小於 12px；包含手機版、徽章、輔助說明、按鈕、時間、預覽與狀態文字。
- 新增或調整文字時優先使用 12px 以上；不得以縮小文字換取版面容納，應改用換行、間距或版面調整。

## Cloudflare Pages 部署資訊

- Cloudflare Pages 專案：`niji-diary`
- Cloudflare 帳戶 ID：`10a8a3c91b60c03a4073bee79dccb28f`
- 建置指令：`npm run build`
- 建置輸出目錄：`docs/`
- 正式站：<https://niji.mia-and-max.com>
- 測試站：<https://test.niji-diary.pages.dev>
- 測試部署使用 Pages 預覽分支 `test`；正式部署使用 Pages production deployment。

### GitHub Actions 部署流程

- `.github/workflows/deploy-release.yml`
  - 觸發條件：推送符合 `v*` 的 release tag。
  - 流程：`npm ci` → `npm test` → `npm run build`，接著部署正式站與 `test` 測試站。
- `.github/workflows/deploy-test.yml`
  - 觸發條件：手動 `workflow_dispatch`。
  - 輸入欄位：`ref`，可指定 branch、tag 或 commit，預設為 `main`。
  - 流程：以指定 ref 建置，部署至 `test` 測試站。

### GitHub Actions Secrets

- `CLOUDFLARE_API_TOKEN`：Cloudflare API Token；僅授予帳戶層級的 Pages 編輯權限。
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 帳戶 ID。
- Secret 值不得寫入程式碼、文件、commit、issue 或 workflow log；只能透過 GitHub Repository Secrets 使用。
- API Token 有效期限與權限異動時，需同步更新 GitHub Secret，並重新執行測試站 Action 驗證部署。

### 部署維護注意事項

- Wrangler 部署指令為 `pages deploy docs --project-name=niji-diary`；測試站額外加上 `--branch=test`。
- 修改部署流程後，至少確認 `npm test`、`npm run build`，並手動執行測試站 workflow。
- 部署完成後確認正式站與測試站皆可正常回應，且不可清除或覆寫使用者既有資料。
