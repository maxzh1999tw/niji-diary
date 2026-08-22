import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [rootHtml, appStyles] = await Promise.all([
  readFile(new URL('../root-site/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

function cssRuleBody(selector) {
  const escapedSelector = selector.replaceAll('.', '\\.').replaceAll('*', '\\*')
  const match = appStyles.match(new RegExp(escapedSelector + '\\s*\\{([^{}]*)\\}'))
  assert.ok(match, 'expected CSS rule for ' + selector)
  return match[1]
}

function assertNaturalVisibleText(ruleBody, label) {
  assert.doesNotMatch(ruleBody, /overflow\s*:\s*hidden\b/, label + ' must not clip overflow')
  assert.doesNotMatch(ruleBody, /text-overflow\s*:\s*ellipsis\b/, label + ' must not ellipsize')
  assert.doesNotMatch(ruleBody, /white-space\s*:\s*nowrap\b/, label + ' must wrap naturally')
  assert.doesNotMatch(ruleBody, /(?:-webkit-)?line-clamp\s*:/, label + ' must not clamp lines')
  assert.match(ruleBody, /overflow-wrap\s*:\s*anywhere\b/, label + ' must break long text safely')
}

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
assert.match(appStyles, /color:\s*var\(--film-ink, var\(--ink\)\)/)
assert.match(appStyles, /\.polaroid-date\s*\{[^}]*color:\s*var\(--film-ink-muted/)
assert.doesNotMatch(appStyles, /\.panel-title \.energy-progress\s*\{[^}]*white-space:\s*nowrap/)

const captionRule = cssRuleBody('.polaroid-caption-text, .polaroid-caption-input')
assertNaturalVisibleText(captionRule, 'Polaroid captions')
assert.match(captionRule, /overflow\s*:\s*visible/)
assert.match(captionRule, /white-space\s*:\s*normal/)

const mosaicCaptionRule = cssRuleBody('.layout-mosaic-seven .polaroid-caption-text, .layout-mosaic-seven .polaroid-caption-input')
assertNaturalVisibleText(mosaicCaptionRule, 'mosaic captions')
assert.match(mosaicCaptionRule, /overflow\s*:\s*visible/)
assert.match(mosaicCaptionRule, /white-space\s*:\s*pre-wrap/)

assertNaturalVisibleText(cssRuleBody('.polaroid-date'), 'Polaroid date container')
assertNaturalVisibleText(cssRuleBody('.polaroid-date-text'), 'Polaroid date text')
assert.match(cssRuleBody('.polaroid-date'), /white-space\s*:\s*normal/)
assert.match(cssRuleBody('.polaroid-date-text'), /white-space\s*:\s*normal/)

const energyLabelRule = cssRuleBody('.energy-strip small')
assert.doesNotMatch(energyLabelRule, /max-width\s*:\s*100%/)
assert.match(cssRuleBody('.energy-strip > *'), /min-width\s*:\s*0/)
assert.match(energyLabelRule, /min-width\s*:\s*0/)
assert.match(energyLabelRule, /align-self\s*:\s*stretch/)

const filmOptionNameRule = cssRuleBody('.film-option-name')
assert.doesNotMatch(filmOptionNameRule, /max-width\s*:\s*100%/)
assert.match(filmOptionNameRule, /min-width\s*:\s*0/)
assert.match(filmOptionNameRule, /align-self\s*:\s*stretch/)
assert.match(cssRuleBody('.film-picker-options'), /overflow-x\s*:\s*auto/)
assert.match(cssRuleBody('.film-option'), /min-width\s*:\s*0/)

// The visually-hidden utility is an intentional accessibility exception.
const visuallyHiddenRule = cssRuleBody('.visually-hidden')
assert.match(visuallyHiddenRule, /overflow\s*:\s*hidden\s*!important/)
assert.match(visuallyHiddenRule, /white-space\s*:\s*nowrap\s*!important/)

assert.doesNotMatch(appStyles, /\.energy-strip small\s*\{[^}]*text-overflow:\s*ellipsis/)
assert.doesNotMatch(appStyles, /\.energy-strip small\s*\{[^}]*white-space:\s*nowrap/)
assert.doesNotMatch(appStyles, /\.film-picker-heading strong\s*\{[^}]*text-overflow:\s*ellipsis/)
assert.doesNotMatch(appStyles, /\.film-picker-heading strong\s*\{[^}]*white-space:\s*nowrap/)
assert.doesNotMatch(appStyles, /\.film-option-name\s*\{[^}]*text-overflow:\s*ellipsis/)
assert.doesNotMatch(appStyles, /\.film-option-name\s*\{[^}]*white-space:\s*nowrap/)
assert.doesNotMatch(appStyles, /@media\s*\(max-width:\s*380px\)\s*\{[\s\S]*?\.capture-layout\s*\{[^}]*grid-template-columns:\s*92px\s+minmax\(0,\s*245px\)/)
assert.doesNotMatch(appStyles, /@media\s*\(max-height:\s*690px\)\s*and\s*\(max-width:\s*760px\)\s*\{[\s\S]*?\.capture-layout\s*\{[^}]*grid-template-columns:\s*88px\s+minmax\(0,\s*225px\)/)

console.log('Typography: visible captions and dates wrap naturally, rail labels use shrinkable parents, and visually-hidden exceptions remain scoped.')
