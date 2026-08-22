import assert from 'node:assert/strict'
import { buildCaptionPersistencePlan, createInitialFilmCollection, hydrateAppCollectionState, recoverHydratedFilmCollection, stripFilmCollectionMeta } from '../src/appCollectionCoordinator.js'
import { DEFAULT_FILM_ID, DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID } from '../src/films.js'

assert.deepEqual(stripFilmCollectionMeta({
  unlockedFilmIds: [DEFAULT_FILM_ID],
  selectedFilmId: DEFAULT_FILM_ID,
  selectedLayoutId: DEFAULT_LAYOUT_ID,
  needsSave: true,
  futureSetting: 'keep-me',
}), {
  unlockedFilmIds: [DEFAULT_FILM_ID],
  selectedFilmId: DEFAULT_FILM_ID,
  selectedLayoutId: DEFAULT_LAYOUT_ID,
  futureSetting: 'keep-me',
})

const qaCollection = createInitialFilmCollection({ qaMode: 'sample', qaFilmId: 'pink-pop' })
assert.equal(qaCollection.selectedFilmId, 'pink-pop')
assert.equal(qaCollection.unlockedFilmIds.includes(DEFAULT_FILM_ID), true)

const repairedDays = await hydrateAppCollectionState({
  date: '2026-08-10',
  defaultCaption: 'NIJI 拾色日記',
  loadCollectionState: async () => ({
    completedDays: [{
      date: '2026-08-10',
      completedAt: '2026-08-10T12:00:00.000Z',
      caption: '我的字',
      achievements: { keepMe: 'yes' },
    }],
    dailyLocked: true,
    draft: { date: '__active-draft__', photos: { red: 'draft-red' }, samples: null, completedAt: null },
    filmCollection: { unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: DEFAULT_FILM_ID, selectedLayoutId: DEFAULT_LAYOUT_ID },
  }),
  migrateCompletedDay: async (day) => ({ ...day, migrated: true }),
  renderCaptionlessPolaroid: async () => assert.fail('completed Polaroid migration stub should not need to repaint in this test'),
  ensureCustomCaptionChallenge: (day, defaultCaption) => day.caption === defaultCaption
    ? day
    : {
        ...day,
        achievements: {
          ...(day.achievements ?? {}),
          filmChallenges: { version: 2, customCaption: true },
        },
      },
  saveDay: async () => {},
  saveFilmCollection: async () => {},
  readPendingFilmSelection: () => null,
  clearPendingFilmSelection: () => assert.fail('no pending film should be cleared'),
})
assert.equal(repairedDays.dailyLocked, true)
assert.equal(repairedDays.day.date, '2026-08-10')
assert.equal(repairedDays.history[0].migrated, true)
assert.deepEqual(repairedDays.history[0].achievements, {
  keepMe: 'yes',
  filmChallenges: { version: 2, customCaption: true },
})

let repairedSaveAttempts = 0
const hydratedFromLegacyDraft = await hydrateAppCollectionState({
  date: '2026-08-11',
  defaultCaption: 'NIJI 拾色日記',
  loadCollectionState: async () => ({
    completedDays: [{
      date: '2026-08-09',
      completedAt: '2026-08-09T12:00:00.000Z',
      caption: '相簿裡的補寫文字',
      achievements: { prior: true },
    }],
    dailyLocked: false,
    draft: { date: '__active-draft__', photos: { green: 'legacy-green' }, completedAt: null },
    filmCollection: { unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: DEFAULT_FILM_ID, selectedLayoutId: DEFAULT_LAYOUT_ID },
  }),
  migrateCompletedDay: async (day) => day,
  renderCaptionlessPolaroid: async () => assert.fail('render fallback should not run here'),
  ensureCustomCaptionChallenge: (day, defaultCaption) => day.caption === defaultCaption
    ? day
    : {
        ...day,
        achievements: {
          ...(day.achievements ?? {}),
          filmChallenges: { version: 2, customCaption: true },
        },
      },
  saveDay: async () => {
    repairedSaveAttempts += 1
    throw new Error('quota exceeded')
  },
  saveFilmCollection: async () => {},
  readPendingFilmSelection: () => null,
  clearPendingFilmSelection: () => {},
})
assert.deepEqual(hydratedFromLegacyDraft.day.photos, { green: 'legacy-green' })
assert.deepEqual(hydratedFromLegacyDraft.day.samples, {}, 'draft hydration must still expose a usable samples object')
assert.equal(repairedSaveAttempts, 1, 'caption repair should still attempt best-effort persistence')
assert.equal(hydratedFromLegacyDraft.history[0].achievements.filmChallenges.customCaption, true, 'failed repair persistence must keep the in-memory repaired state')

let pendingCleared = null
let recoveredSave = 0
const recoveredSelection = await hydrateAppCollectionState({
  date: '2026-08-12',
  defaultCaption: 'NIJI 拾色日記',
  loadCollectionState: async () => ({
    completedDays: [],
    dailyLocked: false,
    draft: null,
    filmCollection: { schemaVersion: 2, unlockedFilmIds: [DEFAULT_FILM_ID, 'sky-blue'], selectedFilmId: DEFAULT_FILM_ID, selectedLayoutId: MOSAIC_LAYOUT_ID },
  }),
  migrateCompletedDay: async (day) => day,
  renderCaptionlessPolaroid: async () => assert.fail('render fallback should not run here'),
  ensureCustomCaptionChallenge: (day) => day,
  saveDay: async () => {},
  saveFilmCollection: async () => { recoveredSave += 1 },
  readPendingFilmSelection: () => 'sky-blue',
  clearPendingFilmSelection: (filmId) => { pendingCleared = filmId },
})
assert.equal(recoveredSelection.filmCollection.selectedFilmId, 'sky-blue')
await new Promise((resolve) => setTimeout(resolve, 0))
assert.equal(recoveredSave, 1, 'recovering a pending film selection must persist the recovered selection once')
assert.equal(pendingCleared, 'sky-blue')

const unchangedCollection = recoverHydratedFilmCollection({
  unlockedFilmIds: [DEFAULT_FILM_ID],
  selectedFilmId: DEFAULT_FILM_ID,
  selectedLayoutId: DEFAULT_LAYOUT_ID,
}, [], 'missing-film')
assert.equal(unchangedCollection.selectedFilmId, DEFAULT_FILM_ID)

const captionPlan = buildCaptionPersistencePlan({
  target: { date: '2026-08-13', completedAt: '2026-08-13T12:00:00.000Z', caption: '舊文', achievements: { keep: true } },
  caption: '新文',
  defaultCaption: 'NIJI 拾色日記',
  history: [{ date: '2026-08-13', completedAt: '2026-08-13T12:00:00.000Z', caption: '舊文' }],
  filmCollection: { unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: DEFAULT_FILM_ID, selectedLayoutId: DEFAULT_LAYOUT_ID },
  ensureCustomCaptionChallenge: (day) => ({
    ...day,
    achievements: {
      ...(day.achievements ?? {}),
      filmChallenges: { version: 2, customCaption: true },
    },
  }),
  getFilmProgressChanges: () => [{ filmId: 'sky-blue', previous: 0, current: 1, target: 1, unlocked: true }],
})
assert.equal(captionPlan.nextTarget.caption, '新文')
assert.equal(captionPlan.nextHistory[0].caption, '新文')
assert.equal(captionPlan.nextFilmNotifications[0].id, '2026-08-13T12:00:00.000Z-sky-blue')
assert.equal(captionPlan.filmCollectionChanged, true)

console.log('App collection coordinator: hydration, caption repair, and optimistic film recovery preserve compatible in-memory state.')
