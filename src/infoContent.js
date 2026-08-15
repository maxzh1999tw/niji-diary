export const INFO_PAGE_META = Object.freeze([
  { key: 'about', icon: 'info' },
  { key: 'guide', icon: 'help' },
  { key: 'privacy', icon: 'shield' },
  { key: 'terms', icon: 'document' },
  { key: 'contact', icon: 'mail' },
  { key: 'ads', icon: 'cookie' },
])

const links = {
  issues: { label: 'GitHub Issues', href: 'https://github.com/maxzh1999tw/niji-diary/issues' },
  taiwanLaw: { label: '個人資料保護法', href: 'https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=I0050021' },
  cloudflare: { label: 'Cloudflare 隱私權政策', href: 'https://www.cloudflare.com/privacypolicy/' },
  googlePartners: { label: 'Google 如何使用合作夥伴網站資料', href: 'https://policies.google.com/technologies/partner-sites' },
  googleAds: { label: 'Google 廣告設定', href: 'https://adssettings.google.com/' },
}

export const infoContent = {
  'zh-Hant': {
    about: {
      label: '關於拾色日記', kicker: 'ABOUT NIJI', summary: '每天收藏七個喜歡的顏色，把平凡片刻顯影成一道只屬於你的虹。',
      sections: [
        { title: '我們在做什麼', paragraphs: ['拾色日記是一款可安裝的網頁應用程式。你可以拍照或選擇圖片、從畫面取色，集滿紅橙黃綠藍靛紫後，製作一張當日彩虹拍立得。'] },
        { title: '設計原則', bullets: ['不需要註冊帳號，也沒有雲端同步。', '照片、取色結果與日記內容在你的瀏覽器內處理與保存。', '首次連線載入後，可在支援的瀏覽器中離線使用多數功能。', '介面支援繁體中文、English 與日本語。'] },
        { title: '請先知道', paragraphs: ['資料只存在目前的裝置與瀏覽器。清除網站資料、使用無痕模式、移除瀏覽器或更換裝置，都可能使內容無法復原。請把想長期保留的拍立得另存備份。'] },
      ],
    },
    guide: {
      label: '使用方法／常見問題', kicker: 'GUIDE & FAQ', summary: '從第一個顏色到完成彩虹，以及資料保存與安裝方式。',
      sections: [
        { title: '完成今天的彩虹', bullets: ['在「今日任務」拍照或從裝置選擇圖片。', '點選圖片位置取色，再確認它屬於哪一道光。', '集滿七色後進入彩虹工作室，選擇背景並調整彩虹。', '完成顯影後可下載或使用裝置的分享功能。'] },
        { title: '為什麼完成後不能再修改？', paragraphs: ['完成是當日任務的封存動作，可避免重複計算連續天數與底片解鎖進度。你仍可在相簿編輯拍立得下方的文字，或刪除整筆紀錄。'] },
        { title: '資料會同步到其他裝置嗎？', paragraphs: ['不會。目前沒有帳號或雲端同步；不同瀏覽器、瀏覽器設定檔與裝置各自保存資料。'] },
        { title: '如何安裝或離線使用？', paragraphs: ['在瀏覽器選單中選擇「加到主畫面」或「安裝應用程式」。第一次需連線載入；之後多數核心功能可離線使用，但外部字型、聯絡連結與未來可能加入的廣告仍需要網路。'] },
        { title: '如何刪除資料？', paragraphs: ['可在相簿長按拍立得並拖到垃圾桶刪除單日紀錄。若要移除全部內容，請到瀏覽器的網站設定，清除 niji.mia-and-max.com 的網站資料。此操作無法復原。'] },
      ],
    },
    privacy: {
      label: '隱私權政策', kicker: 'PRIVACY', summary: '你的照片與日記留在裝置上；網站運作所需的技術連線則依本政策說明。', updated: '生效與更新日期：2026 年 8 月 15 日',
      sections: [
        { title: '我們處理哪些資料', paragraphs: ['拾色日記本身不要求姓名、電子郵件或帳號。你建立的照片、取色結果、文字、日期、完成狀態、底片設定與語言偏好，會由瀏覽器保存在這台裝置。'] },
        { title: '本機儲存與保留期間', paragraphs: ['內容透過 IndexedDB、localStorage、Cache Storage 與 Service Worker 保存在瀏覽器中，直到你在應用程式內刪除、清除網站資料，或瀏覽器／作業系統自行移除。拾色日記營運者無法讀取、代為復原或遠端刪除這些本機內容。'] },
        { title: '網路與第三方服務', paragraphs: ['網站由 Cloudflare Pages 提供。連線時，Cloudflare 可能處理 IP 位址、路由、系統設定與流量等安全及傳輸資料。頁面也會向 Google Fonts 請求字型，Google 可能收到 IP 位址、瀏覽器資訊與請求頁面等技術資料。'], links: [links.cloudflare, links.googlePartners] },
        { title: '分享、下載與舊站搬移', paragraphs: ['只有在你主動操作時，拍立得才會交給瀏覽器或作業系統下載、或送至你選擇的分享目標。舊站搬移也只在你按下搬移按鈕後，透過兩個站點視窗間的訊息傳送；內容不會先送到拾色日記伺服器。'] },
        { title: '廣告與分析', paragraphs: ['目前沒有啟用 Google 廣告或分析追蹤。若日後加入，會先更新本政策與「廣告與 Cookie 說明」，並依適用地區提供必要的選擇或同意機制。廣告服務不應取得你的照片、取色結果或日記文字。'] },
        { title: '你的選擇與權利', paragraphs: ['你可以刪除單筆紀錄、清除全部網站資料、封鎖第三方 Cookie，或透過聯絡頁反映政策問題。涉及可識別個人資料時，將依適用法律處理查詢、更正、停止利用或刪除等請求。'], links: [links.taiwanLaw] },
        { title: '兒少使用', paragraphs: ['未成年人請在法定代理人或監護人了解並同意後使用，也請避免在公開分享時揭露可辨識個人、學校、住址或即時位置的資訊。'] },
      ],
    },
    terms: {
      label: '使用條款', kicker: 'TERMS', summary: '使用拾色日記前，請了解本機資料、內容權利與服務限制。', updated: '生效與更新日期：2026 年 8 月 15 日',
      sections: [
        { title: '接受與服務內容', paragraphs: ['使用本網站即表示你同意本條款。拾色日記提供免費的個人日記與影像創作工具；功能可能隨版本調整。'] },
        { title: '你的內容', paragraphs: ['你保有自己照片與文字的權利。因內容預設不會上傳至拾色日記伺服器，你也沒有授予營運者公開或再利用內容的授權。當你主動分享時，另受你所選平台的條款約束。'] },
        { title: '資料保存責任', paragraphs: ['服務以現況提供，不保證永不中斷、永遠相容或永久保存資料。本機資料可能因清除網站資料、裝置故障、瀏覽器更新或儲存空間管理而消失；重要內容請自行下載備份。'] },
        { title: '可接受的使用方式', bullets: ['不得以違法、侵權或傷害他人的方式使用服務。', '不得干擾網站運作、規避安全措施、散布惡意程式或大量自動化請求。', '你必須有權使用自己加入或分享的照片與文字。'] },
        { title: '第三方服務與廣告', paragraphs: ['主機、字型、外部連結與日後可能加入的廣告由第三方提供，適用各自條款與政策。出現廣告不代表拾色日記推薦或保證廣告商品。'] },
        { title: '責任限制與條款變更', paragraphs: ['在適用法律允許範圍內，營運者不對資料遺失、裝置問題或第三方服務造成的間接損失負責。重大變更會更新日期並在適當位置提示；變更後繼續使用即表示接受新版條款。'] },
        { title: '準據法', paragraphs: ['本條款以中華民國（台灣）法律為準據法；爭議管轄依適用法律決定。未成年人應先取得法定代理人或監護人同意。'] },
      ],
    },
    contact: {
      label: '聯絡方式', kicker: 'CONTACT', summary: '回報錯誤、提出建議，或詢問隱私與條款問題。',
      sections: [
        { title: '公開聯絡管道', paragraphs: ['目前請使用專案的 GitHub Issues。這是公開頁面，其他人可能看見你提交的內容。'], links: [links.issues] },
        { title: '回報時可以附上', bullets: ['瀏覽器與作業系統版本。', '發生問題的頁面、操作步驟與預期結果。', '已遮住私人資訊的畫面截圖。'] },
        { title: '請勿公開提供', bullets: ['私人照片、日記文字或即時位置。', '身分證件、電話、地址、帳號密碼或付款資訊。', '任何你不希望出現在公開網路上的內容。'] },
        { title: '關於本機資料', paragraphs: ['營運者看不到你瀏覽器中的照片與日記，也無法代為取回或刪除。請在相簿刪除單筆紀錄，或在瀏覽器網站設定中清除本網站的全部資料。'] },
      ],
    },
    ads: {
      label: '廣告與 Cookie 說明', kicker: 'ADS & COOKIES', status: '目前未啟用廣告', summary: '先說明現況，也把未來獎勵式廣告會遵守的界線寫清楚。', updated: '更新日期：2026 年 8 月 15 日',
      sections: [
        { title: '目前的狀態', paragraphs: ['拾色日記目前沒有放送 Google 廣告，也沒有使用廣告 Cookie 或廣告識別碼。核心功能不需要看廣告。'] },
        { title: '本網站使用的儲存技術', paragraphs: ['IndexedDB 與 localStorage 用來保存日記、底片與語言設定；Cache Storage 與 Service Worker 用來支援載入與離線使用。這些第一方儲存不是為了跨網站追蹤。Cloudflare 主機與 Google Fonts 仍可能在網路連線中處理必要的技術資料。'] },
        { title: '未來若加入 Google 廣告', paragraphs: ['Google 與其合作夥伴可能使用 Cookie、IP 位址、裝置／瀏覽器資訊、廣告識別碼與廣告互動資料，以投放個人化或非個人化廣告、衡量成效、防止詐欺與濫用。拾色日記不會把照片、取色結果或日記文字交給廣告服務。'], links: [links.googlePartners, links.googleAds] },
        { title: '獎勵式廣告原則', bullets: ['觀看必須由你主動選擇，並在開始前清楚標示可獲得的底片或其他獎勵。', '拒絕或略過不影響一般日記、取色、相簿與既有底片功能。', '廣告無法載入、未完整播放或回傳驗證失敗時，不承諾發放獎勵。', '不以誤導按鈕、自動播放或強迫互動誘導點擊廣告。'] },
        { title: '你的控制方式', paragraphs: ['若啟用廣告，會依地區與適用規範提供必要的同意選項。你也可調整 Google 廣告設定、瀏覽器 Cookie 權限或使用內容阻擋工具；這可能讓獎勵式廣告無法使用，但不影響一般核心功能。'] },
      ],
    },
  },
}

const englishLabels = {
  about: ['About Niji Diary', 'ABOUT NIJI', 'A private, local-first diary that turns seven colors from each day into one rainbow.'],
  guide: ['How to use / FAQ', 'GUIDE & FAQ', 'Collect seven colors, develop a Rainbow Polaroid, and understand how local storage works.'],
  privacy: ['Privacy Policy', 'PRIVACY', 'Your photos and diary stay on your device; necessary network connections are described here.'],
  terms: ['Terms of Use', 'TERMS', 'Important terms about local data, your content, and service limitations.'],
  contact: ['Contact', 'CONTACT', 'Report a problem, suggest an idea, or ask about privacy and terms.'],
  ads: ['Ads & Cookies', 'ADS & COOKIES', 'Ads are not enabled today. These are the boundaries for any future rewarded ads.'],
}

const japaneseLabels = {
  about: ['拾色日記について', 'ABOUT NIJI', '毎日の七色を集めて、ひとつの虹にする端末保存型の日記です。'],
  guide: ['使い方／よくある質問', 'GUIDE & FAQ', '七色の集め方、ポラロイドの現像、端末保存について説明します。'],
  privacy: ['プライバシーポリシー', 'PRIVACY', '写真と日記は端末内に保存され、必要な通信についてはここで説明します。'],
  terms: ['利用規約', 'TERMS', '端末内データ、コンテンツの権利、サービスの制限について。'],
  contact: ['お問い合わせ', 'CONTACT', '不具合、提案、プライバシーや規約に関するお問い合わせ。'],
  ads: ['広告と Cookie', 'ADS & COOKIES', '現在広告はありません。将来のリワード広告に関する方針です。'],
}

function translatedSummaryPages(labels, language) {
  const localizedLinks = language === 'en'
    ? {
      issues: links.issues,
      cloudflare: { ...links.cloudflare, label: 'Cloudflare Privacy Policy' },
      googlePartners: { ...links.googlePartners, label: 'How Google uses data from partner sites' },
      googleAds: { ...links.googleAds, label: 'Google ad settings' },
    }
    : {
      issues: links.issues,
      cloudflare: { ...links.cloudflare, label: 'Cloudflare プライバシーポリシー' },
      googlePartners: { ...links.googlePartners, label: 'パートナーサイトでの Google のデータ利用' },
      googleAds: { ...links.googleAds, label: 'Google 広告設定' },
    }
  const common = language === 'en'
    ? {
      about: [['What it is', ['Niji Diary is an installable web app. Take or choose images, sample colors, collect seven rays, and develop a daily Rainbow Polaroid.']], ['Principles', ['No account or cloud sync.', 'Photos, sampled colors, and diary text are processed and stored in this browser.', 'After the first online load, most core features work offline.']], ['Before you start', ['Clearing site data, private browsing, removing a browser, or changing devices can permanently remove local content. Download anything important.']]],
      guide: [['Complete a rainbow', ['Capture or choose an image, sample a point, classify the color, and repeat for all seven colors. Then choose a background, adjust the rainbow, and develop your Polaroid.']], ['Why is a finished day locked?', ['Finishing archives the daily quest so streak and film progress stay consistent. You can still edit the caption or delete the entry from the album.']], ['Does it sync?', ['No. Each browser profile and device stores its own copy.']], ['Install, offline use, and deletion', ['Use your browser’s Install or Add to Home Screen command. Most features work offline after the first load. Delete one entry from the album, or clear all data for niji.mia-and-max.com in browser site settings; deletion cannot be undone.']]],
      privacy: [['Data stored locally', ['No name, email, or account is required. Photos, colors, text, dates, completion state, film settings, and language are stored with IndexedDB, localStorage, Cache Storage, and a Service Worker until you or the browser removes them. The operator cannot access, recover, or remotely delete this content.']], ['Network services', ['Cloudflare Pages may process IP, routing, system, and traffic data to deliver and protect the site. Google Fonts may receive technical request data such as IP address and browser information.']], ['Sharing and migration', ['Content leaves the app only when you choose a download/share target or start the old-site migration. The migration transfers data directly between site windows, not through a Niji Diary server.']], ['Ads, choices, and minors', ['Google ads and analytics are not currently enabled. Any future use will be disclosed with applicable consent choices and will not receive your photos, sampled colors, or diary text. You can delete local data, control third-party cookies, and contact us about policy questions. Minors should use the app with guardian awareness.']]],
      terms: [['Service and your content', ['Niji Diary is a free personal creative tool provided as-is. You retain rights to your photos and text, and grant no publishing license because content is not uploaded by default. Sharing is subject to the destination platform’s terms.']], ['Backups and availability', ['The service does not guarantee uninterrupted access, compatibility, or permanent retention. Browser changes, device failure, or cleared storage may remove data; download important work.']], ['Acceptable use', ['Do not use the service unlawfully, infringe others’ rights, disrupt security, distribute malware, or send abusive automated traffic. Use only content you have the right to use.']], ['Third parties and law', ['Hosting, fonts, links, and future ads follow their providers’ terms. Ads would not be endorsements. These terms are governed by the laws of Taiwan, with jurisdiction determined by applicable law.']]],
      contact: [['Public support channel', ['Use GitHub Issues for now. It is public, so do not post private photos, diary text, live location, identity documents, passwords, addresses, or payment data.']], ['Helpful details', ['Include your browser and operating system versions, the page and steps involved, the expected result, and only screenshots with private information hidden.']], ['Local data requests', ['The operator cannot see or remove browser-local content. Delete an entry in the album or clear all site data in browser settings.']]],
      ads: [['Current status', ['Niji Diary currently serves no Google ads and uses no advertising cookies or ad identifiers. Core features do not require an ad.']], ['Local storage and network services', ['IndexedDB and localStorage save diary and settings; Cache Storage and a Service Worker support loading and offline use. These are not used for cross-site ad tracking. Cloudflare and Google Fonts may still process necessary technical connection data.']], ['If Google ads are added', ['Google and partners may use cookies, IP address, device/browser information, ad identifiers, and interactions for ad delivery, measurement, and abuse prevention. Photos, sampled colors, and diary text will not be provided to ad services.']], ['Rewarded-ad rules', ['Watching will be optional with the reward stated first. Declining will not affect normal diary, color, album, or existing film features. No reward is promised if an ad does not load or complete verification. Applicable consent controls will be provided by region.']]],
    }
    : {
      about: [['できること', ['拾色日記はインストールできるウェブアプリです。写真から七色を集め、毎日の虹ポラロイドを作れます。']], ['大切にしていること', ['アカウントとクラウド同期はありません。写真、採取した色、日記はブラウザ内で処理・保存されます。初回読み込み後は多くの機能をオフラインで使えます。']], ['ご注意', ['サイトデータの消去、プライベートブラウズ、ブラウザの削除、端末変更によりデータを復元できなくなる場合があります。大切な作品はダウンロードしてください。']]],
      guide: [['虹を完成する', ['写真を撮るか選び、場所をタップして色を採取し、七色に分類します。七色がそろったら背景と虹を調整して現像します。']], ['完成後に編集できない理由', ['完成はその日のクエストを保存する操作です。連続日数とフィルム進捗を正しく保つためロックされますが、文字の編集と記録の削除は可能です。']], ['同期とオフライン', ['端末間同期はありません。ブラウザの「インストール」または「ホーム画面に追加」を使えます。初回読み込み後は多くの機能をオフラインで使えます。']], ['削除方法', ['アルバムから1件ずつ削除できます。全削除はブラウザ設定で niji.mia-and-max.com のサイトデータを消去してください。元に戻せません。']]],
      privacy: [['端末内のデータ', ['氏名、メール、アカウントは不要です。写真、色、文字、日付、完成状態、フィルム、言語は IndexedDB、localStorage、Cache Storage、Service Worker に保存されます。運営者は閲覧、復元、遠隔削除できません。']], ['通信サービス', ['Cloudflare Pages は配信と保護のため IP、ルーティング、システム、通信データを処理する場合があります。Google Fonts は IP やブラウザなどの技術情報を受け取る場合があります。']], ['共有と移行', ['ダウンロード、共有先の選択、旧サイト移行を自分で開始した場合のみ内容が渡されます。移行はサイトのウィンドウ間で行い、拾色日記サーバーを経由しません。']], ['広告・選択・未成年', ['現在 Google 広告と解析は使っていません。将来使う場合は必要な同意手段を用意し、写真、採取色、日記本文を広告サービスへ渡しません。未成年は保護者の理解のもとで利用してください。']]],
      terms: [['サービスとコンテンツ', ['拾色日記は無料の個人向け創作ツールを現状のまま提供します。写真と文字の権利は利用者にあり、通常はアップロードされないため運営者への公開利用許諾もありません。']], ['保存と可用性', ['中断のない提供、永続的な互換性、データ保存は保証しません。ブラウザ変更、端末故障、保存領域の消去で失われる場合があるため、重要な作品は保存してください。']], ['禁止事項', ['違法利用、権利侵害、セキュリティ妨害、マルウェア配布、大量の自動アクセスは禁止します。使用権限のある写真と文字だけを利用してください。']], ['外部サービスと法律', ['ホスティング、フォント、リンク、将来の広告には各社の規約が適用されます。台湾法を準拠法とし、管轄は適用法に従います。']]],
      contact: [['公開窓口', ['現在は GitHub Issues を利用してください。公開ページなので、写真、日記、現在地、本人確認書類、パスワード、住所、決済情報は投稿しないでください。']], ['役立つ情報', ['ブラウザと OS のバージョン、ページ、操作手順、期待した結果、個人情報を隠した画面をお知らせください。']], ['端末内データ', ['運営者は端末内データを確認・削除できません。アルバムで削除するか、ブラウザ設定から全サイトデータを消去してください。']]],
      ads: [['現在の状態', ['現在 Google 広告、広告 Cookie、広告 ID は使用していません。基本機能に広告視聴は不要です。']], ['保存技術と通信', ['IndexedDB と localStorage は日記と設定、Cache Storage と Service Worker は読み込みとオフライン利用に使います。サイト横断広告追跡には使いません。Cloudflare と Google Fonts は必要な通信データを処理する場合があります。']], ['将来 Google 広告を導入する場合', ['Google とパートナーは Cookie、IP、端末・ブラウザ、広告 ID、操作情報を配信、測定、不正防止に使う場合があります。写真、採取色、日記本文は広告サービスに渡しません。']], ['リワード広告の原則', ['視聴は任意で、開始前に報酬を示します。拒否しても日記、採色、アルバム、既存フィルムに影響しません。読み込みや検証が完了しない場合、報酬は保証されません。地域に応じた同意手段を用意します。']]],
    }

  return Object.fromEntries(Object.entries(labels).map(([key, [label, kicker, summary]]) => {
    const pageLinks = key === 'contact' ? [localizedLinks.issues] : key === 'privacy' ? [localizedLinks.cloudflare, localizedLinks.googlePartners] : key === 'ads' ? [localizedLinks.googlePartners, localizedLinks.googleAds] : []
    return [key, {
      label, kicker, summary,
      status: key === 'ads' ? (language === 'en' ? 'Ads are currently off' : '現在、広告はありません') : undefined,
      updated: ['privacy', 'terms', 'ads'].includes(key) ? (language === 'en' ? 'Effective and updated: August 15, 2026' : '施行・更新日：2026年8月15日') : undefined,
      sections: common[key].map(([title, values], index) => ({ title, [values.length > 1 ? 'bullets' : 'paragraphs']: values, links: index === 0 ? pageLinks : undefined })),
    }]
  }))
}

infoContent.en = translatedSummaryPages(englishLabels, 'en')
infoContent.ja = translatedSummaryPages(japaneseLabels, 'ja')
