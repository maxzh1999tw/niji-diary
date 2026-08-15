import assert from 'node:assert/strict'
import { ACTIVE_DRAFT_KEY, COMPLETED_DAY_SCHEMA_VERSION, COMPLETION_GATE_KEY, FILM_COLLECTION_KEY, STORAGE_SNAPSHOT_SCHEMA_VERSION, completedDayNeedsCompaction, createCompletedDayRecord, deriveCollectionState, mergeStorageRecords, migrateCompletedDay, validateStorageSnapshot } from '../src/storage.js'

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
  captionInk: '#f8f5ea',
  achievements: { filmChallenges: { version: 1, customCaption: true, expandedRadius: true, boldColorBands: false, daypart: 'evening' } },
  futureMetadata: { preserved: true },
}, 'complete-polaroid')
assert.equal(completedRecord.schemaVersion, COMPLETED_DAY_SCHEMA_VERSION)
assert.equal(completedRecord.polaroidImage, 'complete-polaroid')
assert.equal(completedRecord.caption, '完成品')
assert.equal(completedRecord.date, '2026-08-12')
assert.equal(completedRecord.completedAt, '2026-08-12T12:00:00.000Z')
assert.equal(completedRecord.captionInk, '#f8f5ea')
assert.deepEqual(completedRecord.achievements.filmChallenges, { version: 1, customCaption: true, expandedRadius: true, boldColorBands: false, daypart: 'evening' })
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

const destinationOnlyRecord = { date: '2026-08-14', completedAt: '2026-08-14T12:00:00.000Z', polaroidImage: 'destination-polaroid' }
const importedRecord = { date: '2026-08-13', completedAt: '2026-08-13T12:00:00.000Z', polaroidImage: 'legacy-polaroid' }
const additiveMerge = mergeStorageRecords([destinationOnlyRecord], [destinationOnlyRecord, importedRecord])
assert.equal(additiveMerge.importedRecords, 1)
assert.equal(additiveMerge.skippedRecords, 1)
assert.equal(additiveMerge.records.find((record) => record.date === destinationOnlyRecord.date), destinationOnlyRecord)
assert.equal(additiveMerge.records.find((record) => record.date === importedRecord.date), importedRecord)

const completionMerge = mergeStorageRecords(
  [{ date: COMPLETION_GATE_KEY, lastCompletedDate: '2026-08-10', destinationOnly: true }],
  [{ date: COMPLETION_GATE_KEY, lastCompletedDate: '2026-08-12', legacyOnly: true }],
)
const mergedCompletionGate = completionMerge.records.find((record) => record.date === COMPLETION_GATE_KEY)
assert.equal(mergedCompletionGate.lastCompletedDate, '2026-08-12')
assert.equal(mergedCompletionGate.destinationOnly, true)
assert.equal(mergedCompletionGate.legacyOnly, true)

const filmMerge = mergeStorageRecords(
  [{ date: FILM_COLLECTION_KEY, unlockedFilmIds: ['classic-white', 'sky-blue'], selectedFilmId: 'sky-blue' }],
  [{ date: FILM_COLLECTION_KEY, unlockedFilmIds: ['classic-white', 'sweet-pink'], selectedFilmId: 'sweet-pink' }],
)
const mergedFilmCollection = filmMerge.records.find((record) => record.date === FILM_COLLECTION_KEY)
assert.deepEqual(mergedFilmCollection.unlockedFilmIds, ['classic-white', 'sweet-pink', 'sky-blue'])
assert.equal(mergedFilmCollection.selectedFilmId, 'sky-blue')

const emptyDestinationDraft = { date: ACTIVE_DRAFT_KEY, photos: {}, samples: {}, completedAt: null }
const legacyDraft = { date: ACTIVE_DRAFT_KEY, photos: { violet: 'legacy-photo' }, samples: { violet: '#aa44cc' }, completedAt: null }
const importedDraftMerge = mergeStorageRecords([emptyDestinationDraft], [legacyDraft])
assert.equal(importedDraftMerge.mergedRecords, 1)
assert.deepEqual(importedDraftMerge.records.find((record) => record.date === ACTIVE_DRAFT_KEY).photos, legacyDraft.photos)

const destinationDraft = { date: ACTIVE_DRAFT_KEY, photos: { red: 'destination-photo' }, samples: { red: '#ff0000' }, completedAt: null }
const preservedDraftMerge = mergeStorageRecords([destinationDraft], [legacyDraft])
assert.equal(preservedDraftMerge.skippedRecords, 1)
assert.equal(preservedDraftMerge.records.find((record) => record.date === ACTIVE_DRAFT_KEY), destinationDraft)

const validSnapshot = validateStorageSnapshot({
  schemaVersion: STORAGE_SNAPSHOT_SCHEMA_VERSION,
  indexedDB: { records: [importedRecord] },
  localStorage: [{ key: 'niji-language', value: 'zh-Hant' }],
})
assert.deepEqual(validSnapshot.indexedDB.records, [importedRecord])
assert.throws(() => validateStorageSnapshot({ schemaVersion: STORAGE_SNAPSHOT_SCHEMA_VERSION, indexedDB: { records: [{ date: '' }] } }), /invalid/i)
assert.throws(() => validateStorageSnapshot({ schemaVersion: 999, indexedDB: { records: [] } }), /unsupported/i)

console.log("Storage model: drafts migrate safely, completed days keep only the final Polaroid image, and daily completion remains locked.")
