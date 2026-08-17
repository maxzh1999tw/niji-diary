import { DEFAULT_LAYOUT_ID, getFilm, getFilmLayoutId, MOSAIC_LAYOUT_ID } from './films.js'

export const POLAROID_SOURCE_FRAME = Object.freeze({ innerX: 7, innerY: 7, innerBottom: 22, accentHeight: 8 })

export const POLAROID_LAYOUT = Object.freeze({
  id: DEFAULT_LAYOUT_ID,
  width: 1000,
  height: 1500,
  mediaHeight: 1336.5,
  photo: Object.freeze({ x: 35, y: 35, width: 930, height: 1162.5 }),
  sources: Object.freeze({ x: 42, y: 1221.5, width: 916, height: 115, gap: 11.5, ...POLAROID_SOURCE_FRAME }),
  caption: Object.freeze({ x: 50, y: 1366, width: 600, height: 104, fontSize: 45, lineHeight: 52, maxLines: 1, baselineY: 1418, verticalAlign: 'middle' }),
  date: Object.freeze({ x: 730, y: 1375, width: 220, height: 86, fontSize: 34, baselineY: 1418 }),
  footer: Object.freeze({ x: 50, textY: 1418, dateWidth: 220 }),
})

const MOSAIC_CARD_WIDTH = 1000
const MOSAIC_CARD_HEIGHT = 1500
const MOSAIC_MEDIA_HEIGHT = MOSAIC_CARD_HEIGHT
const MOSAIC_MAIN_TOP = 342
const MOSAIC_SIDE_MARGIN = 42
const MOSAIC_COLOR_SIZE = 250
const MOSAIC_VERTICAL_GAP = 26
const MOSAIC_HORIZONTAL_GAP = MOSAIC_VERTICAL_GAP
const MOSAIC_TOP_FIRST_X = MOSAIC_SIDE_MARGIN
const MOSAIC_TOP_SECOND_X = MOSAIC_TOP_FIRST_X + MOSAIC_COLOR_SIZE + MOSAIC_HORIZONTAL_GAP
const MOSAIC_TOP_THIRD_X = MOSAIC_TOP_SECOND_X + MOSAIC_COLOR_SIZE + MOSAIC_HORIZONTAL_GAP
const MOSAIC_MAIN_X = MOSAIC_SIDE_MARGIN + MOSAIC_COLOR_SIZE + MOSAIC_VERTICAL_GAP
const MOSAIC_MAIN_WIDTH = MOSAIC_CARD_WIDTH - MOSAIC_SIDE_MARGIN - MOSAIC_MAIN_X
const MOSAIC_MAIN_HEIGHT = MOSAIC_MAIN_WIDTH * 5 / 4

export const MOSAIC_POLAROID_LAYOUT = Object.freeze({
  id: MOSAIC_LAYOUT_ID,
  width: MOSAIC_CARD_WIDTH,
  height: MOSAIC_CARD_HEIGHT,
  mediaHeight: MOSAIC_MEDIA_HEIGHT,
  photo: Object.freeze({ x: MOSAIC_MAIN_X, y: MOSAIC_MAIN_TOP, width: MOSAIC_MAIN_WIDTH, height: MOSAIC_MAIN_HEIGHT }),
  sourceRects: Object.freeze([
    Object.freeze({ x: MOSAIC_TOP_FIRST_X, y: 35, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_TOP_SECOND_X, y: 35, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_TOP_THIRD_X, y: 35, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_SIDE_MARGIN, y: MOSAIC_MAIN_TOP, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_SIDE_MARGIN, y: MOSAIC_MAIN_TOP + MOSAIC_COLOR_SIZE + MOSAIC_VERTICAL_GAP, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_SIDE_MARGIN, y: MOSAIC_MAIN_TOP + (MOSAIC_COLOR_SIZE + MOSAIC_VERTICAL_GAP) * 2, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
    Object.freeze({ x: MOSAIC_SIDE_MARGIN, y: MOSAIC_MAIN_TOP + (MOSAIC_COLOR_SIZE + MOSAIC_VERTICAL_GAP) * 3, width: MOSAIC_COLOR_SIZE, height: MOSAIC_COLOR_SIZE }),
  ]),
  sourceFrame: POLAROID_SOURCE_FRAME,
  caption: Object.freeze({ x: MOSAIC_MAIN_X, y: 1175, width: MOSAIC_MAIN_WIDTH, height: 188, fontSize: 36, lineHeight: 40, maxLines: 3, verticalAlign: 'top' }),
  date: Object.freeze({ x: 730, y: 1375, width: 220, height: 86, fontSize: 34, baselineY: 1418 }),
  footer: Object.freeze({ x: 50, textY: 1418, dateWidth: 220 }),
})

export const POLAROID_LAYOUTS = Object.freeze({
  [DEFAULT_LAYOUT_ID]: POLAROID_LAYOUT,
  [MOSAIC_LAYOUT_ID]: MOSAIC_POLAROID_LAYOUT,
})

export function getPolaroidLayout(layoutId) {
  return POLAROID_LAYOUTS[layoutId] ?? POLAROID_LAYOUT
}

const sourceRectsCache = new WeakMap()

export function getPolaroidSourceRects(layoutOrId = DEFAULT_LAYOUT_ID) {
  const layout = typeof layoutOrId === 'object' && layoutOrId ? layoutOrId : getPolaroidLayout(layoutOrId)
  const cached = sourceRectsCache.get(layout)
  if (cached) return cached
  let sourceRects
  if (Array.isArray(layout.sourceRects)) {
    const frame = layout.sourceFrame
    sourceRects = layout.sourceRects.map((rect) => Object.freeze({ ...frame, ...rect }))
  } else {
    const { sources } = layout
    const sourceWidth = (sources.width - sources.gap * 6) / 7
    sourceRects = Array.from({ length: 7 }, (_, index) => Object.freeze({
      x: sources.x + index * (sourceWidth + sources.gap),
      y: sources.y,
      width: sourceWidth,
      height: sources.height,
      innerX: sources.innerX,
      innerY: sources.innerY,
      innerBottom: sources.innerBottom,
      accentHeight: sources.accentHeight,
    }))
  }
  const immutableSourceRects = Object.freeze(sourceRects)
  sourceRectsCache.set(layout, immutableSourceRects)
  return immutableSourceRects
}

const layoutGeometryCache = new WeakMap()

function cardRectStyle(rect, layoutWidth) {
  const toCqw = (value) => `${Number((value / layoutWidth * 100).toFixed(6))}cqw`
  return Object.freeze({
    left: toCqw(rect.x),
    top: toCqw(rect.y),
    width: toCqw(rect.width),
    height: toCqw(rect.height),
  })
}

function thumbnailRectStyle(rect, layout) {
  const toPercent = (value, total) => `${Number((value / total * 100).toFixed(6))}%`
  return Object.freeze({
    left: toPercent(rect.x, layout.width),
    top: toPercent(rect.y, layout.height),
    width: toPercent(rect.width, layout.width),
    height: toPercent(rect.height, layout.height),
  })
}

export function getPolaroidLayoutGeometry(layoutOrId = DEFAULT_LAYOUT_ID) {
  const layout = typeof layoutOrId === 'object' && layoutOrId ? layoutOrId : getPolaroidLayout(layoutOrId)
  const cached = layoutGeometryCache.get(layout)
  if (cached) return cached

  const sourceRects = getPolaroidSourceRects(layout)
  const sources = sourceRects.map((rect) => {
    const imageRect = Object.freeze({
      x: rect.x + rect.innerX,
      y: rect.y + rect.innerY,
      width: rect.width - rect.innerX * 2,
      height: rect.height - rect.innerY - rect.innerBottom,
    })
    const accentRect = Object.freeze({
      x: rect.x,
      y: rect.y + rect.height - rect.accentHeight,
      width: rect.width,
      height: rect.accentHeight,
    })
    return Object.freeze({
      rect,
      imageRect,
      accentRect,
      cardStyle: cardRectStyle(rect, layout.width),
      imageCardStyle: cardRectStyle({ x: rect.innerX, y: rect.innerY, width: imageRect.width, height: imageRect.height }, layout.width),
      accentCardStyle: cardRectStyle({ x: 0, y: rect.height - rect.accentHeight, width: rect.width, height: rect.accentHeight }, layout.width),
      thumbnailStyle: thumbnailRectStyle(rect, layout),
    })
  })
  const toCqw = (value) => `${Number((value / layout.width * 100).toFixed(6))}cqw`
  const captionCardStyle = Object.freeze({
    ...cardRectStyle(layout.caption, layout.width),
    alignItems: layout.caption.verticalAlign === 'top' ? 'flex-start' : 'center',
    '--polaroid-caption-size': toCqw(layout.caption.fontSize),
    '--polaroid-caption-line-height': String(layout.caption.lineHeight / layout.caption.fontSize),
  })
  const dateCardStyle = Object.freeze({
    ...cardRectStyle(layout.date, layout.width),
    '--polaroid-date-size': toCqw(layout.date.fontSize),
  })
  const geometry = Object.freeze({
    layout,
    photo: layout.photo,
    sourceRects,
    sources: Object.freeze(sources),
    mediaStyle: Object.freeze({ height: `${Number((layout.mediaHeight / layout.width * 100).toFixed(6))}cqw` }),
    photoCardStyle: cardRectStyle(layout.photo, layout.width),
    captionCardStyle,
    dateCardStyle,
    photoThumbnailStyle: thumbnailRectStyle(layout.photo, layout),
    captionThumbnailStyle: thumbnailRectStyle(layout.caption, layout),
  })
  layoutGeometryCache.set(layout, geometry)
  return geometry
}

const PAPER_STOPS = Object.freeze([
  Object.freeze({ offset: 0, colorKey: 'top' }),
  Object.freeze({ offset: 0.58, colorKey: 'middle' }),
  Object.freeze({ offset: 1, colorKey: 'bottom' }),
])

const renderModelCache = new Map()

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderArtworkShape(shape, accent) {
  const fill = shape.fill === 'none' ? 'none' : (shape.fill ?? accent)
  const stroke = shape.stroke === 'accent' ? accent : shape.stroke
  const paint = [
    `fill="${escapeAttribute(fill)}"`,
    stroke ? `stroke="${escapeAttribute(stroke)}"` : '',
    stroke && shape.strokeWidth ? `stroke-width="${shape.strokeWidth}"` : '',
    'vector-effect="none"',
    stroke && shape.strokeLinecap ? `stroke-linecap="${escapeAttribute(shape.strokeLinecap)}"` : '',
    stroke && shape.strokeLinejoin ? `stroke-linejoin="${escapeAttribute(shape.strokeLinejoin)}"` : '',
    `opacity="${shape.opacity ?? 1}"`,
  ].filter(Boolean).join(' ')
  if (shape.type === 'circle') {
    return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.radius}" ${paint}/>`
  }
  if (shape.type === 'ellipse') {
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.radiusX}" ry="${shape.radiusY}" transform="rotate(${shape.rotation ?? 0} ${shape.cx} ${shape.cy})" ${paint}/>`
  }
  if (shape.type === 'rect') {
    const x = shape.cx - shape.width / 2
    const y = shape.cy - shape.height / 2
    return `<rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" transform="rotate(${shape.rotation ?? 0} ${shape.cx} ${shape.cy})" ${paint}/>`
  }
  if (shape.type === 'path') {
    return `<path d="${escapeAttribute(shape.d)}" ${paint}/>`
  }
  return ''
}

export function createFilmSurfaceSvg(filmId) {
  const film = getFilm(filmId)
  const stops = PAPER_STOPS.map(({ offset, colorKey }) => `<stop offset="${offset * 100}%" stop-color="${escapeAttribute(film.paper[colorKey])}"/>`).join('')
  const artwork = film.artwork.filter((shape) => shape.layer !== 'foreground').map((shape) => renderArtworkShape(shape, film.paper.accent)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${POLAROID_LAYOUT.width} ${POLAROID_LAYOUT.height}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="paper" x1="0" y1="0" x2="${POLAROID_LAYOUT.width}" y2="${POLAROID_LAYOUT.height}" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs><rect width="${POLAROID_LAYOUT.width}" height="${POLAROID_LAYOUT.height}" fill="url(#paper)"/>${artwork}</svg>`
}

export function createFilmOverlaySvg(filmId, layoutId = DEFAULT_LAYOUT_ID) {
  const film = getFilm(filmId)
  const artwork = film.artwork.filter((shape) => shape.layer === 'foreground').map((shape) => renderArtworkShape(shape, film.paper.accent)).join('')
  if (!artwork) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${POLAROID_LAYOUT.width} ${POLAROID_LAYOUT.height}" preserveAspectRatio="xMidYMid meet"></svg>`
  const { x, y, width, height } = getPolaroidLayout(getFilmLayoutId(film, layoutId)).photo
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${POLAROID_LAYOUT.width} ${POLAROID_LAYOUT.height}" preserveAspectRatio="xMidYMid meet"><defs><mask id="frame-only" maskUnits="userSpaceOnUse" x="0" y="0" width="${POLAROID_LAYOUT.width}" height="${POLAROID_LAYOUT.height}"><rect width="${POLAROID_LAYOUT.width}" height="${POLAROID_LAYOUT.height}" fill="white"/><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="black"/></mask></defs><g mask="url(#frame-only)">${artwork}</g></svg>`
}

export function scopeFilmRenderSvg(svg, scope) {
  const suffix = String(scope).replace(/[^a-zA-Z0-9_-]/g, '') || 'film'
  return svg
    .replaceAll('id="paper"', `id="paper-${suffix}"`)
    .replaceAll('#paper', `#paper-${suffix}`)
    .replaceAll('id="frame-only"', `id="frame-only-${suffix}"`)
    .replaceAll('#frame-only', `#frame-only-${suffix}`)
}

export function getFilmRenderModel(filmId, layoutId = DEFAULT_LAYOUT_ID) {
  const film = getFilm(filmId)
  const layout = getPolaroidLayout(getFilmLayoutId(film, layoutId))
  const cacheKey = `${film.id}:${layout.id}`
  const cached = renderModelCache.get(cacheKey)
  if (cached) return cached

  const svg = createFilmSurfaceSvg(film.id)
  const overlaySvg = createFilmOverlaySvg(film.id, layout.id)
  const geometry = getPolaroidLayoutGeometry(layout)
  const model = Object.freeze({
    film,
    layout,
    geometry,
    svg,
    overlaySvg,
    surfaceUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    overlayUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(overlaySvg)}`,
  })
  renderModelCache.set(cacheKey, model)
  return model
}

const layoutStyleCache = new WeakMap()

export function getPolaroidLayoutStyle(layoutId = DEFAULT_LAYOUT_ID) {
  const layout = getPolaroidLayout(layoutId)
  const cached = layoutStyleCache.get(layout)
  if (cached) return cached
  const { width, photo, footer } = layout
  const toCqw = (value) => `${Number((value / width * 100).toFixed(4))}cqw`
  const style = {
    '--polaroid-photo-x': toCqw(photo.x),
    '--polaroid-photo-y': toCqw(photo.y),
    '--polaroid-photo-aspect': `${photo.width} / ${photo.height}`,
    '--polaroid-footer-x': `${footer.x / width * 100}%`,
  }
  if (layout.sources) {
    Object.assign(style, {
      '--polaroid-source-x': toCqw(layout.sources.x),
      '--polaroid-source-y': toCqw(layout.sources.y - photo.y - photo.height),
      '--polaroid-source-height': toCqw(layout.sources.height),
      '--polaroid-source-gap': toCqw(layout.sources.gap),
      '--polaroid-source-padding': toCqw(layout.sources.innerX),
      '--polaroid-source-accent': toCqw(layout.sources.accentHeight),
    })
  }
  const immutableStyle = Object.freeze(style)
  layoutStyleCache.set(layout, immutableStyle)
  return immutableStyle
}
