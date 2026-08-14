import assert from 'node:assert/strict'
import { ACTIVE_DRAFT_KEY, COMPLETED_DAY_SCHEMA_VERSION, completedDayNeedsCompaction, createCompletedDayRecord, deriveCollectionState, migrateCompletedDay } from '../src/storage.js'

const legacyRecords = [
  { date: '2026-08-01', photos: { red: 'old-red' }, samples: { red: '#aa0000' }, completedAt: null },
  { date: '2026-08-07', photos: { blue: 'saved-blue', red: 'newer-red' }, samples: { blue: '#0000bb', red: '#bb0000' }, completedAt: null },
]
const activeDraft = { date: ACTIVE_DRAFT_KEY, photos: { red: 'active-red' }, samples: { red: '#cc0000' }, caption: '草稿文字', completedAt: null }

const completed = { date: '2026-08-10', photos: {}, samples: {}, completedAt: '2026-08-10T12:00:00.000Z' }
const state = deriveCollectionState([...legacyRecords, activeDraft, completed], '2026-08-10')
assert.equal(state.dailyLocked, true)
assert.equal(state.completedToday, completed)
assert.deepEqual(state.legacyDraftKeys, ['2026-08-01', '2026-08-07'])
assert.deepEqual(state.draft.photos, { red: 'active-red' })
assert.equal(state.draft.caption, '草稿文字')

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

const completedRecord = createCompletedDayRecord({
  date: '2026-08-12',
  completedAt: '2026-08-12T12:00:00.000Z',
  cardImage: 'composite-image',
  photos: { red: 'large-source-photo' },
  samples: { red: '#ff0000' },
  composition: { x: 50 },
  filmId: 'pink-pop',
  caption: '完成品',
  futureMetadata: { preserved: true },
}, 'complete-polaroid')
assert.equal(completedRecord.schemaVersion, COMPLETED_DAY_SCHEMA_VERSION)
assert.equal(completedRecord.polaroidImage, 'complete-polaroid')
assert.equal(completedRecord.caption, '完成品')
assert.equal(completedRecord.date, '2026-08-12')
assert.equal(completedRecord.completedAt, '2026-08-12T12:00:00.000Z')
assert.deepEqual(completedRecord.futureMetadata, { preserved: true })
assert.equal('photos' in completedRecord, false)
assert.equal('samples' in completedRecord, false)
assert.equal('cardImage' in completedRecord, false)
assert.equal('composition' in completedRecord, false)
assert.equal('filmId' in completedRecord, false)
assert.equal(completedDayNeedsCompaction(completedRecord), false)
assert.equal(completedDayNeedsCompaction(completed), true)
assert.throws(() => createCompletedDayRecord(completed), /Missing completed Polaroid image/)

let persistedMigration = null
const migratedRecord = await migrateCompletedDay(completed, async () => 'migrated-polaroid', async (record) => { persistedMigration = record })
assert.equal(migratedRecord.polaroidImage, 'migrated-polaroid')
assert.deepEqual(persistedMigration, migratedRecord)
assert.equal('photos' in migratedRecord, false)

let versionFourRenderCalled = false
const versionFourRecord = { ...completedRecord, schemaVersion: 4, polaroidImage: 'caption-baked-polaroid' }
const migratedVersionFour = await migrateCompletedDay(versionFourRecord, async () => {
  versionFourRenderCalled = true
  return 'captionless-polaroid'
}, async () => {})
assert.equal(versionFourRenderCalled, true)
assert.equal(migratedVersionFour.schemaVersion, COMPLETED_DAY_SCHEMA_VERSION)
assert.equal(migratedVersionFour.polaroidImage, 'captionless-polaroid')
assert.equal(migratedVersionFour.caption, '完成品')

const partialLegacyRecord = { date: '2026-08-13', completedAt: '2026-08-13T12:00:00.000Z', photos: { red: 'only-photo' } }
const failedRenderRecord = await migrateCompletedDay(partialLegacyRecord, async () => { throw new Error('decode failed') }, async () => assert.fail('failed render must not overwrite storage'))
assert.equal(failedRenderRecord, partialLegacyRecord)

const failedWriteRecord = await migrateCompletedDay(partialLegacyRecord, async () => 'rendered-polaroid', async () => { throw new Error('quota exceeded') })
assert.equal(failedWriteRecord, partialLegacyRecord)

let compactRenderCalled = false
const unchangedCompactRecord = await migrateCompletedDay(completedRecord, async () => { compactRenderCalled = true })
assert.equal(unchangedCompactRecord, completedRecord)
assert.equal(compactRenderCalled, false)

console.log("Storage model: drafts migrate safely, completed days keep only the final Polaroid image, and daily completion remains locked.")
