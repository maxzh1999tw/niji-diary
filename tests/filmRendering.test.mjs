import assert from 'node:assert/strict'
import { DEFAULT_FILM_ID, FILMS } from '../src/films.js'
import { createFilmOverlaySvg, createFilmSurfaceSvg, getFilmRenderModel, getPolaroidLayoutStyle, POLAROID_LAYOUT } from '../src/filmRendering.js'

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(left, right) {
  const [lighter, darker] = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

assert.equal(POLAROID_LAYOUT.width / POLAROID_LAYOUT.height, 2 / 3)
assert.equal(POLAROID_LAYOUT.photo.width / POLAROID_LAYOUT.photo.height, 4 / 5)
assert.equal(POLAROID_LAYOUT.sources.y, POLAROID_LAYOUT.photo.y + POLAROID_LAYOUT.photo.height + 24)

const layoutStyle = getPolaroidLayoutStyle()
assert.equal(layoutStyle['--polaroid-photo-x'], '3.5cqw')
assert.equal(layoutStyle['--polaroid-source-height'], '11.5cqw')
assert.equal(layoutStyle['--polaroid-footer-x'], '5%')

for (const film of FILMS) {
  const model = getFilmRenderModel(film.id)
  const backgroundArtworkCount = film.artwork.filter((shape) => shape.layer !== 'foreground').length
  const foregroundArtworkCount = film.artwork.filter((shape) => shape.layer === 'foreground').length
  const surfaceShapeCount = (model.svg.match(/<(?:circle|ellipse|rect|path) /g) ?? []).length - 1
  const overlayShapeCount = (model.overlaySvg.match(/<(?:circle|ellipse|rect|path) /g) ?? []).length - (foregroundArtworkCount ? 2 : 0)
  assert.equal(model.film, film)
  assert.equal(model.layout, POLAROID_LAYOUT)
  assert.equal(model, getFilmRenderModel(film.id), `${film.id} should reuse one immutable render model`)
  assert.equal(model.surfaceUrl.startsWith('data:image/svg+xml;charset=UTF-8,'), true)
  assert.equal(decodeURIComponent(model.surfaceUrl.split(',')[1]), model.svg)
  assert.equal(decodeURIComponent(model.overlayUrl.split(',')[1]), model.overlaySvg)
  assert.equal(model.svg, createFilmSurfaceSvg(film.id))
  assert.equal(model.overlaySvg, createFilmOverlaySvg(film.id))
  assert.equal(surfaceShapeCount, backgroundArtworkCount, `${film.id} background artwork must render exactly once`)
  assert.equal(overlayShapeCount, foregroundArtworkCount, `${film.id} foreground artwork must render exactly once`)
  if (foregroundArtworkCount) {
    assert.match(model.overlaySvg, /mask="url\(#frame-only\)"/)
    assert.match(model.overlaySvg, /<rect x="35" y="35" width="930" height="1162.5" fill="black"\/>/)
  }
  assert.match(model.svg, /viewBox="0 0 1000 1500"/)
  if (film.ink) {
    for (const ink of Object.values(film.ink)) {
      for (const paper of [film.paper.top, film.paper.middle, film.paper.bottom]) {
        assert.ok(contrastRatio(ink, paper) >= 4.5, `${film.id} ${ink} must remain readable on ${paper}`)
      }
    }
  }
}

const classicSurface = getFilmRenderModel(DEFAULT_FILM_ID).svg
assert.equal(classicSurface.includes('<path'), false, 'classic white must remain undecorated')
assert.equal(classicSurface.includes('<circle'), false, 'classic white must remain undecorated')
assert.equal(getFilmRenderModel(DEFAULT_FILM_ID).overlaySvg.includes('<path'), false, 'classic white overlay must remain empty')

const skyModel = getFilmRenderModel('sky-blue')
assert.equal((skyModel.svg.match(/<circle /g) ?? []).length, 6)
assert.equal((skyModel.overlaySvg.match(/<circle /g) ?? []).length, 6)
assert.equal(skyModel.svg.includes('<path'), false, 'sky-blue artwork must use circular bubbles only')
assert.equal(skyModel.overlaySvg.includes('<path'), false, 'sky-blue edge artwork must use circular bubbles only')
assert.equal((skyModel.svg + skyModel.overlaySvg).includes('<ellipse'), false, 'sky-blue circles must stay circles at every render size')
assert.equal(skyModel.overlaySvg.includes('frame-only'), true, 'sky-blue edge bubbles must be clipped to the paper frame')
assert.match(skyModel.svg, /fill="none" stroke="#56c9df"/)
assert.match(getFilmRenderModel('pink-pop').svg, /<path d="M 665 1405/)
assert.match(getFilmRenderModel('mint-green').svg, /stroke-linecap="round"/)
const letterpressArtwork = getFilmRenderModel('letterpress-ochre').svg + getFilmRenderModel('letterpress-ochre').overlaySvg
assert.match(letterpressArtwork, /#a94f3d/)
assert.match(letterpressArtwork, /M -20 102 H 22 V 178 H 56/)
assert.match(letterpressArtwork, /M 176 1208 H 374 L 404 1198/)
assert.doesNotMatch(letterpressArtwork, /M 8 88 H 58/, 'letterpress artwork must use a cohesive pressed-ribbon motif instead of crop marks')
assert.equal(letterpressArtwork.includes('<text'), false, 'letterpress artwork must not imitate printed copy or trademarks')
const vellumArtwork = getFilmRenderModel('vellum-mist').svg + getFilmRenderModel('vellum-mist').overlaySvg
assert.match(vellumArtwork, /#b7a8d8/)
assert.equal(vellumArtwork.includes('<circle'), false, 'vellum mist must not reuse sky-blue bubbles')
const cometArtwork = getFilmRenderModel('comet-orange').svg + getFilmRenderModel('comet-orange').overlaySvg
assert.match(cometArtwork, /M 242 1346 C 492 1264/)
assert.equal(cometArtwork.includes('<circle'), false, 'comet artwork must use continuous trails instead of stars or confetti')
const eclipseModel = getFilmRenderModel('eclipse-silver')
assert.match(eclipseModel.svg, /stop-color="#0d0f16"/)
assert.equal((eclipseModel.svg + eclipseModel.overlaySvg).includes('<circle'), false, 'eclipse artwork must use cropped exposure arcs instead of star shapes')
const threefoldArtwork = getFilmRenderModel('threefold-light').svg + getFilmRenderModel('threefold-light').overlaySvg
for (const color of ['#e98c78', '#e6b84a', '#3d8f87', '#59517d']) assert.match(threefoldArtwork, new RegExp(color))
assert.equal(getFilmRenderModel('missing-film').film.id, DEFAULT_FILM_ID)

console.log('Film rendering: previews, studio, and exports share one immutable 2:3 two-layer SVG and layout contract.')
