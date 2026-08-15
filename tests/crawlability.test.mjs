import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { INFO_PAGE_META } from '../src/infoContent.js'

const [indexHtml, generator, robots, serviceWorker, packageJson, sitemap, ...staticPages] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/generate-static-info-pages.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../public/robots.txt', import.meta.url), 'utf8'),
  readFile(new URL('../public/sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8'),
  readFile(new URL('../docs/sitemap.xml', import.meta.url), 'utf8'),
  ...INFO_PAGE_META.map(({ key }) => readFile(new URL(`../docs/info/${key}/index.html`, import.meta.url), 'utf8')),
])

assert.match(indexHtml, /<main class="static-intro">/)
assert.match(indexHtml, /每天從照片裡拾起紅、橙、黃、綠、藍、靛、紫/)
assert.match(indexHtml, /\.\/info\/guide\//)
assert.match(indexHtml, /"applicationCategory": "GameApplication"/)
assert.doesNotMatch(indexHtml, /pagead2\.googlesyndication\.com|adBreak\s*\(/)

assert.deepEqual(INFO_PAGE_META.map(({ key }) => key), ['about', 'guide', 'privacy', 'terms', 'contact', 'ads'])
assert.match(generator, /info\/\$\{key\}\//)

assert.match(generator, /google-adsense-account/)
assert.match(generator, /sitemap\.xml/)
assert.match(robots, /Sitemap: https:\/\/niji\.mia-and-max\.com\/sitemap\.xml/)
assert.match(serviceWorker, /isAppShellNavigation/)
assert.match(serviceWorker, /if \(isAppShellNavigation\)/)
assert.match(packageJson, /generate-static-info-pages\.mjs/)
assert.equal(staticPages.length, INFO_PAGE_META.length)

INFO_PAGE_META.forEach(({ key }, index) => {
  assert.match(staticPages[index], new RegExp(`<link rel="canonical" href="https://niji\\.mia-and-max\\.com/info/${key}/"`))
  assert.match(staticPages[index], /<meta name="google-adsense-account" content="ca-pub-9186241112756787"/)
  assert.match(staticPages[index], /<main id="content">/)
})

for (const { key } of INFO_PAGE_META) {
  assert.match(sitemap, new RegExp(`<loc>https://niji\\.mia-and-max\\.com/info/${key}/</loc>`))
}

console.log('Crawlability: Niji has meaningful raw HTML, direct policy-page generation, structured data, and sitemap discovery.')
