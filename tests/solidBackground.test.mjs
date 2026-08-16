import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSolidBackgroundSource, hslToHex, normalizeSolidBackgroundColor, rgbToHex, SOLID_BACKGROUND_PRESETS } from '../src/solidBackground.js'

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
assert.equal(rgbToHex(191, 230, 255), '#BFE6FF')
assert.equal(rgbToHex(-5, 127.6, 999), '#0080FF')

const [appSource, appStyles] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])
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
assert.match(appSource, /const rangeHueColor = `hsl\(\$\{hue\} 100% 50%\)`/)
assert.equal((appSource.match(/'--range-color': rangeHueColor/g) ?? []).length, 2)
assert.match(composeSource, /interactionOverlay=\{eyedropperActive/)
assert.match(composeSource, /onPickPolaroidColor\(point\)/)
assert.match(appSource, /sampleImageSourceColor\(polaroidImage, point\)/)
assert.match(appStyles, /\.solid-picker-mode-actions \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
assert.match(appStyles, /\.polaroid-eyedropper-target \{[\s\S]*?cursor: crosshair;/)
assert.match(appStyles, /\.background-source:has\(input:focus-visible\),[\s\S]*?\.canvas-source-action:has\(input:focus-visible\) \{[\s\S]*?var\(--cyan\)/)

const confirmStart = appSource.indexOf('async function confirmColor')
const confirmEnd = appSource.indexOf('function resamplePhoto', confirmStart)
const confirmSource = appSource.slice(confirmStart, confirmEnd)
assert.match(confirmSource, /if \(!collectionComplete\) showMessage/)
assert.match(confirmSource, /if \(collectionComplete\) \{/)
assert.match(confirmSource, /setMessage\(''\)/)

console.log('Solid backgrounds: presets, custom HSL controls, studio switching, and seventh-color notice suppression are wired correctly.')
