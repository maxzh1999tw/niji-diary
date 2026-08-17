import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  MODAL_HISTORY_KEY,
  appendModalHistoryToken,
  clearModalHistoryState,
  createModalHistoryToken,
  getModalHistoryStack,
  removeModalHistoryToken,
} from '../src/modalNavigation.js'

const baseState = { route: 'archive', userState: { keep: true } }
const firstToken = createModalHistoryToken('rainbow-lightbox')
const secondToken = createModalHistoryToken('delete-confirmation')
const nestedState = appendModalHistoryToken(appendModalHistoryToken(baseState, firstToken), secondToken)

assert.deepEqual(getModalHistoryStack(nestedState), [firstToken, secondToken])
assert.equal(nestedState.route, 'archive')
assert.deepEqual(nestedState.userState, { keep: true })

const withoutFirst = removeModalHistoryToken(nestedState, firstToken)
assert.deepEqual(getModalHistoryStack(withoutFirst), [secondToken])
assert.equal(withoutFirst[MODAL_HISTORY_KEY].includes(firstToken), false)

const withoutSecond = removeModalHistoryToken(withoutFirst, secondToken)
assert.equal(getModalHistoryStack(withoutSecond).length, 0)
assert.equal(Object.hasOwn(withoutSecond, MODAL_HISTORY_KEY), false)
assert.deepEqual(clearModalHistoryState(nestedState), baseState)
assert.equal(clearModalHistoryState(baseState), baseState)

const appSource = readFileSync(fileURLToPath(new URL('../src/App.jsx', import.meta.url)), 'utf8')
for (const modalId of [
  'photo-sampler',
  'solid-background-picker',
  'polaroid-eyedropper',
  'archive-delete-mode',
  'rainbow-lightbox',
  'delete-confirmation',
  'developed-card',
]) {
  assert.match(appSource, new RegExp(`useModalHistory\\([^\\n]+'${modalId}'`), `${modalId} must use the shared back-stack`)
}
assert.match(appSource, /window\.addEventListener\('popstate'/)

console.log('Modal navigation: nested back-stack state preserves routes and clears one overlay at a time.')
