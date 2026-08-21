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
        assert.match(link.href, /^(?:https:\/\/|mailto:)/, `${link.label} uses a supported link protocol`)
      }
    }
  }
}

assert.match(infoContent['zh-Hant'].privacy.sections.map(({ paragraphs = [] }) => paragraphs.join(' ')).join(' '), /無法讀取、代為復原或遠端刪除/)
assert.match(infoContent['zh-Hant'].ads.sections[0].paragraphs.join(' '), /目前沒有/)

for (const lang of ['zh-Hant', 'en', 'ja']) {
  const contact = infoContent[lang].contact
  const contactLinks = contact.sections.flatMap(({ links = [] }) => links)
  const contactText = contact.sections
    .flatMap(({ paragraphs = [], bullets = [] }) => [...paragraphs, ...bullets])
    .concat(contactLinks.map(({ label }) => label))
    .join(' ')
  assert.match(contactText, /54bp6cl6@gmail\.com/, `${lang}/contact includes the report email`)
  assert.doesNotMatch(contactText, /github/i, `${lang}/contact does not mention GitHub`)
  assert.deepEqual(contactLinks.map(({ href }) => href), ['mailto:54bp6cl6@gmail.com'], `${lang}/contact only links to the report email`)
}

console.log('Information content: all six pages are complete in Traditional Chinese, English, and Japanese.')
