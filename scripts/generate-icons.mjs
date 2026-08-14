import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.resolve('public')
const source = await readFile(path.join(publicDir, 'logo.svg'))

const standardSizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512]
const maskableSizes = [192, 512]

await mkdir(publicDir, { recursive: true })

async function renderIcon(size, scale, filename) {
  const markSize = Math.round(size * scale)
  const mark = await sharp(source)
    .resize(markSize, markSize, { fit: 'contain' })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#FFFAF4',
    },
  })
    .composite([{
      input: mark,
      left: Math.floor((size - markSize) / 2),
      top: Math.floor((size - markSize) / 2),
    }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(publicDir, filename))
}

for (const size of standardSizes) {
  await renderIcon(size, size <= 48 ? 0.86 : 0.9, `icon-${size}.png`)
}

for (const size of maskableSizes) {
  await renderIcon(size, 0.66, `icon-maskable-${size}.png`)
}

console.log(`Generated ${standardSizes.length + maskableSizes.length} PWA icons from public/logo.svg`)
