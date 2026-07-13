export const translations = {
  'zh-Hant': {
    brand: '拾色日記', tagline: '把今天，拼成一道彩虹。',
    intro: '在路上收集你喜歡的七種顏色。一天一虹，留住只有你們懂的小小風景。',
    today: '今天的彩虹', progress: '已拾起 {count} / 7 色', takePhoto: '拍下這個顏色', replace: '換一張', remove: '移除',
    complete: '完成今天的彩虹', completed: '今天的彩虹完成了', completedHint: '明天再一起去找新的顏色吧。',
    history: '我們的彩虹', empty: '第一道彩虹，正等著你們出發。', local: '照片只會保存在這台裝置',
    confirm: '七種顏色都到齊了。要把今天的彩虹收進日記嗎？完成後今天就不能再修改囉。',
    error: '儲存時發生問題，請確認瀏覽器允許網站儲存資料。', photoAlt: '{color}色照片', close: '關閉', view: '查看 {date} 的彩虹',
    colors: ['紅', '橙', '黃', '綠', '藍', '靛', '紫'], language: '語言', footer: '一天一道虹，七個喜歡的瞬間。',
  },
  en: {
    brand: 'Niji Diary', tagline: 'Piece today into a rainbow.',
    intro: 'Collect seven colors you love along the way. One rainbow a day, made of little scenes only you two know.',
    today: "Today's rainbow", progress: '{count} of 7 colors found', takePhoto: 'Capture this color', replace: 'Replace', remove: 'Remove',
    complete: "Complete today's rainbow", completed: "Today's rainbow is complete", completedHint: 'Come back tomorrow and find seven new colors together.',
    history: 'Our rainbows', empty: 'Your first rainbow is waiting to be found.', local: 'Photos stay only on this device',
    confirm: 'All seven colors are here. Add this rainbow to your diary? You cannot edit it again today.',
    error: 'Could not save. Please allow this site to store data in your browser.', photoAlt: '{color} photo', close: 'Close', view: 'View rainbow from {date}',
    colors: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'], language: 'Language', footer: 'One rainbow a day, seven moments to love.',
  },
  ja: {
    brand: '虹いろ日記', tagline: '今日を、ひとつの虹に。',
    intro: '道ばたで見つけた好きな七色を集めよう。一日ひとつ、ふたりだけの小さな景色を虹にして。',
    today: '今日の虹', progress: '7色のうち {count}色', takePhoto: 'この色を撮る', replace: '撮り直す', remove: '削除',
    complete: '今日の虹を完成する', completed: '今日の虹ができました', completedHint: 'また明日、一緒に新しい色を探そう。',
    history: 'ふたりの虹', empty: '最初の虹が、ふたりを待っています。', local: '写真はこの端末だけに保存されます',
    confirm: '七色がそろいました。今日の虹を日記に残しますか？完成後は今日は編集できません。',
    error: '保存できませんでした。ブラウザの保存設定を確認してください。', photoAlt: '{color}の写真', close: '閉じる', view: '{date}の虹を見る',
    colors: ['赤', '橙', '黄', '緑', '青', '藍', '紫'], language: '言語', footer: '一日ひとつの虹、好きな七つの瞬間。',
  },
}

export function formatText(text, values = {}) {
  return Object.entries(values).reduce((result, [key, value]) => result.replace(`{${key}}`, value), text)
}
