import assert from 'node:assert/strict'
import { detectLanguageFromLocales, getInitialLanguage } from '../src/i18n.js'

for (const locale of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant']) {
  assert.equal(detectLanguageFromLocales([locale]), 'zh-Hant', `${locale} should use Traditional Chinese`)
}

for (const locale of ['en-US', 'ko-KR', 'fr-FR']) {
  assert.equal(detectLanguageFromLocales([locale]), 'en', `${locale} should use English`)
}

for (const locale of ['ja', 'ja-JP']) {
  assert.equal(detectLanguageFromLocales([locale]), 'ja', `${locale} should use Japanese`)
}

assert.equal(detectLanguageFromLocales(['', 'zh-TW']), 'zh-Hant')
assert.equal(detectLanguageFromLocales([]), 'zh-Hant')
assert.equal(
  getInitialLanguage({ storage: { getItem: () => 'ja' }, navigatorLike: { languages: ['en-US'], language: 'en-US' } }),
  'ja',
  'a saved language should take priority over device detection',
)
assert.equal(
  getInitialLanguage({ storage: { getItem: () => null }, navigatorLike: { languages: ['zh-HK'], language: 'en-US' } }),
  'zh-Hant',
)
assert.equal(
  getInitialLanguage({ storage: { getItem: () => null }, navigatorLike: { languages: [], language: 'ja-JP' } }),
  'ja',
)
assert.equal(
  getInitialLanguage({ storage: { getItem: () => 'unsupported' }, navigatorLike: { languages: ['de-DE'], language: 'de-DE' } }),
  'en',
  'an unsupported saved language should fall back to device detection',
)

console.log('i18n: device locale detection and saved language preference behave as expected.')
