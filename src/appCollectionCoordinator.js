import { FILMS, getFilmLayoutId, normalizeFilmCollection } from './films.js'

function createEmptyDraft() {
  return { schemaVersion: 3, photos: {}, samples: {}, completedAt: null }
}

export function stripFilmCollectionMeta(collection) {
  const { needsSave, ...persisted } = collection
  return persisted
}

export function createInitialFilmCollection({ qaMode, qaFilmId }) {
  const collection = stripFilmCollectionMeta(normalizeFilmCollection(null))
  if (!qaMode || !FILMS.some((film) => film.id === qaFilmId)) return collection
  return { ...collection, unlockedFilmIds: FILMS.map((film) => film.id), selectedFilmId: qaFilmId }
}

export async function compactCompletedHistory(completedDays, migrateCompletedDay, renderCaptionlessPolaroid) {
  const compactedDays = []
  for (const completedDay of completedDays) {
    compactedDays.push(await migrateCompletedDay(completedDay, renderCaptionlessPolaroid))
  }
  return compactedDays
}

export async function repairCompletedCaptionChallenges(completedDays, defaultCaption, ensureCustomCaptionChallenge, saveDay) {
  const updatedDays = completedDays.map((day) => ensureCustomCaptionChallenge(day, defaultCaption))
  const changedDays = updatedDays.filter((day, index) => day !== completedDays[index])
  await Promise.all(changedDays.map(async (day) => {
    try { await saveDay(day) } catch { /* keep the in-memory repair; the next load can retry it */ }
  }))
  return updatedDays
}

export function recoverHydratedFilmCollection(filmCollection, completedDays, pendingFilmId) {
  if (!pendingFilmId || !filmCollection.unlockedFilmIds.includes(pendingFilmId)) return filmCollection
  return stripFilmCollectionMeta(normalizeFilmCollection({ ...filmCollection, selectedFilmId: pendingFilmId }, completedDays))
}

export async function hydrateAppCollectionState({
  date,
  defaultCaption,
  loadCollectionState,
  migrateCompletedDay,
  renderCaptionlessPolaroid,
  ensureCustomCaptionChallenge,
  saveDay,
  saveFilmCollection,
  readPendingFilmSelection,
  clearPendingFilmSelection,
}) {
  const { completedDays, dailyLocked, draft, filmCollection: savedFilmCollection } = await loadCollectionState(date)
  const compactedDays = await compactCompletedHistory(completedDays, migrateCompletedDay, renderCaptionlessPolaroid)
  const repairedDays = await repairCompletedCaptionChallenges(compactedDays, defaultCaption, ensureCustomCaptionChallenge, saveDay)
  const normalizedFilmCollection = normalizeFilmCollection(savedFilmCollection, repairedDays)
  const hydratedFilmCollection = stripFilmCollectionMeta(normalizedFilmCollection)
  if (normalizedFilmCollection.needsSave) await saveFilmCollection(hydratedFilmCollection)

  const completedToday = repairedDays.find((item) => item.date === date) ?? null
  const savedDay = completedToday ?? draft
  const pendingFilmId = readPendingFilmSelection()
  const filmCollection = recoverHydratedFilmCollection(hydratedFilmCollection, repairedDays, pendingFilmId)

  if (pendingFilmId) {
    if (filmCollection.selectedFilmId === pendingFilmId) {
      saveFilmCollection(filmCollection).then(() => clearPendingFilmSelection(pendingFilmId)).catch(() => {})
    } else {
      clearPendingFilmSelection(pendingFilmId)
    }
  }

  return {
    day: savedDay ? { ...savedDay, samples: savedDay.samples ?? {} } : createEmptyDraft(),
    dailyLocked,
    history: repairedDays,
    filmCollection,
  }
}

export function buildSelectedFilmCollection(filmCollection, history, selectedFilmId) {
  return stripFilmCollectionMeta(normalizeFilmCollection({ ...filmCollection, selectedFilmId }, history))
}

export function buildSelectedLayoutCollection(filmCollection, history, layoutId) {
  const selectedLayoutId = getFilmLayoutId(filmCollection.selectedFilmId, layoutId)
  return stripFilmCollectionMeta(normalizeFilmCollection({ ...filmCollection, selectedLayoutId }, history))
}

export function buildCaptionPersistencePlan({
  target,
  caption,
  defaultCaption,
  history,
  filmCollection,
  ensureCustomCaptionChallenge,
  getFilmProgressChanges,
}) {
  const nextTarget = ensureCustomCaptionChallenge({ ...target, caption }, defaultCaption)
  const nextHistory = history.some((item) => item?.date === nextTarget.date)
    ? history.map((item) => item?.date === nextTarget.date ? nextTarget : item)
    : [nextTarget, ...history]
  const nextFilmCollection = stripFilmCollectionMeta(normalizeFilmCollection(filmCollection, nextHistory))
  const nextFilmNotifications = getFilmProgressChanges(history, nextHistory)
    .filter((notification) => !filmCollection.unlockedFilmIds.includes(notification.filmId))
    .map((notification) => ({ ...notification, id: `${nextTarget.completedAt ?? nextTarget.date}-${notification.filmId}` }))
  const filmCollectionChanged = filmCollection.selectedFilmId !== nextFilmCollection.selectedFilmId
    || filmCollection.unlockedFilmIds.length !== nextFilmCollection.unlockedFilmIds.length
    || filmCollection.unlockedFilmIds.some((filmId, index) => filmId !== nextFilmCollection.unlockedFilmIds[index])

  return {
    nextTarget,
    nextHistory,
    nextFilmCollection,
    nextFilmNotifications,
    filmCollectionChanged,
  }
}
