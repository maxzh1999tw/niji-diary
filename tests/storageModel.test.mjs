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

const todayLegacyDraft = { date: '2026-08-10', photos: { green: 'today-green' }, samples: { green: '#00aa55' }, completedAt: null }
const todayMigrationState = deriveCollectionState([...legacyRecords, todayLegacyDraft], '2026-08-10')
assert.equal(todayMigrationState.draftNeedsMigration, true)
assert.equal(todayMigrationState.draft.date, ACTIVE_DRAFT_KEY)
assert.deepEqual(todayMigrationState.draft.photos, { green: 'today-green' })
assert.deepEqual(todayMigrationState.draft.samples, { green: '#00aa55' })

const activeWinsState = deriveCollectionState([...legacyRecords, todayLegacyDraft, activeDraft], '2026-08-10')
assert.equal(activeWinsState.draftNeedsMigration, false)
assert.deepEqual(activeWinsState.draft.photos, { red: 'active-red' })

const deletedPolaroidState = deriveCollectionState([
  activeDraft,
  { date: '__completion-gate__', lastCompletedDate: '2026-08-10' },
], '2026-08-10')
assert.equal(deletedPolaroidState.completedToday, null)
assert.equal(deletedPolaroidState.dailyLocked, true)

console.log("Storage model: today's legacy draft migrates alone, older drafts reset, and daily completion remains locked.")
