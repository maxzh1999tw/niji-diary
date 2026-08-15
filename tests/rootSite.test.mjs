import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [html, adsText, robots, headers, sitemap] = await Promise.all([
  readFile(new URL('../root-site/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/ads.txt', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/_headers', import.meta.url), 'utf8'),
  readFile(new URL('../root-site/sitemap.xml', import.meta.url), 'utf8'),
])

assert.match(html, /<meta name="google-adsense-account" content="ca-pub-9186241112756787"/)
assert.match(html, /https:\/\/niji\.mia-and-max\.com\//)
assert.match(html, /https:\/\/wedding\.mia-and-max\.com\//)
assert.match(html, /<h1 id="hero-title">用七種顏色，<span class="keep-phrase">顯影今天的彩虹<\/span><\/h1>/)
assert.match(html, /"applicationCategory": "GameApplication"/)
assert.match(html, /https:\/\/niji\.mia-and-max\.com\/info\/guide\//)
assert.doesNotMatch(html, /h1\s*\{[^}]*max-width:/)
assert.doesNotMatch(html, /\.intro\s*\{[^}]*max-width:/)
assert.match(html, /h1\s*\{[^}]*text-wrap:\s*balance/)
assert.match(html, /@media \(max-width: (?:500|760)px\)/)
assert.match(html, /prefers-reduced-motion/)
assert.equal(adsText.trim(), 'google.com, pub-9186241112756787, DIRECT, f08c47fec0942fa0')
assert.match(robots, /Allow: \/$/m)
assert.match(robots, /Sitemap: https:\/\/mia-and-max\.com\/sitemap\.xml/)
assert.match(sitemap, /<loc>https:\/\/mia-and-max\.com\/<\/loc>/)
assert.match(headers, /Content-Type: text\/plain/)

console.log('Root site: Niji product hub, shared AdSense verification, crawler access, and security headers are configured.')
