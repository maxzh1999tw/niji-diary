import assert from 'node:assert/strict'
import { NEW_APP_URL } from '../src/migration.js'
import { createPolaroidShareData } from '../src/sharing.js'

const file = { name: 'niji-polaroid-2026-08-21.jpg', type: 'image/jpeg' }
const payload = createPolaroidShareData(file, { title: '今天的彩虹', text: '這是我們今天收集的七色彩虹。' })

assert.deepEqual(payload, {
  files: [file],
  title: '今天的彩虹',
  text: '這是我們今天收集的七色彩虹。',
  url: NEW_APP_URL,
})

console.log('Sharing: Polaroid shares include the image, introduction text, and the live-site URL.')
