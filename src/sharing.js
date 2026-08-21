import { NEW_APP_URL } from './migration.js'

export function createPolaroidShareData(file, { title, text }) {
  return {
    files: [file],
    title,
    text,
    url: NEW_APP_URL,
  }
}
