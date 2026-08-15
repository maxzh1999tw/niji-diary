import assert from 'node:assert/strict'
import { INFO_PAGE_KEYS } from '../src/appRoutes.js'
import { INFO_PAGE_META, infoContent } from '../src/infoContent.js'

assert.deepEqual(INFO_PAGE_META.map(({ key }) => key), INFO_PAGE_KEYS)

for (const lang of ['zh-Hant', 'en', 'ja']) {
  assert.ok(infoContent[lang], `${lang} content exists`)
  assert.deepEqual(Object.keys(infoContent[lang]), INFO_PAGE_KEYS)

  for (const key of INFO_PAGE_KEYS) {
    const page = infoContent[lang][key]
    assert.ok(page.label?.trim(), `${lang}/${key} has a label`)
    assert.ok(page.summary?.trim(), `${lang}/${key} has a summary`)
    assert.ok(page.sections.length >= 3, `${lang}/${key} has useful sections`)

    for (const section of page.sections) {
      assert.ok(section.title?.trim(), `${lang}/${key} section has a title`)
      assert.ok(section.paragraphs?.length || section.bullets?.length, `${lang}/${key}/${section.title} has content`)
      for (const link of section.links ?? []) {
        assert.match(link.href, /^https:\/\//, `${link.label} uses HTTPS`)
      }
    }
  }
}

assert.match(infoContent['zh-Hant'].privacy.sections.map(({ paragraphs = [] }) => paragraphs.join(' ')).join(' '), /無法讀取、代為復原或遠端刪除/)
assert.match(infoContent['zh-Hant'].ads.sections[0].paragraphs.join(' '), /目前沒有/)

console.log('Information content: all six pages are complete in Traditional Chinese, English, and Japanese.')
