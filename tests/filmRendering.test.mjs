import assert from 'node:assert/strict'
import { DEFAULT_FILM_ID, DEFAULT_LAYOUT_ID, FILMS, getFilmArtwork, MOSAIC_LAYOUT_ID } from '../src/films.js'
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

function artworkAnchor(shape) {
  if (Number.isFinite(shape.cx) && Number.isFinite(shape.cy)) return { x: shape.cx, y: shape.cy }
  const match = shape.d?.match(/M\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/)
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null
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
assert.deepEqual(mosaicSources.slice(0, 3).map(({ x, y }) => [x, y]), [[42, 35], [318, 35], [594, 35]], 'the first three color photos must form one left-aligned horizontal row')
assert.deepEqual(mosaicSources.slice(3).map(({ x, y }) => [x, y]), [[42, 311], [42, 587], [42, 863], [42, 1139]], 'the final four color photos must stack on the left')
assert.ok(mosaicSources.every(({ width, height }) => width === height), 'all seven color-photo frames must be square')
assert.ok(mosaicSources.every(({ width, height }) => width === mosaicSources[0].width && height === mosaicSources[0].height), 'the horizontal and vertical color-photo frames must share one size')
assert.equal(mosaicSources[0].width, 250, 'all color-photo frames must use the requested 250px size')
assert.equal(mosaicSources[1].x - (mosaicSources[0].x + mosaicSources[0].width), 26, 'the horizontal color-photo gap must match the vertical gap')
assert.equal(mosaicSources[4].y - (mosaicSources[3].y + mosaicSources[3].height), 26, 'the vertical color-photo gap must stay compact')
assert.equal(mosaicSources[3].y - (mosaicSources[0].y + mosaicSources[0].height), 26, 'the top-to-second-row gap must match the vertical gap')
assert.ok(mosaicSources.every((source) => Object.entries(POLAROID_SOURCE_FRAME).every(([key, value]) => source[key] === value)), 'new layout color frames must reuse the default frame design')
assert.ok(mosaicSources.every((source, index) => source.width > classicSources[index].width), 'all color photos must be larger than in the classic layout')
assert.equal(mosaicLayout.photo.y, mosaicSources[3].y, 'the main photo and left column must start on the same row')
assert.equal(mosaicLayout.photo.x - (mosaicSources[3].x + mosaicSources[3].width), 26, 'the main photo must keep the vertical column gap horizontally')
assert.equal(mosaicSources[0].x, mosaicSources[3].x, 'the left-aligned top row must share the left column edge')
assert.equal(mosaicLayout.photo.x, mosaicSources[1].x, 'the main photo must align below the second top tile')
assert.ok(mosaicSources[2].x + mosaicSources[2].width < mosaicLayout.photo.x + mosaicLayout.photo.width, 'the left-aligned top row must leave right-side whitespace before the main photo edge')
assert.equal(mosaicLayout.width - (mosaicLayout.photo.x + mosaicLayout.photo.width), mosaicSources[3].x, 'the main photo right whitespace must match the left column whitespace')
assert.equal(mosaicSources[6].y + mosaicSources[6].height, 1389, 'the smaller left color column must leave a balanced bottom margin')
assert.ok(mosaicLayout.photo.width > mosaicSources[0].width && mosaicLayout.photo.height > mosaicSources[0].height, 'the main photo must remain larger than one color photo')
assert.equal(mosaicLayout.photo.width, 640, 'the main photo must expand left while preserving the right whitespace')
assert.ok(mosaicLayout.photo.width < 681, 'the main photo must be slightly smaller than the previous corner layout')
assert.equal(mosaicLayout.caption.x, mosaicLayout.photo.x, 'the caption must align with the main photo')
assert.equal(mosaicLayout.caption.width, mosaicLayout.photo.width, 'the caption width must match the main photo width')
assert.ok(mosaicLayout.caption.x > 300, 'the caption must move to the lower-right area')
assert.equal(mosaicLayout.caption.y - (mosaicLayout.photo.y + mosaicLayout.photo.height), 26, 'the caption must keep the same gap below the main photo as the vertical color tiles')
assert.equal(mosaicLayout.caption.y + mosaicLayout.caption.height, mosaicSources[6].y + mosaicSources[6].height, 'the caption bottom must align with the vertical color column bottom')
assert.equal(mosaicLayout.caption.y, 1137, 'the mosaic caption must begin after one shared vertical gap')
assert.equal(mosaicLayout.caption.height, 252, 'the mosaic caption must grow to the vertical color column bottom')
assert.equal(mosaicLayout.caption.lineHeight, 42, 'the mosaic caption must use the requested two-pixel smaller line spacing')
assert.ok(mosaicLayout.caption.y + mosaicLayout.caption.height <= mosaicLayout.date.y, 'the caption and date must keep separate vertical areas')
assert.equal(mosaicLayout.date.y - (mosaicLayout.caption.y + mosaicLayout.caption.height), 12, 'the date row must keep a small gap below the caption')
assert.equal(mosaicLayout.date.y, 1401, 'the date row must move below the taller caption area')
assert.equal(mosaicLayout.date.baselineY, 1444, 'the date baseline must move with the date row')
assert.equal(mosaicGeometry.sourceRects, mosaicSources, 'DOM, thumbnail, and export geometry must reuse the same immutable source rectangles')
assert.equal(getPolaroidLayoutGeometry(MOSAIC_LAYOUT_ID), mosaicGeometry, 'layout geometry must be cached as one immutable render contract')
assert.equal(mosaicGeometry.photo, mosaicLayout.photo)
assert.deepEqual(mosaicGeometry.photoCardStyle, { left: '31.8cqw', top: '31.1cqw', width: '64cqw', height: '80cqw' })
assert.deepEqual(mosaicGeometry.photoThumbnailStyle, { left: '31.8%', top: '20.733333%', width: '64%', height: '53.333333%' })
assert.ok(mosaicLayout.caption.y > mosaicLayout.photo.y + mosaicLayout.photo.height, 'the corner-layout caption must start below the main photo')
assert.ok(mosaicLayout.caption.y - (mosaicLayout.photo.y + mosaicLayout.photo.height) >= 26, 'the corner-layout caption must keep a visible gap below the main photo')
assert.equal(mosaicLayout.caption.maxLines, 4, 'the corner-layout caption must allow up to four lines')
assert.equal(mosaicGeometry.captionCardStyle.left, '31.8cqw')
assert.equal(mosaicGeometry.captionCardStyle.top, '113.7cqw')
assert.equal(mosaicGeometry.captionCardStyle.height, '25.2cqw')
assert.deepEqual(mosaicGeometry.captionThumbnailStyle, { left: '31.8%', top: '75.8%', width: '64%', height: '16.8%' })
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
  const overlayMaskShapeCount = foregroundArtworkCount ? 2 + getPolaroidSourceRects(POLAROID_LAYOUT).length : 0
  const overlayShapeCount = (model.overlaySvg.match(/<(?:circle|ellipse|rect|path) /g) ?? []).length - overlayMaskShapeCount
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

for (const film of FILMS) {
  const classicArtwork = getFilmArtwork(film, DEFAULT_LAYOUT_ID)
  const mosaicArtwork = getFilmArtwork(film, MOSAIC_LAYOUT_ID)
  const mosaicModel = getFilmRenderModel(film.id, MOSAIC_LAYOUT_ID)
  const reusesClassicArtwork = ['letterpress-ochre', 'comet-orange', 'threefold-light'].includes(film.id)
  assert.equal(mosaicModel.layout, MOSAIC_POLAROID_LAYOUT, `${film.id} must resolve the mosaic layout`)
  assert.equal(mosaicModel.svg, createFilmSurfaceSvg(film.id, MOSAIC_LAYOUT_ID), `${film.id} mosaic surface must use its layout artwork`)
  assert.equal(mosaicModel.overlaySvg, createFilmOverlaySvg(film.id, MOSAIC_LAYOUT_ID), `${film.id} mosaic overlay must use its layout artwork`)
  assert.equal(classicArtwork, film.artwork, `${film.id} classic artwork must keep the original artwork array`)
  assert.ok(Array.isArray(mosaicArtwork), `${film.id} mosaic artwork must be declared as an array`)
  const classicTypes = new Set(classicArtwork.map(({ type }) => type))
  assert.ok(mosaicArtwork.every(({ type }) => classicTypes.has(type)), `${film.id} mosaic artwork must reuse the classic visual vocabulary`)
  if (film.id === DEFAULT_FILM_ID) {
    assert.equal(mosaicArtwork.length, 0, 'classic white must stay completely undecorated in the mosaic layout')
  } else if (reusesClassicArtwork) {
    assert.equal(mosaicArtwork, classicArtwork, `${film.id} must reuse the classic artwork positions in the mosaic layout`)
    assert.equal(mosaicModel.svg, getFilmRenderModel(film.id, DEFAULT_LAYOUT_ID).svg, `${film.id} mosaic must reuse the classic background artwork exactly`)
  } else {
    const anchors = mosaicArtwork.map(artworkAnchor).filter(Boolean)
    assert.ok(anchors.some(({ x, y }) => x >= 840 && y <= 310), `${film.id} mosaic artwork must retain a top-right asymmetric motif`)
    assert.ok(mosaicArtwork.length >= 7, `${film.id} mosaic artwork must distribute several decorative details across the card`)
    assert.ok(anchors.some(({ x }) => x <= 80), `${film.id} mosaic artwork must use the left-side whitespace`)
    assert.ok(anchors.some(({ x, y }) => x >= 318 && y >= 1137), `${film.id} mosaic artwork must use the caption area`)
    assert.ok(anchors.some(({ x, y }) => x >= 293 && x <= 317 && y >= 35 && y <= 1111), `${film.id} mosaic artwork must use the narrow layout gap`)
    if (film.id === 'sky-blue') {
      assert.ok(mosaicArtwork.some(({ type, radius, cy }) => type === 'circle' && radius >= 32 && cy >= 1137 && cy <= 1415), 'sky-blue mosaic must keep large classic-style bubbles in the caption area')
    }
    if (film.id === 'pink-pop') {
      assert.ok(mosaicArtwork.some(({ type, d }) => type === 'path' && d?.startsWith('M 332 1342')), 'pink-pop mosaic must keep the large classic star in the caption area')
      assert.ok(mosaicArtwork.some(({ type, d }) => type === 'path' && d?.startsWith('M 665 1405')), 'pink-pop mosaic must keep the large classic heart in the caption area')
    }
  }
  if (!reusesClassicArtwork) assert.notEqual(mosaicArtwork, classicArtwork, `${film.id} must provide a distinct mosaic artwork array`)
}

for (const filmId of ['letterpress-ochre', 'comet-orange', 'threefold-light']) {
  const mosaicOverlay = getFilmRenderModel(filmId, MOSAIC_LAYOUT_ID).overlaySvg
  assert.match(mosaicOverlay, /<rect x="42" y="35" width="250" height="250" fill="black"\/>/, `${filmId} classic artwork reuse must stay behind the first mosaic color photo`)
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
assert.equal(getFilmRenderModel(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID).overlaySvg.includes('<circle'), false, 'classic white mosaic overlay must remain empty')
assert.equal(getFilmRenderModel(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID).overlaySvg.includes('<path'), false, 'classic white mosaic overlay must remain empty')

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
