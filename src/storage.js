import { FILM_COLLECTION_SCHEMA_VERSION, isAllGreenRainbow, normalizeFilmCollection } from './films.js'

const DB_NAME = 'niji-diary'
const STORE_NAME = 'days'
const DB_VERSION = 1

export const COMPLETED_DAY_SCHEMA_VERSION = 4

export const ACTIVE_DRAFT_KEY = '__active-draft__'
export const FILM_COLLECTION_KEY = '__film-collection__'
const COMPLETION_GATE_KEY = '__completion-gate__'
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'date' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transact(mode, action) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    let result

    try { result = action(store, transaction) }
    catch (error) { reject(error); db.close(); return }

    transaction.oncomplete = () => { resolve(result); db.close() }
    transaction.onerror = () => { reject(transaction.error); db.close() }
    transaction.onabort = () => { reject(transaction.error); db.close() }
  }))
}

function getAllRecords() {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close()))
}

export function deriveCollectionState(records, today) {
  const completedDays = records
    .filter((record) => CALENDAR_DATE_PATTERN.test(record.date) && record.completedAt)
    .sort((a, b) => b.date.localeCompare(a.date))
  const completedToday = completedDays.find((record) => record.date === today) ?? null
  const completionGate = records.find((record) => record.date === COMPLETION_GATE_KEY)
  const activeDraft = records.find((record) => record.date === ACTIVE_DRAFT_KEY)
  const legacyDrafts = records
    .filter((record) => CALENDAR_DATE_PATTERN.test(record.date) && !record.completedAt)
    .sort((a, b) => a.date.localeCompare(b.date))
  const todayLegacyDraft = legacyDrafts.find((record) => record.date === today)
  const draftSource = activeDraft ?? todayLegacyDraft

  return {
    completedDays,
    completedToday,
    dailyLocked: Boolean(completedToday || completionGate?.lastCompletedDate === today),
    draft: draftSource ? { ...draftSource, schemaVersion: 3, date: ACTIVE_DRAFT_KEY, completedAt: null } : null,
    draftNeedsMigration: !activeDraft && Boolean(todayLegacyDraft),
    legacyDraftKeys: legacyDrafts.map((record) => record.date),
  }
}

export async function loadCollectionState(today) {
  const records = await getAllRecords()
  const state = deriveCollectionState(records, today)
  const filmCollection = normalizeFilmCollection(records.find((record) => record.date === FILM_COLLECTION_KEY), state.completedDays)

  if (state.legacyDraftKeys.length) {
    if (state.draftNeedsMigration) await saveDraft(state.draft)
    await deleteRecords(state.legacyDraftKeys)
  }
  if (filmCollection.needsSave) await saveFilmCollection(filmCollection)

  return { ...state, filmCollection }
}

export function saveDay(day) {
  return transact('readwrite', (store) => {
    store.put(day)
    return day
  })
}

export function createCompletedDayRecord(day, polaroidImage = day?.polaroidImage) {
  if (typeof polaroidImage !== 'string' || !polaroidImage) throw new Error('Missing completed Polaroid image')

  const completedDay = {
    ...day,
    schemaVersion: COMPLETED_DAY_SCHEMA_VERSION,
    polaroidImage,
    achievements: {
      ...(day?.achievements ?? {}),
      allGreenRainbow: isAllGreenRainbow(day),
    },
  }

  delete completedDay.photos
  delete completedDay.samples
  delete completedDay.cardImage
  delete completedDay.composition
  return completedDay
}

export function completedDayNeedsCompaction(day) {
  return Boolean(day?.completedAt) && (
    day.schemaVersion !== COMPLETED_DAY_SCHEMA_VERSION
    || typeof day.polaroidImage !== 'string'
    || !day.polaroidImage
    || 'photos' in day
    || 'samples' in day
    || 'cardImage' in day
    || 'composition' in day
  )
}

export async function migrateCompletedDay(day, renderPolaroid, persist = saveDay) {
  if (!completedDayNeedsCompaction(day)) return day

  try {
    const polaroidImage = day.polaroidImage || await renderPolaroid(day)
    const compactedDay = createCompletedDayRecord(day, polaroidImage)
    await persist(compactedDay)
    return compactedDay
  } catch {
    return day
  }
}

export function saveDraft(day) {
  const draft = {
    ...day,
    schemaVersion: 3,
    date: ACTIVE_DRAFT_KEY,
    photos: day?.photos ?? {},
    samples: day?.samples ?? {},
    completedAt: null,
    updatedAt: new Date().toISOString(),
  }
  return transact('readwrite', (store) => {
    store.put(draft)
    return draft
  })
}

export function saveFilmCollection(collection) {
  const record = {
    ...collection,
    schemaVersion: FILM_COLLECTION_SCHEMA_VERSION,
    date: FILM_COLLECTION_KEY,
    unlockedFilmIds: Array.isArray(collection?.unlockedFilmIds) ? [...collection.unlockedFilmIds] : [],
    selectedFilmId: collection?.selectedFilmId,
  }
  delete record.needsSave
  return transact('readwrite', (store) => {
    store.put(record)
    return record
  })
}

export function completeDraft(day, completionDate) {
  const completedDay = createCompletedDayRecord({ ...day, date: completionDate })
  const completionGate = { date: COMPLETION_GATE_KEY, lastCompletedDate: completionDate }

  return transact('readwrite', (store) => {
    store.put(completedDay)
    store.put(completionGate)
    store.delete(ACTIVE_DRAFT_KEY)
    return completedDay
  })
}

function deleteRecords(keys) {
  if (!keys.length) return Promise.resolve()
  return transact('readwrite', (store) => {
    for (const key of keys) store.delete(key)
  })
}

export function deleteDay(date) {
  return transact('readwrite', (store) => {
    store.delete(date)
    return date
  })
}

export async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
