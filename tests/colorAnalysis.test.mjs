import assert from 'node:assert/strict'
import { analyzePixel, analyzePixels, analyzeRegion } from '../src/colorAnalysis.js'

const samples = {
  red: [220, 35, 55],
  orange: [235, 120, 25],
  yellow: [220, 200, 30],
  green: [35, 190, 85],
  blue: [30, 135, 220],
  indigo: [75, 55, 180],
  violet: [175, 55, 205],
}

for (const [expected, rgb] of Object.entries(samples)) {
  const pixels = new Uint8ClampedArray(Array.from({ length: 128 }, () => [...rgb, 255]).flat())
  assert.equal(analyzePixels(pixels, 4).suggestedKey, expected)
}

console.log('Color analysis: all seven rainbow colors detected correctly.')

const width = 20, height = 20
const image = new Uint8ClampedArray(width * height * 4)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4
    const center = x >= 7 && x <= 12 && y >= 7 && y <= 12
    image.set(center ? [220, 35, 55, 255] : [30, 135, 220, 255], index)
  }
}

assert.equal(analyzeRegion(image, width, height, { x: 0.5, y: 0.5 }, 0.14).suggestedKey, 'red')
assert.equal(analyzeRegion(image, width, height, { x: 0.1, y: 0.1 }, 0.08).suggestedKey, 'blue')
console.log('Region sampling: center and tapped positions detected correctly.')

const exactCenter = analyzePixel(image, width, height, { x: 0.5, y: 0.5 })
const exactCorner = analyzePixel(image, width, height, { x: 0.1, y: 0.1 })
assert.equal(exactCenter.sampleColor, 'rgb(220, 35, 55)')
assert.equal(exactCorner.sampleColor, 'rgb(30, 135, 220)')
assert.deepEqual(exactCenter.pixel, { x: 10, y: 10 })
console.log('Pixel sampling: exact source pixels returned without area averaging.')
