import assert from 'node:assert/strict'
import { preserveRainbowTopAnchor } from '../src/rainbowGeometry.js'

function closeTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`)
}

const base = { x: 50, y: 58, scale: 1, rotation: 0, radius: 1, colorWidth: 1, custom: 'preserve' }
const expanded = preserveRainbowTopAnchor(base, 2)
closeTo(expanded.x, 50, 'unrotated rainbow keeps the top-center x position')
closeTo(expanded.y, 83.344, 'unrotated rainbow moves its center down with the radius')
assert.equal(expanded.radius, 2)
assert.equal(expanded.custom, 'preserve')

const rotated = preserveRainbowTopAnchor({ ...base, rotation: 90 }, 2)
closeTo(rotated.x, 18.32, 'rotated rainbow compensates horizontally')
closeTo(rotated.y, 58, 'rotated rainbow keeps the top-center y position')

const restored = preserveRainbowTopAnchor(expanded, 1)
closeTo(restored.x, base.x, 'restoring the radius returns the original x position')
closeTo(restored.y, base.y, 'restoring the radius returns the original y position')

console.log('Rainbow geometry: radius changes preserve the rotated top-center anchor.')
