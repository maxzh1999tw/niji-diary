import { FILM_COLLECTION_SCHEMA_VERSION, isAllGreenRainbow, normalizeFilmCollection } from './films.js'

const DB_NAME = 'niji-diary'
const STORE_NAME = 'days'
const DB_VERSION = 1

export const COMPLETED_DAY_SCHEMA_VERSION = 5

export const ACTIVE_DRAFT_KEY = '__active-draft__'
export const FILM_COLLECTION_KEY = '__film-collection__'
export const COMPLETION_GATE_KEY = '__completion-gate__'
export const STORAGE_SNAPSHOT_SCHEMA_VERSION = 1
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

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function createStorageError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export async function exportIndexedDBRecords() {
  return getAllRecords()
}

export function validateStorageSnapshot(snapshot) {
  if (!isRecord(snapshot) || snapshot.schemaVersion !== STORAGE_SNAPSHOT_SCHEMA_VERSION) {
    throw createStorageError('invalid-snapshot', 'Unsupported storage snapshot version')
  }

  const records = snapshot.indexedDB?.records
  if (!Array.isArray(records)) throw createStorageError('invalid-snapshot', 'IndexedDB records are missing')
  const normalizedRecords = records.map((record) => {
    if (!isRecord(record) || typeof record.date !== 'string' || !record.date || record.date.length > 256) {
      throw createStorageError('invalid-snapshot', 'IndexedDB record is invalid')
    }
    return { ...record }
  })

  const localStorage = snapshot.localStorage ?? []
  if (!Array.isArray(localStorage)) throw createStorageError('invalid-snapshot', 'localStorage entries are invalid')
  const normalizedLocalStorage = localStorage.map((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string' || typeof entry.value !== 'string' || entry.key.length > 1024) {
      throw createStorageError('invalid-snapshot', 'localStorage entry is invalid')
    }
    return { key: entry.key, value: entry.value }
  })

  return {
    schemaVersion: STORAGE_SNAPSHOT_SCHEMA_VERSION,
    indexedDB: { ...snapshot.indexedDB, records: normalizedRecords },
    localStorage: normalizedLocalStorage,
  }
}

function hasEntries(value) {
  return isRecord(value) && Object.keys(value).length > 0
}

function hasMeaningfulDraft(record) {
  return hasEntries(record?.photos)
    || hasEntries(record?.samples)
    || Boolean(record?.caption || record?.background || record?.cardImage || record?.composition)
}

function latestCalendarDate(...dates) {
  return dates
    .filter((date) => typeof date === 'string' && CALENDAR_DATE_PATTERN.test(date))
    .sort((a, b) => a.localeCompare(b))
    .at(-1)
}

function mergeCompletionGate(incoming, existing) {
  return {
    ...incoming,
    ...existing,
    date: COMPLETION_GATE_KEY,
    lastCompletedDate: latestCalendarDate(existing.lastCompletedDate, incoming.lastCompletedDate)
      ?? existing.lastCompletedDate
      ?? incoming.lastCompletedDate,
  }
}

function mergeFilmCollection(incoming, existing) {
  const unlockedFilmIds = [...new Set([
    ...(Array.isArray(incoming.unlockedFilmIds) ? incoming.unlockedFilmIds : []),
    ...(Array.isArray(existing.unlockedFilmIds) ? existing.unlockedFilmIds : []),
  ].filter((filmId) => typeof filmId === 'string'))]
  const destinationSelected = typeof existing.selectedFilmId === 'string' && unlockedFilmIds.includes(existing.selectedFilmId)
    ? existing.selectedFilmId
    : null
  const sourceSelected = typeof incoming.selectedFilmId === 'string' && unlockedFilmIds.includes(incoming.selectedFilmId)
    ? incoming.selectedFilmId
    : null

  return {
    ...incoming,
    ...existing,
    date: FILM_COLLECTION_KEY,
    unlockedFilmIds,
    selectedFilmId: destinationSelected ?? sourceSelected ?? existing.selectedFilmId ?? incoming.selectedFilmId,
  }
}

function mergeActiveDraft(incoming, existing) {
  return hasMeaningfulDraft(existing)
    ? { ...incoming, ...existing, date: ACTIVE_DRAFT_KEY }
    : { ...existing, ...incoming, date: ACTIVE_DRAFT_KEY }
}

function valuesEqual(left, right) {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => valuesEqual(value, right[index]))
  }
  if (isRecord(left) || isRecord(right)) {
    if (!isRecord(left) || !isRecord(right)) return false
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    return [...keys].every((key) => valuesEqual(left[key], right[key]))
  }
  return false
}

function recordsEqual(left, right) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...keys].every((key) => valuesEqual(left[key], right[key]))
}

export function mergeStorageRecords(existingRecords, incomingRecords) {
  const merged = new Map(existingRecords.filter((record) => isRecord(record) && typeof record.date === 'string').map((record) => [record.date, record]))
  const recordsToWrite = []
  let importedRecords = 0
  let mergedRecords = 0
  let skippedRecords = 0

  for (const incoming of incomingRecords) {
    const existing = merged.get(incoming.date)
    if (!existing) {
      merged.set(incoming.date, incoming)
      recordsToWrite.push(incoming)
      importedRecords += 1
      continue
    }

    let combined = existing
    if (incoming.date === COMPLETION_GATE_KEY) combined = mergeCompletionGate(incoming, existing)
    if (incoming.date === FILM_COLLECTION_KEY) combined = mergeFilmCollection(incoming, existing)
    if (incoming.date === ACTIVE_DRAFT_KEY) combined = mergeActiveDraft(incoming, existing)

    if (combined === existing || recordsEqual(combined, existing)) {
      skippedRecords += 1
      continue
    }
    merged.set(incoming.date, combined)
    recordsToWrite.push(combined)
    mergedRecords += 1
  }

  return {
    records: [...merged.values()],
    recordsToWrite,
    importedRecords,
    mergedRecords,
    skippedRecords,
  }
}

export function saveImportedRecords(records) {
  if (!records.length) return Promise.resolve(0)
  return transact('readwrite', (store) => {
    records.forEach((record) => store.put(record))
    return records.length
  })
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
  delete completedDay.filmId
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
    || 'filmId' in day
  )
}

export async function migrateCompletedDay(day, renderPolaroid, persist = saveDay) {
  if (!completedDayNeedsCompaction(day)) return day

  try {
    const polaroidImage = day.schemaVersion === COMPLETED_DAY_SCHEMA_VERSION && day.polaroidImage
      ? day.polaroidImage
      : await renderPolaroid(day)
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
