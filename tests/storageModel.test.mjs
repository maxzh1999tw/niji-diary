import assert from 'node:assert/strict'
import { ACTIVE_DRAFT_KEY, deriveCollectionState } from '../src/storage.js'

const legacyRecords = [
  { date: '2026-08-01', photos: { red: 'old-red' }, samples: { red: '#aa0000' }, completedAt: null },
  { date: '2026-08-07', photos: { blue: 'saved-blue', red: 'newer-red' }, samples: { blue: '#0000bb', red: '#bb0000' }, completedAt: null },
]
const activeDraft = { date: ACTIVE_DRAFT_KEY, photos: { red: 'active-red' }, samples: { red: '#cc0000' }, completedAt: null }

const completed = { date: '2026-08-10', photos: {}, samples: {}, completedAt: '2026-08-10T12:00:00.000Z' }
const state = deriveCollectionState([...legacyRecords, activeDraft, completed], '2026-08-10')
assert.equal(state.dailyLocked, true)
assert.equal(state.completedToday, completed)
assert.deepEqual(state.legacyDraftKeys, ['2026-08-01', '2026-08-07'])
assert.deepEqual(state.draft.photos, { red: 'active-red' })

const nextDayState = deriveCollectionState([...legacyRecords, activeDraft, completed], '2026-08-11')
assert.equal(nextDayState.dailyLocked, false)
assert.deepEqual(nextDayState.draft.photos, { red: 'active-red' })

const legacyOnlyState = deriveCollectionState(legacyRecords, '2026-08-10')
assert.equal(legacyOnlyState.draft, null)
assert.deepEqual(legacyOnlyState.legacyDraftKeys, ['2026-08-01', '2026-08-07'])

const deletedPolaroidState = deriveCollectionState([
  activeDraft,
  { date: '__completion-gate__', lastCompletedDate: '2026-08-10' },
], '2026-08-10')
assert.equal(deletedPolaroidState.completedToday, null)
assert.equal(deletedPolaroidState.dailyLocked, true)

console.log('Storage model: draft persists across dates, legacy incomplete colors reset, and daily completion remains locked.')
