import { NEW_APP_URL } from './migration.js'

export function createPolaroidShareData(file, { title, text }, { includeUrl = true } = {}) {
  return {
    files: [file],
    title,
    text,
    ...(includeUrl ? { url: NEW_APP_URL } : {}),
  }
}
