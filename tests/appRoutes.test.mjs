import assert from 'node:assert/strict'
import { INFO_PAGE_KEYS, TAB_KEYS, infoHash, parseAppHash } from '../src/appRoutes.js'

for (const tab of TAB_KEYS) {
  assert.deepEqual(parseAppHash(`#${tab}`), { tab, infoPage: null })
}

for (const page of INFO_PAGE_KEYS) {
  assert.equal(infoHash(page), `info/${page}`)
  assert.deepEqual(parseAppHash(`#${infoHash(page)}`), { tab: 'settings', infoPage: page })
}

assert.deepEqual(parseAppHash(''), { tab: 'today', infoPage: null })
assert.deepEqual(parseAppHash('#unknown'), { tab: 'today', infoPage: null })
assert.deepEqual(parseAppHash('#info/unknown'), { tab: 'today', infoPage: null })
assert.equal(infoHash('unknown'), 'settings')

console.log('App routes: tabs and all information pages support stable hash deep links.')
