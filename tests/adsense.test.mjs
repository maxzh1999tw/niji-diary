import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const publisherId = '9186241112756787'
const [adsText, indexHtml] = await Promise.all([
  readFile(new URL('../public/ads.txt', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
])

assert.equal(adsText.trim(), `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0`)
assert.match(indexHtml, new RegExp(`<meta name="google-adsense-account" content="ca-pub-${publisherId}"`))
assert.match(indexHtml, /<link rel="canonical" href="https:\/\/niji\.mia-and-max\.com\/"/)

console.log('AdSense verification: ads.txt, account meta tag, and canonical URL use the expected production identifiers.')
