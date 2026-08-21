import assert from 'node:assert/strict'
import { NEW_APP_URL } from '../src/migration.js'
import { createPolaroidShareData } from '../src/sharing.js'
import { formatText, translations } from '../src/i18n.js'

const file = { name: 'niji-polaroid-2026-08-21.jpg', type: 'image/jpeg' }
const shareText = formatText(translations['zh-Hant'].shareText, { url: NEW_APP_URL })
const payload = createPolaroidShareData(file, { title: '今天的彩虹', text: shareText })

assert.deepEqual(payload, {
  files: [file],
  title: '今天的彩虹',
  text: `這是我在 Niji 拾色日記創作的彩虹拍立得，快來跟我一起玩吧：${NEW_APP_URL}`,
  url: NEW_APP_URL,
})

for (const lang of ['zh-Hant', 'en', 'ja']) {
  assert.doesNotMatch(formatText(translations[lang].shareText, { url: NEW_APP_URL }), /\{url\}/)
}

console.log('Sharing: Polaroid shares include the image, introduction text, and the live-site URL.')
