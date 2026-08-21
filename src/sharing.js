export function createPolaroidShareData(file, { title, text }) {
  return {
    files: [file],
    title,
    text,
  }
}
