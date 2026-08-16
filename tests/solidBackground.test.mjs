import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSolidBackgroundSource, hslToHex, normalizeSolidBackgroundColor, SOLID_BACKGROUND_PRESETS } from '../src/solidBackground.js'

assert.equal(SOLID_BACKGROUND_PRESETS.length, 8)
for (const preset of SOLID_BACKGROUND_PRESETS) {
  assert.equal(normalizeSolidBackgroundColor(preset.color), preset.color)
  assert.ok(preset.labelKey)
}
assert.equal(normalizeSolidBackgroundColor(' #bfe6ff '), '#BFE6FF')
assert.equal(normalizeSolidBackgroundColor('#fff'), null)
assert.equal(normalizeSolidBackgroundColor('not-a-color'), null)

const whiteSource = decodeURIComponent(createSolidBackgroundSource('#ffffff'))
assert.match(whiteSource, /^data:image\/svg\+xml;charset=UTF-8,/)
assert.match(whiteSource, /width="1200" height="1500"/)
assert.match(whiteSource, /fill="#FFFFFF"/)
assert.equal(hslToHex(0, 100, 50), '#FF0000')
assert.equal(hslToHex(120, 100, 50), '#00FF00')
assert.equal(hslToHex(240, 100, 50), '#0000FF')

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const composeStart = appSource.indexOf('function ComposeScreen')
const composeEnd = appSource.indexOf('function ArchivePolaroid', composeStart)
const composeSource = appSource.slice(composeStart, composeEnd)
assert.match(composeSource, /chooseSolidBackground/)
assert.match(composeSource, /solid-canvas-source/)
assert.match(composeSource, /SolidBackgroundPicker/)
assert.doesNotMatch(appSource, /type="color"/)
assert.match(appSource, /className="hue-range"/)
assert.match(appSource, /className="saturation-range"/)
assert.match(appSource, /className="lightness-range"/)

const confirmStart = appSource.indexOf('async function confirmColor')
const confirmEnd = appSource.indexOf('function resamplePhoto', confirmStart)
const confirmSource = appSource.slice(confirmStart, confirmEnd)
assert.match(confirmSource, /if \(!collectionComplete\) showMessage/)
assert.match(confirmSource, /if \(collectionComplete\) \{/)
assert.match(confirmSource, /setMessage\(''\)/)

console.log('Solid backgrounds: presets, custom HSL controls, studio switching, and seventh-color notice suppression are wired correctly.')
