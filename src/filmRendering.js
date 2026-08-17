import { DEFAULT_LAYOUT_ID, getFilm, getFilmLayoutId, MOSAIC_LAYOUT_ID } from './films.js'

export const POLAROID_LAYOUT = Object.freeze({
  id: DEFAULT_LAYOUT_ID,
  width: 1000,
  height: 1500,
  photo: Object.freeze({ x: 35, y: 35, width: 930, height: 1162.5 }),
  sources: Object.freeze({ x: 42, y: 1221.5, width: 916, height: 115, gap: 11.5, innerX: 7, innerY: 7, innerBottom: 22, accentHeight: 8 }),
  footer: Object.freeze({ x: 50, textY: 1418, dateWidth: 220 }),
})

export const MOSAIC_POLAROID_LAYOUT = Object.freeze({
  id: MOSAIC_LAYOUT_ID,
  width: 1000,
  height: 1500,
  photo: Object.freeze({ x: 325.25, y: 516.5625, width: 349.5, height: 436.875 }),
  sourceRects: Object.freeze([
    Object.freeze({ x: 42, y: 35, width: 285.3333, height: 220 }),
    Object.freeze({ x: 357.3333, y: 35, width: 285.3334, height: 220 }),
    Object.freeze({ x: 672.6667, y: 35, width: 285.3333, height: 220 }),
    Object.freeze({ x: 42, y: 295, width: 253.25, height: 420 }),
    Object.freeze({ x: 42, y: 755, width: 253.25, height: 420 }),
    Object.freeze({ x: 704.75, y: 295, width: 253.25, height: 420 }),
    Object.freeze({ x: 704.75, y: 755, width: 253.25, height: 420 }),
  ]),
  sourceFrame: Object.freeze({ innerX: 7, innerY: 7, innerBottom: 22, accentHeight: 8 }),
  footer: Object.freeze({ x: 50, textY: 1418, dateWidth: 220 }),
})

export const POLAROID_LAYOUTS = Object.freeze({
  [DEFAULT_LAYOUT_ID]: POLAROID_LAYOUT,
  [MOSAIC_LAYOUT_ID]: MOSAIC_POLAROID_LAYOUT,
})

export function getPolaroidLayout(layoutId) {
  return POLAROID_LAYOUTS[layoutId] ?? POLAROID_LAYOUT
}

export function getPolaroidSourceRects(layoutOrId = DEFAULT_LAYOUT_ID) {
  const layout = typeof layoutOrId === 'object' && layoutOrId ? layoutOrId : getPolaroidLayout(layoutOrId)
  if (Array.isArray(layout.sourceRects)) {
    const frame = layout.sourceFrame
    return layout.sourceRects.map((rect) => ({ ...frame, ...rect }))
  }
  const { sources } = layout
  const sourceWidth = (sources.width - sources.gap * 6) / 7
  return Array.from({ length: 7 }, (_, index) => ({
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
  const model = Object.freeze({
    film,
    layout,
    svg,
    overlaySvg,
    surfaceUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    overlayUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(overlaySvg)}`,
  })
  renderModelCache.set(cacheKey, model)
  return model
}

export function getPolaroidLayoutStyle(layoutId = DEFAULT_LAYOUT_ID) {
  const layout = getPolaroidLayout(layoutId)
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
  return style
}
