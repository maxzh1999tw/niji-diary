import {
  exportIndexedDBRecords,
  mergeStorageRecords,
  saveImportedRecords,
  STORAGE_SNAPSHOT_SCHEMA_VERSION,
  validateStorageSnapshot,
} from './storage.js'

export const LEGACY_APP_URL = 'https://maxzh1999tw.github.io/niji-diary/'
export const LEGACY_ORIGIN = new URL(LEGACY_APP_URL).origin
export const NEW_APP_URL = 'https://niji.mia-and-max.com/'
export const NEW_APP_ORIGIN = new URL(NEW_APP_URL).origin
export const LEGACY_IMPORT_READY = 'niji-diary:import-ready'
export const LEGACY_IMPORT_OFFER = 'niji-diary:import-offer'
export const LEGACY_IMPORT_RESPONSE = 'niji-diary:import-response'
const MIGRATION_MARKER_KEY = 'niji-legacy-migration-v1'

function createMigrationError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function readLocalStorageEntries() {
  const entries = []
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key === null) continue
      const value = localStorage.getItem(key)
      if (value !== null) entries.push({ key, value })
    }
  } catch {
    // IndexedDB records are still useful when localStorage is unavailable.
  }
  return entries
}

export async function createLegacyStorageSnapshot() {
  return {
    schemaVersion: STORAGE_SNAPSHOT_SCHEMA_VERSION,
    indexedDB: { records: await exportIndexedDBRecords() },
    localStorage: readLocalStorageEntries(),
  }
}

export function sendLegacyStorageToNewSite({ timeoutMs = 20_000 } = {}) {
  if (typeof window === 'undefined' || typeof window.open !== 'function') {
    return Promise.reject(createMigrationError('unsupported', 'Popup migration is unavailable'))
  }

  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    let popup = null
    let snapshot = null
    let intervalId = null
    let timeoutId = null
    let snapshotError = null
    let newSiteReady = false
    let offerSent = false
    let finished = false

    const cleanup = (closePopup = false) => {
      window.removeEventListener('message', handleMessage)
      if (intervalId !== null) window.clearInterval(intervalId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      if (closePopup) {
        try { popup?.close() } catch { /* ignore a closed cross-origin popup */ }
      }
    }

    const finish = (error, result) => {
      if (finished) return
      finished = true
      cleanup(Boolean(error))
      if (error) reject(error)
      else resolve(result)
    }

    const handleMessage = (event) => {
      if (event.origin !== NEW_APP_ORIGIN || event.source !== popup) return
      const message = event.data
      if (message?.type === LEGACY_IMPORT_READY) {
        newSiteReady = true
        sendOffer()
        return
      }
      if (!message || message.type !== LEGACY_IMPORT_RESPONSE || message.requestId !== requestId) return
      if (!message.ok) {
        finish(createMigrationError(message.errorCode || 'import-failed', 'The new site rejected the import'))
        return
      }
      finish(null, message.result ?? {})
    }

    const sendOffer = () => {
      if (finished || snapshotError || !newSiteReady || offerSent) return
      try {
        if (popup?.closed) {
          finish(createMigrationError('popup-closed', 'The new site window was closed'))
          return
        }
        if (snapshot) {
          popup?.postMessage({ type: LEGACY_IMPORT_OFFER, requestId, snapshot }, NEW_APP_ORIGIN)
          offerSent = true
        }
      } catch {
        finish(createMigrationError('import-failed', 'Could not contact the new site'))
      }
    }

    window.addEventListener('message', handleMessage)
    popup = window.open(NEW_APP_URL, `niji-diary-new-migration-${requestId}`, 'popup,width=480,height=720,resizable=yes,scrollbars=yes')
    if (!popup) {
      finish(createMigrationError('popup-blocked', 'The new site window was blocked'))
      return
    }

    createLegacyStorageSnapshot()
      .then((nextSnapshot) => { snapshot = nextSnapshot; sendOffer() })
      .catch(() => {
        snapshotError = createMigrationError('export-failed', 'Could not read the legacy site data')
        finish(snapshotError)
      })
    intervalId = window.setInterval(sendOffer, 250)
    timeoutId = window.setTimeout(() => finish(createMigrationError('timeout', 'The new site did not respond')), timeoutMs)
  })
}

function importMissingLocalStorage(entries) {
  const result = { importedLocalStorage: 0, skippedLocalStorage: 0, failedLocalStorage: 0 }
  for (const { key, value } of entries) {
    try {
      if (localStorage.getItem(key) !== null) {
        result.skippedLocalStorage += 1
      } else {
        localStorage.setItem(key, value)
        result.importedLocalStorage += 1
      }
    } catch {
      result.failedLocalStorage += 1
    }
  }
  return result
}

export async function importStorageSnapshot(snapshot) {
  const validatedSnapshot = validateStorageSnapshot(snapshot)
  let mergeResult
  try {
    const existingRecords = await exportIndexedDBRecords()
    mergeResult = mergeStorageRecords(existingRecords, validatedSnapshot.indexedDB.records)
    await saveImportedRecords(mergeResult.recordsToWrite)
  } catch (error) {
    if (!error.code) error.code = 'import-failed'
    throw error
  }

  const localStorageResult = importMissingLocalStorage(validatedSnapshot.localStorage)
  try {
    localStorage.setItem(MIGRATION_MARKER_KEY, JSON.stringify({
      schemaVersion: 1,
      migratedAt: new Date().toISOString(),
      source: LEGACY_APP_URL,
      importedRecords: mergeResult.importedRecords,
      mergedRecords: mergeResult.mergedRecords,
    }))
  } catch {
    // The data import is complete even if the optional marker cannot be saved.
  }

  return {
    importedRecords: mergeResult.importedRecords,
    mergedRecords: mergeResult.mergedRecords,
    skippedRecords: mergeResult.skippedRecords,
    ...localStorageResult,
  }
}
