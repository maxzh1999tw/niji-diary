import assert from 'node:assert/strict'
import { createPolaroidShareData } from '../src/sharing.js'
import { formatText, translations } from '../src/i18n.js'

const file = { name: 'niji-polaroid-2026-08-21.jpg', type: 'image/jpeg' }
const shareText = translations['zh-Hant'].shareText
const payload = createPolaroidShareData(file, { title: '今天的彩虹', text: shareText })

assert.deepEqual(payload, {
  files: [file],
  title: '今天的彩虹',
  text: '這是我在 Niji 拾色日記創作的彩虹拍立得，快來跟我一起玩吧！',
})

for (const lang of ['zh-Hant', 'en', 'ja']) {
  const localizedShareText = formatText(translations[lang].shareText)
  assert.doesNotMatch(localizedShareText, /\{url\}|https?:\/\//)
}

console.log('Sharing: Polaroid shares include the image and introduction text without a URL.')
