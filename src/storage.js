const DB_NAME = 'niji-diary'
const STORE_NAME = 'days'
const DB_VERSION = 1

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

export async function getDay(date) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(date)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function saveDay(day) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(day)
    request.onsuccess = () => resolve(day)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function deleteDay(date) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(date)
    request.onsuccess = () => resolve(date)
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}

export async function getCompletedDays() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(
      request.result
        .filter((day) => day.completedAt)
        .sort((a, b) => b.date.localeCompare(a.date)),
    )
    request.onerror = () => reject(request.error)
  }).finally(() => db.close())
}
