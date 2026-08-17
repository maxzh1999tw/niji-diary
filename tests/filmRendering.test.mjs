import assert from 'node:assert/strict'
import { DEFAULT_FILM_ID, FILMS, MOSAIC_LAYOUT_ID } from '../src/films.js'
import { createFilmOverlaySvg, createFilmSurfaceSvg, getFilmRenderModel, getPolaroidLayout, getPolaroidLayoutGeometry, getPolaroidLayoutStyle, getPolaroidSourceRects, MOSAIC_POLAROID_LAYOUT, POLAROID_LAYOUT, POLAROID_SOURCE_FRAME, scopeFilmRenderSvg } from '../src/filmRendering.js'

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
assert.equal(POLAROID_LAYOUT.caption.width, 600, 'the classic caption must reserve one extra character of space before the date')
assert.ok(POLAROID_LAYOUT.date.x - (POLAROID_LAYOUT.caption.x + POLAROID_LAYOUT.caption.width) >= 70, 'the classic caption and date must keep a safe ellipsis gap')

const layoutStyle = getPolaroidLayoutStyle()
assert.equal(layoutStyle['--polaroid-photo-x'], '3.5cqw')
assert.equal(layoutStyle['--polaroid-source-height'], '11.5cqw')
assert.equal(layoutStyle['--polaroid-footer-x'], '5%')

const mosaicLayout = getPolaroidLayout(MOSAIC_LAYOUT_ID)
const mosaicSources = getPolaroidSourceRects(mosaicLayout)
const mosaicGeometry = getPolaroidLayoutGeometry(mosaicLayout)
const classicSources = getPolaroidSourceRects(POLAROID_LAYOUT)
assert.equal(mosaicLayout, MOSAIC_POLAROID_LAYOUT)
assert.equal(mosaicLayout.photo.width / mosaicLayout.photo.height, 4 / 5, 'the new layout must preserve the main photo ratio')
assert.equal(mosaicSources.length, 7)
assert.deepEqual(mosaicSources.slice(0, 3).map(({ x, y }) => [x, y]), [[42, 35], [375, 35], [708, 35]], 'the first three color photos must form one horizontal row')
assert.deepEqual(mosaicSources.slice(3).map(({ x, y }) => [x, y]), [[42, 342], [42, 618], [42, 894], [42, 1170]], 'the final four color photos must stack on the left')
assert.ok(mosaicSources.every(({ width, height }) => width === height), 'all seven color-photo frames must be square')
assert.ok(mosaicSources.every(({ width, height }) => width === mosaicSources[0].width && height === mosaicSources[0].height), 'the horizontal and vertical color-photo frames must share one size')
assert.equal(mosaicSources[0].width, 250, 'all color-photo frames must use the requested 250px size')
assert.equal(mosaicSources[1].x - (mosaicSources[0].x + mosaicSources[0].width), 83, 'the horizontal color-photo gap must be larger than the vertical gap')
assert.equal(mosaicSources[4].y - (mosaicSources[3].y + mosaicSources[3].height), 26, 'the vertical color-photo gap must stay compact')
assert.ok(mosaicSources.every((source) => Object.entries(POLAROID_SOURCE_FRAME).every(([key, value]) => source[key] === value)), 'new layout color frames must reuse the default frame design')
assert.ok(mosaicSources.every((source, index) => source.width > classicSources[index].width), 'all color photos must be larger than in the classic layout')
assert.equal(mosaicLayout.photo.y, mosaicSources[3].y, 'the main photo and left column must start on the same row')
assert.equal(mosaicLayout.photo.x - (mosaicSources[3].x + mosaicSources[3].width), 26, 'the main photo must keep the vertical column gap horizontally')
assert.equal(mosaicSources[0].x, mosaicSources[3].x, 'the top row must align with the left column edge')
assert.equal(mosaicSources[2].x + mosaicSources[2].width, mosaicLayout.photo.x + mosaicLayout.photo.width, 'the top row must align with the main photo right edge')
assert.equal(mosaicLayout.width - (mosaicLayout.photo.x + mosaicLayout.photo.width), mosaicSources[0].x, 'the main photo right whitespace must match the left column whitespace')
assert.equal(mosaicSources[6].y + mosaicSources[6].height, 1420, 'the smaller left color column must leave a balanced bottom margin')
assert.ok(mosaicLayout.photo.width > mosaicSources[0].width && mosaicLayout.photo.height > mosaicSources[0].height, 'the main photo must remain larger than one color photo')
assert.equal(mosaicLayout.photo.width, 640, 'the main photo must expand left while preserving the right whitespace')
assert.ok(mosaicLayout.photo.width < 681, 'the main photo must be slightly smaller than the previous corner layout')
assert.equal(mosaicLayout.caption.x, mosaicLayout.photo.x, 'the caption must align with the main photo')
assert.equal(mosaicLayout.caption.width, mosaicLayout.photo.width, 'the caption width must match the main photo width')
assert.ok(mosaicLayout.caption.x > 300, 'the caption must move to the lower-right area')
assert.ok(mosaicLayout.caption.y + mosaicLayout.caption.height <= mosaicLayout.date.y, 'the caption and date must keep separate vertical areas')
assert.equal(mosaicGeometry.sourceRects, mosaicSources, 'DOM, thumbnail, and export geometry must reuse the same immutable source rectangles')
assert.equal(getPolaroidLayoutGeometry(MOSAIC_LAYOUT_ID), mosaicGeometry, 'layout geometry must be cached as one immutable render contract')
assert.equal(mosaicGeometry.photo, mosaicLayout.photo)
assert.deepEqual(mosaicGeometry.photoCardStyle, { left: '31.8cqw', top: '34.2cqw', width: '64cqw', height: '80cqw' })
assert.deepEqual(mosaicGeometry.photoThumbnailStyle, { left: '31.8%', top: '22.8%', width: '64%', height: '53.333333%' })
assert.ok(mosaicLayout.caption.y > mosaicLayout.photo.y + mosaicLayout.photo.height, 'the corner-layout caption must start below the main photo')
assert.ok(mosaicLayout.caption.y - (mosaicLayout.photo.y + mosaicLayout.photo.height) >= 32, 'the corner-layout caption must keep a visible gap below the main photo')
assert.equal(mosaicLayout.caption.maxLines, 3, 'the corner-layout caption must allow multiple lines')
assert.equal(mosaicGeometry.captionCardStyle.left, '31.8cqw')
assert.equal(mosaicGeometry.captionCardStyle.top, '117.5cqw')
assert.deepEqual(mosaicGeometry.captionThumbnailStyle, { left: '31.8%', top: '78.333333%', width: '64%', height: '12.533333%' })
const assertClose = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.000001, message)
mosaicGeometry.sources.forEach(({ rect, cardStyle, thumbnailStyle }, index) => {
  assertClose(Number.parseFloat(cardStyle.left), rect.x / mosaicLayout.width * 100, `card source ${index + 1} x must derive from the shared rectangle`)
  assertClose(Number.parseFloat(cardStyle.top), rect.y / mosaicLayout.width * 100, `card source ${index + 1} y must derive from the shared rectangle`)
  assertClose(Number.parseFloat(cardStyle.width), rect.width / mosaicLayout.width * 100, `card source ${index + 1} width must derive from the shared rectangle`)
  assertClose(Number.parseFloat(cardStyle.height), rect.height / mosaicLayout.width * 100, `card source ${index + 1} height must derive from the shared rectangle`)
  assertClose(Number.parseFloat(thumbnailStyle.left), rect.x / mosaicLayout.width * 100, `thumbnail source ${index + 1} x must derive from the shared rectangle`)
  assertClose(Number.parseFloat(thumbnailStyle.top), rect.y / mosaicLayout.height * 100, `thumbnail source ${index + 1} y must derive from the shared rectangle`)
  assertClose(Number.parseFloat(thumbnailStyle.width), rect.width / mosaicLayout.width * 100, `thumbnail source ${index + 1} width must derive from the shared rectangle`)
  assertClose(Number.parseFloat(thumbnailStyle.height), rect.height / mosaicLayout.height * 100, `thumbnail source ${index + 1} height must derive from the shared rectangle`)
})
assert.notEqual(getFilmRenderModel(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID), getFilmRenderModel(DEFAULT_FILM_ID), 'render models must be cached per film and layout')
assert.equal(getFilmRenderModel(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID).layout, MOSAIC_POLAROID_LAYOUT)
assert.equal(getFilmRenderModel(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID).geometry, mosaicGeometry)

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
  if (film.artwork.length) {
    assert.match(`${model.svg}${model.overlaySvg}`, /vector-effect="none"/, `${film.id} artwork strokes must remain viewport-scaled`)
  }
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
const scopedSurface = scopeFilmRenderSvg(getFilmRenderModel('sky-blue').svg, 'preview:one')
const scopedOverlay = scopeFilmRenderSvg(getFilmRenderModel('sky-blue').overlaySvg, 'preview:one')
assert.match(scopedSurface, /id="paper-previewone"/)
assert.match(scopedSurface, /url\(#paper-previewone\)/)
assert.match(scopedOverlay, /id="frame-only-previewone"/)
assert.match(scopedOverlay, /url\(#frame-only-previewone\)/)
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
