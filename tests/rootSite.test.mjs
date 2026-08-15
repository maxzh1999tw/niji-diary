import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [html, adsText, robots, headers] = await Promise.all([
  readFile(new URL('../root-site/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/ads.txt', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/_headers', import.meta.url), 'utf8'),
])

assert.match(html, /<meta name="google-adsense-account" content="ca-pub-9186241112756787"/)
assert.match(html, /https:\/\/niji\.mia-and-max\.com\//)
assert.match(html, /https:\/\/wedding\.mia-and-max\.com\//)
assert.match(html, /@media \(max-width: 680px\)/)
assert.match(html, /prefers-reduced-motion/)
assert.equal(adsText.trim(), 'google.com, pub-9186241112756787, DIRECT, f08c47fec0942fa0')
assert.match(robots, /Allow: \/$/m)
assert.match(headers, /Content-Type: text\/plain/)

console.log('Root site: neutral project hub, shared AdSense verification, crawler access, and security headers are configured.')
