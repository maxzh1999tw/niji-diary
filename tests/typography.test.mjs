import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [rootHtml, appStyles] = await Promise.all([
  readFile(new URL('../root-site/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

assert.match(rootHtml, /<h1 id="hero-title">用七種顏色，<span class="keep-phrase">顯影今天的彩虹<\/span><\/h1>/)
assert.doesNotMatch(rootHtml, /title-phrase/)
assert.doesNotMatch(rootHtml, /\.intro\s*\{[^}]*max-width:/)
assert.match(rootHtml, /h1\s*\{[^}]*text-wrap:\s*balance/)
assert.doesNotMatch(rootHtml, /\.hero-copy\s*\{[^}]*max-width:/)

for (const selector of ['.mission-copy', '.capture-copy']) {
  const escapedSelector = selector.replace('.', '\\.')
  assert.doesNotMatch(appStyles, new RegExp(`${escapedSelector}\\s*\\{[^}]*max-width:\\s*\\d`))
}

assert.match(appStyles, /Width limits belong to layout containers, not text/)
assert.match(appStyles, /\.info-hero h1,[\s\S]*?\.developed-heading h2\s*\{\s*text-wrap:\s*balance/)
assert.match(appStyles, /\.studio-topbar h1,[\s\S]*?white-space:\s*normal/)
assert.match(appStyles, /\.film-bookmark-condition\s*\{[\s\S]*?-webkit-line-clamp:\s*unset/)

console.log('Typography: headings, supporting copy, and compact labels use natural wrapping without arbitrary text widths.')
