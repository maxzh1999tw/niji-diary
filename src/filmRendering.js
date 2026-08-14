import { getFilm } from './films.js'

export const POLAROID_LAYOUT = Object.freeze({
  width: 1000,
  height: 1500,
  photo: Object.freeze({ x: 35, y: 35, width: 930, height: 1162.5 }),
  sources: Object.freeze({ x: 42, y: 1221.5, width: 916, height: 115, gap: 11.5, innerX: 7, innerY: 7, innerBottom: 22, accentHeight: 8 }),
  footer: Object.freeze({ x: 50, textY: 1418, dateWidth: 220 }),
})

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
  const common = `fill="${escapeAttribute(accent)}" opacity="${shape.opacity ?? 1}"`
  if (shape.type === 'circle') {
    return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.radius}" ${common}/>`
  }
  if (shape.type === 'ellipse') {
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.radiusX}" ry="${shape.radiusY}" transform="rotate(${shape.rotation ?? 0} ${shape.cx} ${shape.cy})" ${common}/>`
  }
  if (shape.type === 'rect') {
    const x = shape.cx - shape.width / 2
    const y = shape.cy - shape.height / 2
    return `<rect x="${x}" y="${y}" width="${shape.width}" height="${shape.height}" transform="rotate(${shape.rotation ?? 0} ${shape.cx} ${shape.cy})" ${common}/>`
  }
  return ''
}

export function createFilmSurfaceSvg(filmId) {
  const film = getFilm(filmId)
  const stops = PAPER_STOPS.map(({ offset, colorKey }) => `<stop offset="${offset * 100}%" stop-color="${escapeAttribute(film.paper[colorKey])}"/>`).join('')
  const artwork = film.artwork.map((shape) => renderArtworkShape(shape, film.paper.accent)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${POLAROID_LAYOUT.width} ${POLAROID_LAYOUT.height}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="paper" x1="0" y1="0" x2="${POLAROID_LAYOUT.width}" y2="${POLAROID_LAYOUT.height}" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs><rect width="${POLAROID_LAYOUT.width}" height="${POLAROID_LAYOUT.height}" fill="url(#paper)"/>${artwork}</svg>`
}

export function getFilmRenderModel(filmId) {
  const film = getFilm(filmId)
  const cached = renderModelCache.get(film.id)
  if (cached) return cached

  const svg = createFilmSurfaceSvg(film.id)
  const model = Object.freeze({
    film,
    layout: POLAROID_LAYOUT,
    svg,
    surfaceUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
  })
  renderModelCache.set(film.id, model)
  return model
}

export function getPolaroidLayoutStyle() {
  const { width, photo, sources, footer } = POLAROID_LAYOUT
  const toCqw = (value) => `${Number((value / width * 100).toFixed(4))}cqw`
  return {
    '--polaroid-photo-x': toCqw(photo.x),
    '--polaroid-photo-y': toCqw(photo.y),
    '--polaroid-photo-aspect': `${photo.width} / ${photo.height}`,
    '--polaroid-source-x': toCqw(sources.x),
    '--polaroid-source-y': toCqw(sources.y - photo.y - photo.height),
    '--polaroid-source-height': toCqw(sources.height),
    '--polaroid-source-gap': toCqw(sources.gap),
    '--polaroid-source-padding': toCqw(sources.innerX),
    '--polaroid-source-accent': toCqw(sources.accentHeight),
    '--polaroid-footer-x': `${footer.x / width * 100}%`,
  }
}
