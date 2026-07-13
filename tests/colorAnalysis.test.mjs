import assert from 'node:assert/strict'
import { analyzePixels } from '../src/colorAnalysis.js'

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
