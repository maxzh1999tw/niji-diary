import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { analyzePixel, COLOR_KEYS } from './colorAnalysis.js'
import { DEFAULT_FILM_ID, FILMS, getFilm, getFilmProgress, getFilmProgressChanges, normalizeFilmCollection } from './films.js'
import { getFilmRenderModel, getPolaroidLayoutStyle } from './filmRendering.js'
import { formatText, translations } from './i18n.js'
import { INFO_PAGE_KEYS, TAB_KEYS, infoHash, parseAppHash } from './appRoutes.js'
import { INFO_PAGE_META, infoContent } from './infoContent.js'
import { applyPanDelta, applyPinchDelta } from './gestureTransform.js'
import { importStorageSnapshot, LEGACY_IMPORT_OFFER, LEGACY_IMPORT_READY, LEGACY_IMPORT_RESPONSE, LEGACY_ORIGIN, NEW_APP_ORIGIN, sendLegacyStorageToNewSite } from './migration.js'
import { COMPLETED_DAY_SCHEMA_VERSION, completeDraft, createCompletedDayRecord, deleteDay, loadCollectionState, migrateCompletedDay, requestPersistentStorage, saveDay, saveDraft, saveFilmCollection } from './storage.js'

const LANGUAGE_LABELS = { 'zh-Hant': '繁體中文', en: 'English', ja: '日本語' }
const FALLBACK_COLORS = { red: '#ff527b', orange: '#ff9d3d', yellow: '#f4d629', green: '#42d67a', blue: '#25a9f0', indigo: '#655ee8', violet: '#b34ee5' }
const COMPLETED_COLOR_SLOTS = Object.freeze(Object.fromEntries(COLOR_KEYS.map((key) => [key, true])))
const FILM_PREVIEW_DATE = '2000-01-01'
const FILM_PREVIEW_PHOTOS = {}
const PENDING_FILM_SELECTION_KEY = 'niji-pending-film-selection'
const DEV_QUERY = import.meta.env.DEV ? new URLSearchParams(location.search) : null
const QA_MODE = DEV_QUERY?.get('qa') ?? null
const QA_FILM_ID = DEV_QUERY?.get('film') ?? null
const FILM_DATABASE_ORDER = new Map(FILMS.map((film, index) => [film.id, index]))
const QA_SAMPLE = QA_MODE === 'sample' ? { image: './rainbow.svg', suggestedKey: 'green', sampleColor: 'rgb(66, 214, 122)', confidence: 82, samplePoint: { x: 0.5, y: 0.5 } } : null

function Icon({ name, size = 24 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'camera') return <svg {...common}><path d="M14.5 5 13 3H7L5.5 5H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-6.5Z" /><circle cx="10" cy="12" r="4" /></svg>
  if (name === 'upload') return <svg {...common}><path d="M12 16V3" /><path d="m7 8 5-5 5 5" /><path d="M5 13H3v8h18v-8h-2" /></svg>
  if (name === 'opacity') return <svg {...common}><path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z" /><path d="M8.5 15.5a3.5 3.5 0 0 0 7 0" /></svg>
  if (name === 'radius') return <svg {...common}><path d="M4 18A10 10 0 0 1 20 18" /><path d="M12 18V8" /><path d="m9 11 3-3 3 3" /></svg>
  if (name === 'width') return <svg {...common}><path d="M4 8h16" /><path d="M4 16h16" /><path d="M8 5v6" /><path d="M16 13v6" /></svg>
  if (name === 'angle') return <svg {...common}><path d="M5 19 12 5l7 14" /><path d="M8.5 12a7 7 0 0 0 7 0" /></svg>
  if (name === 'download') return <svg {...common}><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></svg>
  if (name === 'share') return <svg {...common}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4" /><path d="m8.7 13.3 6.6 4.4" /></svg>
  if (name === 'edit') return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
  if (name === 'book') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
  if (name === 'film') return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" /></svg>
  if (name === 'gear') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.08V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.51-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.51 1H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>
  if (name === 'sparkle') return <svg {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>
  if (name === 'back') return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
  if (name === 'reset') return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
  if (name === 'lock') return <svg {...common}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
  if (name === 'trash') return <svg {...common}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
  if (name === 'info') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></svg>
  if (name === 'help') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.8.4-1.3 1-1.3 1.9" /><path d="M12 17h.01" /></svg>
  if (name === 'shield') return <svg {...common}><path d="M12 3 4.5 6v5.5c0 4.7 3.2 8 7.5 9.5 4.3-1.5 7.5-4.8 7.5-9.5V6Z" /><path d="m9 12 2 2 4-4" /></svg>
  if (name === 'document') return <svg {...common}><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></svg>
  if (name === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
  if (name === 'cookie') return <svg {...common}><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a4 4 0 0 0 4.7 4.7 4 4 0 0 0 5 5Z" /><circle cx="8.5" cy="9" r=".7" fill="currentColor" stroke="none" /><circle cx="9.5" cy="15" r=".7" fill="currentColor" stroke="none" /><circle cx="15" cy="16" r=".7" fill="currentColor" stroke="none" /></svg>
  if (name === 'external') return <svg {...common}><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></svg>
  if (name === 'chevron') return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>
}

function BootSplash({ label }) {
  return <div className="boot-splash" role="status" aria-live="polite" aria-label={label}>
    <img className="boot-splash-logo" src="./logo.svg" alt="" aria-hidden="true" />
    <span className="boot-splash-label">{label}</span>
  </div>
}

function localDateKey() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function createEmptyDraft() {
  return { schemaVersion: 3, photos: {}, samples: {}, completedAt: null }
}

function withoutFilmCollectionMeta(collection) {
  const { needsSave, ...persisted } = collection
  return persisted
}

function createDefaultFilmCollection() {
  const collection = withoutFilmCollectionMeta(normalizeFilmCollection(null))
  if (!QA_MODE || !FILMS.some((film) => film.id === QA_FILM_ID)) return collection
  return { ...collection, unlockedFilmIds: FILMS.map((film) => film.id), selectedFilmId: QA_FILM_ID }
}

function createQaFilmNotifications() {
  if (QA_MODE !== 'film-notification') return []
  const film = getFilm(FILMS.some((item) => item.id === QA_FILM_ID && item.unlock.type !== 'always') ? QA_FILM_ID : 'pink-pop')
  const unlocked = DEV_QUERY?.get('unlocked') === '1'
  const current = unlocked ? film.unlock.target : Math.max(1, film.unlock.target - 1)
  return [{ id: `qa-${film.id}-${unlocked ? 'unlocked' : 'progress'}`, filmId: film.id, previous: Math.max(0, current - 1), current, target: film.unlock.target, unlocked }]
}

function readPendingFilmSelection() {
  try {
    const filmId = localStorage.getItem(PENDING_FILM_SELECTION_KEY)
    return FILMS.some((film) => film.id === filmId) ? filmId : null
  } catch {
    return null
  }
}

function rememberPendingFilmSelection(filmId) {
  try { localStorage.setItem(PENDING_FILM_SELECTION_KEY, filmId) } catch { /* best effort fallback for interrupted IndexedDB writes */ }
}

function clearPendingFilmSelection(filmId) {
  try {
    if (localStorage.getItem(PENDING_FILM_SELECTION_KEY) === filmId) localStorage.removeItem(PENDING_FILM_SELECTION_KEY)
  } catch { /* ignore storage cleanup failures */ }
}

function formatDate(date, lang, compact = false) {
  if (compact && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date.replaceAll('-', '/')
  const locale = lang === 'zh-Hant' ? 'zh-TW' : lang
  return new Intl.DateTimeFormat(locale, compact ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function resetAppViewport(focusMain = false) {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    const environment = document.querySelector('.app-environment')
    if (environment) environment.scrollTop = 0
    const screen = document.querySelector('.app-content > section')
    if (screen) screen.scrollTop = 0
    if (focusMain) document.querySelector('#app-content')?.focus({ preventScroll: true })
  })
}

async function processPhoto(file) {
  const image = await decodePhoto(file)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d', { alpha: false })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const analysis = sampleSourcePhoto(image, { x: 0.5, y: 0.5 })
  image.close?.()
  return { image: canvas.toDataURL('image/jpeg', 0.84), ...analysis }
}

async function decodePhoto(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Unable to decode photo'))
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image'))
    image.src = source
  })
}

function dataUrlToFile(dataUrl, filename) {
  if (!dataUrl?.startsWith('data:')) return null
  const [header, encoded] = dataUrl.split(',')
  const type = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], filename, { type })
}

function drawCover(context, image, width, height) {
  const imageRatio = image.width / image.height
  const targetRatio = width / height
  let sourceX = 0, sourceY = 0, sourceWidth = image.width, sourceHeight = image.height
  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio
    sourceX = (image.width - sourceWidth) / 2
  } else {
    sourceHeight = image.width / targetRatio
    sourceY = (image.height - sourceHeight) / 2
  }
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
}

function drawCoverAt(context, image, x, y, width, height) {
  context.save()
  context.translate(x, y)
  drawCover(context, image, width, height)
  context.restore()
}

function fitCanvasText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length && context.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1)
  return `${fitted}…`
}

function drawPolaroidCaption(context, day, fallbackCaption, layout) {
  const { width, footer } = layout
  const caption = day.caption ?? fallbackCaption
  context.textBaseline = 'middle'
  context.fillStyle = '#241435'
  context.font = '600 45px "Noto Sans TC", "Segoe UI", sans-serif'
  context.fillText(fitCanvasText(context, caption, width - footer.x * 2 - footer.dateWidth), footer.x, footer.textY)
}

function drawPolaroidDate(context, day, lang, layout) {
  const { width, footer } = layout
  context.textBaseline = 'middle'
  context.fillStyle = '#625c63'
  context.font = '600 34px "Noto Sans TC", "Segoe UI", sans-serif'
  context.textAlign = 'right'
  context.fillText(formatDate(day.date, lang, true), width - footer.x, footer.textY)
  context.textAlign = 'left'
}

async function renderPolaroidImage(day, lang, fallbackCaption, includeCaption = true) {
  if (!day?.cardImage) throw new Error('Missing Rainbow Card image')
  await document.fonts?.ready
  const renderModel = getFilmRenderModel(day.filmId)
  const { width, height, photo, sources, footer } = renderModel.layout
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  const [filmSurface, filmOverlay] = await Promise.all([
    loadImageSource(renderModel.surfaceUrl),
    loadImageSource(renderModel.overlayUrl),
  ])
  context.drawImage(filmSurface, 0, 0, width, height)

  const mainImage = await loadImageSource(day.cardImage)
  context.fillStyle = '#e8e1ec'
  context.fillRect(photo.x, photo.y, photo.width, photo.height)
  drawCoverAt(context, mainImage, photo.x, photo.y, photo.width, photo.height)
  context.strokeStyle = 'rgba(18,13,21,.1)'
  context.lineWidth = 2
  context.strokeRect(photo.x, photo.y, photo.width, photo.height)

  const sourceWidth = (sources.width - sources.gap * 6) / 7
  const sourceImages = await Promise.all(COLOR_KEYS.map(async (key) => {
    if (!day.photos?.[key]) return null
    try { return await loadImageSource(day.photos[key]) } catch { return null }
  }))

  COLOR_KEYS.forEach((key, index) => {
    const x = sources.x + index * (sourceWidth + sources.gap)
    context.fillStyle = '#fffefa'
    context.fillRect(x, sources.y, sourceWidth, sources.height)
    context.strokeStyle = 'rgba(69,60,67,.2)'
    context.lineWidth = 1.5
    context.strokeRect(x, sources.y, sourceWidth, sources.height)
    const innerX = x + sources.innerX
    const innerY = sources.y + sources.innerY
    const innerWidth = sourceWidth - sources.innerX * 2
    const innerHeight = sources.height - sources.innerBottom
    context.fillStyle = day.samples?.[key] || FALLBACK_COLORS[key]
    context.fillRect(innerX, innerY, innerWidth, innerHeight)
    if (sourceImages[index]) drawCoverAt(context, sourceImages[index], innerX, innerY, innerWidth, innerHeight)
    context.fillStyle = day.samples?.[key] || FALLBACK_COLORS[key]
    context.fillRect(x, sources.y + sources.height - sources.accentHeight, sourceWidth, sources.accentHeight)
  })

  // Keep the canvas layer order identical to PolaroidCard: paper, photo/sources,
  // edge decorations, then footer text.
  context.drawImage(filmOverlay, 0, 0, width, height)
  if (includeCaption) drawPolaroidCaption(context, day, fallbackCaption, renderModel.layout)
  drawPolaroidDate(context, day, lang, renderModel.layout)
  return canvas.toDataURL('image/jpeg', 0.9)
}

async function renderCaptionlessPolaroid(day, lang, fallbackCaption) {
  if (day?.cardImage) return renderPolaroidImage(day, lang, fallbackCaption, false)
  if (!day?.polaroidImage) throw new Error('Missing completed Polaroid image')

  const renderModel = getFilmRenderModel(day.filmId)
  const { width, height, footer } = renderModel.layout
  const [storedImage, filmSurface] = await Promise.all([
    loadImageSource(day.polaroidImage),
    loadImageSource(renderModel.surfaceUrl),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  context.drawImage(storedImage, 0, 0, width, height)

  const clearY = footer.textY - 70
  const clearWidth = width - footer.x * 2 - footer.dateWidth + footer.x
  context.drawImage(filmSurface, 0, clearY, clearWidth, height - clearY, 0, clearY, clearWidth, height - clearY)
  return canvas.toDataURL('image/jpeg', 0.9)
}

async function compactCompletedHistory(completedDays, lang, fallbackCaption) {
  const compactedDays = []
  for (const completedDay of completedDays) {
    compactedDays.push(await migrateCompletedDay(
      completedDay,
      (record) => renderCaptionlessPolaroid(record, lang, fallbackCaption),
    ))
  }
  return compactedDays
}

async function hydrateCollectionState(date, lang) {
  const { completedDays, dailyLocked: savedDailyLock, draft, filmCollection: savedFilmCollection } = await loadCollectionState(date)
  const compactedDays = await compactCompletedHistory(completedDays, lang, translations[lang].defaultCaption)
  const completedToday = compactedDays.find((item) => item.date === date) ?? null
  const savedDay = completedToday ?? draft
  const hydratedFilmCollection = withoutFilmCollectionMeta(savedFilmCollection ?? normalizeFilmCollection(null, compactedDays))
  const pendingFilmId = readPendingFilmSelection()
  const recoveredFilmCollection = pendingFilmId && hydratedFilmCollection.unlockedFilmIds.includes(pendingFilmId)
    ? withoutFilmCollectionMeta(normalizeFilmCollection({ ...hydratedFilmCollection, selectedFilmId: pendingFilmId }, compactedDays))
    : hydratedFilmCollection

  if (pendingFilmId) {
    if (recoveredFilmCollection.selectedFilmId === pendingFilmId) {
      saveFilmCollection(recoveredFilmCollection).then(() => clearPendingFilmSelection(pendingFilmId)).catch(() => {})
    } else {
      clearPendingFilmSelection(pendingFilmId)
    }
  }

  return {
    day: savedDay ? { ...savedDay, samples: savedDay.samples ?? {} } : createEmptyDraft(),
    dailyLocked: savedDailyLock,
    history: compactedDays,
    filmCollection: recoveredFilmCollection,
  }
}

async function getCompletedPolaroidImage(day, lang, fallbackCaption) {
  if (!day?.polaroidImage) return renderPolaroidImage(day, lang, fallbackCaption)

  await document.fonts?.ready
  const renderModel = getFilmRenderModel(day.filmId)
  const { width, height } = renderModel.layout
  const baseImage = day.schemaVersion === COMPLETED_DAY_SCHEMA_VERSION
    ? day.polaroidImage
    : await renderCaptionlessPolaroid(day, lang, fallbackCaption)
  const image = await loadImageSource(baseImage)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  context.drawImage(image, 0, 0, width, height)
  drawPolaroidCaption(context, day, fallbackCaption, renderModel.layout)
  return canvas.toDataURL('image/jpeg', 0.9)
}

function sampleSourcePhoto(image, point) {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const x = Math.max(0, Math.min(sourceWidth - 1, Math.round(point.x * (sourceWidth - 1))))
  const y = Math.max(0, Math.min(sourceHeight - 1, Math.round(point.y * (sourceHeight - 1))))
  const canvas = document.createElement('canvas')
  canvas.width = 1; canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = false
  context.drawImage(image, x, y, 1, 1, 0, 0, 1, 1)
  const analysis = analyzePixel(context.getImageData(0, 0, 1, 1).data, 1, 1, { x: 0, y: 0 })
  return { ...analysis, samplePoint: point, pixel: { x, y } }
}

async function renderComposite(background, samples, transform) {
  const image = await loadImageSource(background)
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1500
  const context = canvas.getContext('2d', { alpha: false })
  drawCover(context, image, canvas.width, canvas.height)
  const centerX = canvas.width * transform.x / 100
  const centerY = canvas.height * transform.y / 100
  const baseRadius = canvas.width * 0.32 * transform.scale
  const outerRadius = baseRadius * (transform.radius ?? 1)
  const colorWidth = baseRadius * 0.075 * (transform.colorWidth ?? 1)
  const innerRadius = Math.max(2, outerRadius - colorWidth * COLOR_KEYS.length)
  const angle = Math.max(10, Math.min(180, transform.angle ?? 180))
  const angleRadians = angle * Math.PI / 180
  const startAngle = -Math.PI / 2 - angleRadians / 2
  const endAngle = -Math.PI / 2 + angleRadians / 2
  const halfChord = Math.max(1, outerRadius * Math.sin(angleRadians / 2))
  const transparency = transform.transparency ?? (transform.opacity == null ? 0 : 1 - transform.opacity)
  const visibleOpacity = 1 - transparency
  const rainbowLayer = document.createElement('canvas')
  rainbowLayer.width = canvas.width; rainbowLayer.height = canvas.height
  const light = rainbowLayer.getContext('2d')

  const makeSpectrum = () => {
    const gradient = light.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius)
    const reversedColorKeys = [...COLOR_KEYS].reverse()
    gradient.addColorStop(0, samples.violet || FALLBACK_COLORS.violet)
    reversedColorKeys.forEach((key, index) => gradient.addColorStop((index + 0.5) / COLOR_KEYS.length, samples[key] || FALLBACK_COLORS[key]))
    gradient.addColorStop(1, samples.red || FALLBACK_COLORS.red)
    return gradient
  }

  const drawSpectrum = (alpha, blur) => {
    light.globalAlpha = alpha
    light.filter = `blur(${blur}px) saturate(165%) brightness(118%)`
    light.fillStyle = makeSpectrum()
    light.beginPath()
    light.arc(0, 0, outerRadius, startAngle, endAngle)
    light.arc(0, 0, innerRadius, endAngle, startAngle, true)
    light.closePath()
    light.fill()
  }

  light.save()
  light.translate(centerX, centerY)
  light.rotate(transform.rotation * Math.PI / 180)
  light.globalCompositeOperation = 'screen'
  drawSpectrum(0.34, colorWidth * COLOR_KEYS.length * 0.18)
  drawSpectrum(1, colorWidth * 0.08)
  light.filter = 'none'
  light.globalAlpha = 1
  light.globalCompositeOperation = 'destination-in'
  const endFade = light.createLinearGradient(-halfChord, 0, halfChord, 0)
  endFade.addColorStop(0, 'rgba(255,255,255,0)')
  endFade.addColorStop(0.1, 'white')
  endFade.addColorStop(0.9, 'white')
  endFade.addColorStop(1, 'rgba(255,255,255,0)')
  light.fillStyle = endFade
  light.fillRect(-outerRadius * 1.15, -outerRadius * 1.15, outerRadius * 2.3, outerRadius * 1.3)
  light.restore()

  context.save()
  context.globalAlpha = visibleOpacity
  context.globalCompositeOperation = 'source-over'
  context.drawImage(rainbowLayer, 0, 0)
  context.restore()
  return canvas.toDataURL('image/jpeg', 0.88)
}

function EnergyStrip({ photos, samples = {}, labels, interactive = false, onSelect }) {
  return (
    <div className="rainbow-strip energy-strip" aria-label={interactive ? labels.join('、') : undefined}>
      {COLOR_KEYS.map((key, index) => {
        const style = photos[key] ? { background: samples[key] || FALLBACK_COLORS[key] } : undefined
        const content = photos[key] ? <><Icon name="check" size={18} /><small>{labels[index]}</small></> : <span>{index + 1}</span>
        return interactive
          ? <button type="button" key={key} style={style} className={`strip-${key}`} aria-label={labels[index]} onClick={() => onSelect(key)}>{content}</button>
          : <div key={key} style={style} className={`strip-${key}`}>{content}</div>
      })}
    </div>
  )
}

function PolaroidSourceStrip({ photos = {}, samples = {}, labels, imageLoading = 'lazy' }) {
  return <div className="polaroid-sources" aria-label={labels.join('、')}>{COLOR_KEYS.map((key, index) => (
    <div className="polaroid-source-photo" key={key} style={{ '--sample': samples[key] || FALLBACK_COLORS[key] }}>
      {photos[key] ? <img src={photos[key]} alt={labels[index]} loading={imageLoading} /> : <i aria-hidden="true" />}
    </div>
  ))}</div>
}

function FilmPhotoPlaceholder() {
  return <div className="film-photo-placeholder" aria-hidden="true" />
}

function FilmSurface({ filmId }) {
  const { surfaceUrl, overlayUrl } = getFilmRenderModel(filmId)
  return <><img className="film-surface-artwork" src={surfaceUrl} alt="" aria-hidden="true" draggable="false" /><img className="film-surface-overlay" src={overlayUrl} alt="" aria-hidden="true" draggable="false" /></>
}

function FilmPreviewCard({ filmId, lang, t, className = '' }) {
  return <PolaroidCard className={`film-preview-card ${className}`} media={<FilmPhotoPlaceholder />} photos={FILM_PREVIEW_PHOTOS} samples={FALLBACK_COLORS} labels={t.colors} date={FILM_PREVIEW_DATE} dateLabel={t.filmPreviewDate} lang={lang} filmId={filmId} decorative><PolaroidCaption placeholder /></PolaroidCard>
}

function FilmProgressBookmark({ notification, lang, t, offsetForNavigation, onDismiss }) {
  const noticeRef = useRef(null)
  const pointer = useRef(null)
  const autoDismissTimer = useRef(null)
  const exitTimer = useRef(null)
  const exiting = useRef(false)
  const suppressClick = useRef(false)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const film = getFilm(notification.filmId)
  const progressPercent = notification.target ? Math.min(100, notification.current / notification.target * 100) : 100
  const statusLabel = notification.unlocked ? t.filmNoticeUnlocked : t.filmNoticeProgress
  const announcement = formatText(notification.unlocked ? t.filmNoticeUnlockedAnnouncement : t.filmNoticeProgressAnnouncement, {
    name: t[film.nameKey],
    current: notification.current,
    target: notification.target,
  })

  function clearAutoDismiss() {
    window.clearTimeout(autoDismissTimer.current)
  }

  function scheduleAutoDismiss(delay = 5200) {
    clearAutoDismiss()
    if (!exiting.current) autoDismissTimer.current = window.setTimeout(beginDismiss, delay)
  }

  function beginDismiss() {
    if (exiting.current) return
    exiting.current = true
    clearAutoDismiss()
    const node = noticeRef.current
    node?.classList.remove('is-dragging', 'is-visible')
    node?.classList.add('is-exiting')
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 240
    exitTimer.current = window.setTimeout(() => onDismissRef.current(), delay)
  }

  useEffect(() => {
    exiting.current = false
    const node = noticeRef.current
    node?.classList.remove('is-visible', 'is-exiting')
    let visibleFrame = null
    const mountedFrame = window.requestAnimationFrame(() => {
      visibleFrame = window.requestAnimationFrame(() => {
        node?.classList.add('is-visible')
        scheduleAutoDismiss()
      })
    })
    return () => {
      window.cancelAnimationFrame(mountedFrame)
      if (visibleFrame !== null) window.cancelAnimationFrame(visibleFrame)
      window.clearTimeout(autoDismissTimer.current)
      window.clearTimeout(exitTimer.current)
    }
  }, [notification.id])

  function beginSwipe(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const node = noticeRef.current
    pointer.current = { id: event.pointerId, startX: event.clientX, dx: 0, moved: false }
    node?.setPointerCapture?.(event.pointerId)
    node?.classList.add('is-dragging')
    clearAutoDismiss()
  }

  function moveSwipe(event) {
    const gesture = pointer.current
    const node = noticeRef.current
    if (!gesture || gesture.id !== event.pointerId || !node) return
    const movement = event.clientX - gesture.startX
    gesture.dx = Math.max(0, movement)
    gesture.moved ||= Math.abs(movement) > 5
    node.style.setProperty('--bookmark-drag-x', `${gesture.dx}px`)
    node.style.setProperty('--bookmark-drag-opacity', String(Math.max(.32, 1 - gesture.dx / 260)))
  }

  function finishSwipe(event, cancelled = false) {
    const gesture = pointer.current
    const node = noticeRef.current
    if (!gesture || gesture.id !== event.pointerId || !node) return
    pointer.current = null
    if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId)
    node.classList.remove('is-dragging')
    const shouldDismiss = !cancelled && gesture.dx >= Math.min(84, node.offsetWidth * .22)
    if (shouldDismiss) {
      beginDismiss()
      return
    }
    suppressClick.current = gesture.moved
    window.setTimeout(() => { suppressClick.current = false }, 0)
    node.style.setProperty('--bookmark-drag-x', '0px')
    node.style.setProperty('--bookmark-drag-opacity', '1')
    scheduleAutoDismiss(3000)
  }

  function handleClick() {
    if (suppressClick.current) return
    beginDismiss()
  }

  return createPortal(<div className={`film-bookmark-layer ${offsetForNavigation ? 'above-navigation' : ''}`}>
    <span className="visually-hidden" role="status" aria-live="polite">{announcement}</span>
    <article ref={noticeRef} className={`film-bookmark-notice ${notification.unlocked ? 'is-unlocked' : 'is-progress'}`} onPointerDown={beginSwipe} onPointerMove={moveSwipe} onPointerUp={finishSwipe} onPointerCancel={(event) => finishSwipe(event, true)} onMouseEnter={clearAutoDismiss} onMouseLeave={() => scheduleAutoDismiss(3000)}>
      <button className="film-bookmark-dismiss" type="button" onClick={handleClick} onFocus={clearAutoDismiss} onBlur={() => scheduleAutoDismiss(3000)} onKeyDown={(event) => { if (['Escape', 'Enter', ' '].includes(event.key)) beginDismiss() }} aria-label={formatText(t.filmNoticeDismiss, { name: t[film.nameKey] })} />
      <FilmPreviewCard className="film-bookmark-preview" filmId={film.id} lang={lang} t={t} />
      <span className="film-bookmark-copy">
        <span className="film-bookmark-status"><Icon name={notification.unlocked ? 'sparkle' : 'film'} size={15} />{statusLabel}</span>
        <strong>{t[film.nameKey]}</strong>
        <span className="film-bookmark-condition"><b>{t.filmConditionLabel}</b>{t[film.conditionKey]}</span>
        <span className="film-bookmark-progress">{formatText(t.filmProgress, { current: notification.current, target: notification.target })}</span>
        <i className="film-bookmark-progress-track" aria-hidden="true"><em style={{ width: `${progressPercent}%` }} /></i>
      </span>
    </article>
  </div>, document.body)
}

function FilmPicker({ selectedFilmId, unlockedFilmIds, lang, t, onSelect }) {
  const selectedFilm = getFilm(selectedFilmId)
  const availableFilms = FILMS.filter((film) => unlockedFilmIds.includes(film.id))
  return <section className="film-picker" aria-labelledby="film-picker-title">
    <span className="visually-hidden" id="film-picker-hint">{t.filmPickerHint}</span>
    <div className="film-picker-heading">
      <div><span className="micro-label">FILM SELECT</span><strong id="film-picker-title">{t.filmPickerLabel}</strong></div>
      <span className="film-picker-current">{t[selectedFilm.nameKey]}</span>
    </div>
    <div className="film-picker-options" id="film-picker-options" role="group" aria-label={t.filmPickerLabel} aria-describedby="film-picker-hint">
      {availableFilms.map((film) => {
        const selected = selectedFilm.id === film.id
        return <button type="button" key={film.id} className={`film-option ${film.className} ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(film.id)}>
          <FilmPreviewCard filmId={film.id} lang={lang} t={t} />
          <strong className="film-option-name">{t[film.nameKey]}</strong>
          {selected ? <span className="film-option-check"><Icon name="check" size={14} /></span> : null}
        </button>
      })}
    </div>
  </section>
}

function PolaroidCard({ image, alt, media, overlay, photos, samples, labels, date, dateLabel, lang, filmId, className = '', photoClassName = '', imageLoading = 'lazy', decorative = false, children }) {
  const film = getFilm(filmId)
  return <div className={`polaroid-card ${film.className} ${className}`} style={{ ...getPolaroidLayoutStyle(), '--film-paper-fallback': film.paper.middle }} aria-hidden={decorative || undefined}><FilmSurface filmId={film.id} /><div className={`polaroid-photo ${photoClassName}`}>{image ? <img src={image} alt={alt} loading={imageLoading} /> : media}{overlay}</div><PolaroidSourceStrip photos={photos} samples={samples} labels={labels} imageLoading={imageLoading} /><div className="polaroid-footer"><div className="polaroid-caption-slot">{children}</div><time className="polaroid-date" dateTime={date}>{dateLabel ?? formatDate(date, lang, true)}</time></div></div>
}

function CompletedPolaroid({ item, alt, lang, t, className = '', imageLoading = 'lazy', editable = false, onCaptionChange, onCaptionCommit }) {
  if (item.polaroidImage) {
    const caption = item.caption ?? t.defaultCaption
    return <div className={`polaroid-card stored-polaroid ${className}`}>
      <img src={item.polaroidImage} alt={alt} loading={imageLoading} />
      {item.schemaVersion !== COMPLETED_DAY_SCHEMA_VERSION ? <div className="stored-polaroid-caption-repair"><FilmSurface filmId={item.filmId} /></div> : null}
      <div className="stored-polaroid-caption-slot">{editable ? <EditablePolaroidCaption value={caption} t={t} onChange={onCaptionChange} onCommit={onCaptionCommit} /> : <PolaroidCaption>{caption}</PolaroidCaption>}</div>
    </div>
  }
  const caption = item.caption ?? t.defaultCaption
  return <PolaroidCard className={className} image={item.cardImage} alt={alt} media={<EnergyStrip photos={item.photos} samples={item.samples} labels={t.colors} />} photos={item.photos} samples={item.samples} labels={t.colors} date={item.date} lang={lang} filmId={item.filmId}>{editable ? <EditablePolaroidCaption value={caption} t={t} onChange={onCaptionChange} onCommit={onCaptionCommit} /> : <PolaroidCaption>{caption}</PolaroidCaption>}</PolaroidCard>
}

function PolaroidCaption({ children, placeholder = false }) {
  return <span className={`polaroid-caption-text ${placeholder ? 'polaroid-caption-placeholder' : ''}`} aria-hidden={placeholder || undefined}>{children}</span>
}

function EditablePolaroidCaption({ value, t, onChange, onCommit }) {
  return <input className="polaroid-caption-input" aria-label={t.captionLabel} type="text" maxLength="60" value={value} onChange={(event) => onChange(event.target.value)} onBlur={(event) => onCommit(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} />
}

function RainbowArtwork({ samples, transform, label, onPointerDown, onPointerMove, onPointerUp, onWheel }) {
  const transparency = transform.transparency ?? (transform.opacity == null ? 0 : 1 - transform.opacity)
  const style = { left: `${transform.x}%`, top: `${transform.y}%`, opacity: 1 - transparency, transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scale})` }
  const outerRadius = 132 * (transform.radius ?? 1)
  const colorWidth = 12 * (transform.colorWidth ?? 1)
  const innerRadius = Math.max(2, outerRadius - colorWidth * COLOR_KEYS.length)
  const angle = Math.max(10, Math.min(180, transform.angle ?? 180))
  const halfAngle = angle * Math.PI / 360
  const startAngle = -Math.PI / 2 - halfAngle
  const endAngle = -Math.PI / 2 + halfAngle
  const point = (radius, radians) => ({ x: 150 + radius * Math.cos(radians), y: 158 + radius * Math.sin(radians) })
  const outerStart = point(outerRadius, startAngle)
  const outerEnd = point(outerRadius, endAngle)
  const innerStart = point(innerRadius, startAngle)
  const innerEnd = point(innerRadius, endAngle)
  const arc = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y} Z`
  const innerRatio = innerRadius / outerRadius
  const outerEdgeStart = innerRatio + (1 - innerRatio) * 0.985
  const spectrumStops = [...COLOR_KEYS].reverse().map((key, index) => <stop key={key} offset={innerRatio + (1 - innerRatio) * (index + 0.5) / COLOR_KEYS.length} stopColor={samples[key] || FALLBACK_COLORS[key]} />)
  return <div className="rainbow-artwork" style={style} role="img" aria-label={label} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onLostPointerCapture={onPointerUp} onWheel={onWheel}>
    <svg viewBox="0 0 300 316" aria-hidden="true">
      <defs>
        <radialGradient id="rainbow-spectrum" gradientUnits="userSpaceOnUse" cx="150" cy="158" r={outerRadius}>
          <stop offset={Math.max(0, innerRatio - 0.012)} stopColor={samples.violet || FALLBACK_COLORS.violet} stopOpacity="0" />
          <stop offset={innerRatio} stopColor={samples.violet || FALLBACK_COLORS.violet} />
          {spectrumStops}
          <stop offset={outerEdgeStart} stopColor={samples.red || FALLBACK_COLORS.red} />
          <stop offset="1" stopColor={samples.red || FALLBACK_COLORS.red} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rainbow-end-fade" gradientUnits="userSpaceOnUse" x1={outerStart.x} y1={outerStart.y} x2={outerEnd.x} y2={outerEnd.y}><stop offset="0" stopColor="white" stopOpacity="0" /><stop offset=".1" stopColor="white" /><stop offset=".9" stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
        <mask id="rainbow-fade-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={150 - outerRadius * 1.25} y={158 - outerRadius * 1.25} width={outerRadius * 2.5} height={outerRadius * 2.5}><rect x={150 - outerRadius * 1.25} y={158 - outerRadius * 1.25} width={outerRadius * 2.5} height={outerRadius * 2.5} fill="url(#rainbow-end-fade)" /></mask>
        <filter id="rainbow-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /><feColorMatrix type="saturate" values="1.55" /></filter>
        <filter id="rainbow-soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation=".9" /><feColorMatrix type="saturate" values="1.45" /></filter>
      </defs>
      <path className="rainbow-glow" d={arc} fill="url(#rainbow-spectrum)" mask="url(#rainbow-fade-mask)" filter="url(#rainbow-glow)" />
      <path className="rainbow-spectrum" d={arc} fill="url(#rainbow-spectrum)" mask="url(#rainbow-fade-mask)" filter="url(#rainbow-soft)" />
    </svg>
  </div>
}

function ColorWheel({ selected, labels, sampleColor, sampleLabel, onSelect }) {
  return (
    <div className="color-wheel" role="group" aria-label={labels.join('、')}>
      <div className="wheel-ring" aria-hidden="true" />
      {COLOR_KEYS.map((key, index) => {
        const angle = -90 + index * (360 / 7)
        const radians = angle * Math.PI / 180
        const style = { '--wheel-x': `${50 + Math.cos(radians) * 38}%`, '--wheel-y': `${50 + Math.sin(radians) * 38}%` }
        return <button type="button" key={key} style={style} className={`wheel-choice wheel-${key} ${selected === key ? 'selected' : ''}`} aria-pressed={selected === key} onClick={() => onSelect(key)}><i aria-hidden="true" /><span>{labels[index]}</span>{selected === key ? <b><Icon name="check" size={13} /></b> : null}</button>
      })}
      <div className="wheel-center" style={{ '--sample': sampleColor }} role="img" aria-label={`${sampleLabel}: ${sampleColor}`} />
    </div>
  )
}

function CaptureStage({ staged, selectedColor, photos, t, onSelect, onCancel, onConfirm, onOpenSampler }) {
  const selectedIndex = COLOR_KEYS.indexOf(selectedColor)
  const replacing = Boolean(photos[selectedColor])
  return (
    <section className="capture-stage screen-enter" aria-labelledby="color-question">
      <button className="icon-button back-button" type="button" onClick={onCancel} aria-label={t.cancel}><Icon name="back" /></button>
      <div className="capture-copy">
        <span className="ai-badge"><Icon name="sparkle" size={17} />{formatText(t.aiGuess, { confidence: staged.confidence })}</span>
        <h1 id="color-question">{t.whichColor}</h1>
        <p>{t.wheelHint}</p>
      </div>
      <div className="capture-layout">
        <button className="photo-preview sample-preview" type="button" onClick={onOpenSampler} aria-label={t.expandToSample}>
          <img src={staged.image} alt={t.newPhotoAlt} />
          <span className="sample-reticle" style={{ left: `${staged.samplePoint.x * 100}%`, top: `${staged.samplePoint.y * 100}%`, '--sample': staged.sampleColor }}><i /></span>
          <small>{t.expandToSample}</small>
        </button>
        <ColorWheel selected={selectedColor} labels={t.colors} sampleColor={staged.sampleColor} sampleLabel={t.currentSample} onSelect={onSelect} />
      </div>
      <div className="stage-actions">
        {replacing ? <p className="replace-warning" role="status">{formatText(t.replaceWarning, { color: t.colors[selectedIndex] })}</p> : null}
        <button className="y2k-button primary" type="button" onClick={onConfirm}><Icon name="check" />{formatText(t.putInRainbow, { color: t.colors[selectedIndex] })}</button>
      </div>
    </section>
  )
}

function FullscreenSampler({ staged, t, onClose, onSample }) {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [imageAspect, setImageAspect] = useState(1)
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  function clampZoom(value) { return Math.max(1, Math.min(4, value)) }

  function zoomBy(amount) {
    setView((current) => {
      const zoom = clampZoom(current.zoom + amount)
      return { zoom, x: zoom === 1 ? 0 : current.x, y: zoom === 1 ? 0 : current.y }
    })
  }

  function resetView() { setView({ zoom: 1, x: 0, y: 0 }) }

  function pointerDown(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false })
    const values = [...pointers.current.values()]
    if (values.length === 1) gesture.current = { type: 'pan', lastX: event.clientX, lastY: event.clientY }
    if (values.length === 2) {
      const [a, b] = values
      a.moved = true; b.moved = true
      gesture.current = { type: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y), centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2, view }
    }
  }

  function pointerMove(event) {
    const pointer = pointers.current.get(event.pointerId)
    if (!pointer) return
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 7) pointer.moved = true
    pointer.x = event.clientX; pointer.y = event.clientY
    const values = [...pointers.current.values()]
    if (values.length === 2 && gesture.current?.type === 'pinch') {
      const [a, b] = values
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const centerX = (a.x + b.x) / 2, centerY = (a.y + b.y) / 2
      const zoom = clampZoom(gesture.current.view.zoom * distance / Math.max(1, gesture.current.distance))
      setView({ zoom, x: gesture.current.view.x + centerX - gesture.current.centerX, y: gesture.current.view.y + centerY - gesture.current.centerY })
    } else if (values.length === 1 && gesture.current?.type === 'pan' && view.zoom > 1) {
      const dx = event.clientX - gesture.current.lastX, dy = event.clientY - gesture.current.lastY
      gesture.current.lastX = event.clientX; gesture.current.lastY = event.clientY
      setView((current) => ({ ...current, x: Math.max(-320, Math.min(320, current.x + dx)), y: Math.max(-320, Math.min(320, current.y + dy)) }))
    }
  }

  function pointerUp(event) {
    const pointer = pointers.current.get(event.pointerId)
    const wasSingleTap = pointers.current.size === 1 && pointer && !pointer.moved
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointers.current.delete(event.pointerId)
    if (wasSingleTap) {
      const image = event.currentTarget.querySelector('.sampler-image')
      const rect = image?.getBoundingClientRect()
      if (image && rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
        onSample(image, { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height })
      }
    }
    const remaining = [...pointers.current.values()]
    gesture.current = remaining.length === 1 ? { type: 'pan', lastX: remaining[0].x, lastY: remaining[0].y } : null
  }

  function wheelZoom(event) {
    event.preventDefault()
    zoomBy(event.deltaY < 0 ? 0.2 : -0.2)
  }

  return <section className="sampler-overlay" role="dialog" aria-modal="true" aria-labelledby="sampler-title">
    <header className="sampler-header"><button className="icon-button" type="button" onClick={onClose} aria-label={t.cancel}><Icon name="back" /></button><div><span className="chrome-kicker">COLOR PICKER</span><h2 id="sampler-title">{t.samplerTitle}</h2></div><div className="sampler-live" style={{ '--sample': staged.sampleColor }}><i /><span>{t.currentSample}<small>{staged.sampleColor.replace('rgb', '')}</small></span></div></header>
    <div className="sampler-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheelZoom}>
      <div className="sampler-media" style={{ '--image-aspect': imageAspect, '--inverse-zoom': 1 / view.zoom, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})` }}>
        <img className="sampler-image" src={staged.image} alt={t.newPhotoAlt} draggable="false" onLoad={(event) => setImageAspect(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight || 1)} />
        <span className="sample-reticle sampler-reticle" style={{ left: `${staged.samplePoint.x * 100}%`, top: `${staged.samplePoint.y * 100}%`, '--sample': staged.sampleColor }}><i /></span>
      </div>
    </div>
    <footer className="sampler-footer"><p>{t.pinchHint}</p><div className="zoom-controls"><button type="button" onClick={() => zoomBy(-0.25)} aria-label={t.zoomOut}>−</button><output aria-label={t.zoomLevel}>{Math.round(view.zoom * 100)}%</output><button type="button" onClick={() => zoomBy(0.25)} aria-label={t.zoomIn}>＋</button><button type="button" className="reset-zoom" onClick={resetView}>{t.resetZoom}</button></div><button className="y2k-button sampler-done" type="button" onClick={onClose}><Icon name="check" />{t.finishSampling}</button></footer>
  </section>
}

function TodayScreen({ day, count, date, lang, t, loading, dailyLocked, onCapture, onRemove, onStartCompose }) {
  const photos = day?.photos ?? {}
  const samples = day?.samples ?? {}
  const isComplete = dailyLocked
  const visiblePhotos = isComplete ? COMPLETED_COLOR_SLOTS : photos
  return (
    <section className="today-screen screen-enter" aria-labelledby="today-title">
      <div className="mission-head">
        <div className="mission-heading-copy"><time className="mission-date" dateTime={date}>{formatDate(date, lang)}</time><h1 id="today-title">{isComplete ? t.missionComplete : t.todayMission}</h1></div>
      </div>
      <div className={`mission-card ${isComplete ? 'is-complete' : ''}`}>
        <div className="mission-card-content">
          <div className="mission-card-heading"><span className="quest-kicker">DAILY QUEST</span><span className="quest-guide-label">{isComplete ? t.questCleared : t.questGuideTitle}</span></div>
          <div className="mission-copy">
            <h2>{isComplete ? t.rainbowReady : t.findTheRainbow}</h2>
            <p>{isComplete ? t.comeBackTomorrow : t.photoFirstHint}</p>
          </div>
          {!isComplete ? <ol className="quest-steps" aria-label={t.questGuideTitle}>
            {t.questSteps.map((step, index) => <li key={`${index}-${step.title}`}><span className="quest-step-number">{index + 1}</span><span className="quest-step-copy"><strong>{step.title}</strong><small>{step.text}</small></span></li>)}
          </ol> : null}
        </div>
      </div>

      <div className="collection-panel">
        <div className="panel-title"><h2>{t.colorSlots}</h2><span>{count === 7 ? t.allFound : formatText(t.foundCount, { count })}</span></div>
        {loading ? <div className="slot-loading" /> : <EnergyStrip photos={visiblePhotos} samples={samples} labels={t.colors} interactive={!isComplete} onSelect={onRemove} />}
        {!isComplete && count > 0 ? <p className="slot-hint">{t.tapToRemove}</p> : null}
      </div>

      <div className="primary-zone">
        {isComplete ? (
          <div className="locked-message"><Icon name="lock" /><div><strong>{t.todayLocked}</strong><span>{t.comeBackTomorrow}</span></div></div>
        ) : count === 7 ? (
          <button className="y2k-button finish" type="button" onClick={onStartCompose}><Icon name="sparkle" />{t.createRainbowCard}</button>
        ) : (
          <div className="capture-source-actions">
            <label className="capture-button camera-capture">
              <input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} />
              <span className="capture-lens"><Icon name="camera" size={30} /></span>
              <span><b>{t.takePhoto}</b><small>{t.thenPickColor}</small></span>
            </label>
            <label className="capture-button upload-capture">
              <input type="file" accept="image/*" onChange={(event) => onCapture(event.target.files?.[0], event.target)} />
              <span className="capture-lens"><Icon name="upload" size={21} /></span>
              <b>{t.uploadPhoto}</b>
            </label>
          </div>
        )}
      </div>
    </section>
  )
}

function ComposeScreen({ background, photos, samples, caption, date, transform, setTransform, selectedFilmId, unlockedFilmIds, lang, t, onCaptionChange, onCaptionCommit, onSelectFilm, onCapture, onBack, onFinish, finishing }) {
  const [activeTool, setActiveTool] = useState('transparency')
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const liveTransform = useRef(transform)
  const renderFrame = useRef(null)

  useEffect(() => {
    if (renderFrame.current === null) liveTransform.current = transform
  }, [transform])

  useEffect(() => () => {
    if (renderFrame.current !== null) cancelAnimationFrame(renderFrame.current)
  }, [])

  function queueTransform(next) {
    liveTransform.current = next
    if (renderFrame.current !== null) return
    renderFrame.current = requestAnimationFrame(() => {
      renderFrame.current = null
      setTransform(liveTransform.current)
    })
  }

  function flushTransform() {
    if (renderFrame.current !== null) {
      cancelAnimationFrame(renderFrame.current)
      renderFrame.current = null
    }
    setTransform(liveTransform.current)
  }

  function beginGesture(event) {
    const frame = event.currentTarget.closest('.composition-canvas-photo')?.getBoundingClientRect()
    if (!frame) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    rebaseGesture(frame)
  }

  function rebaseGesture(frame) {
    const entries = [...pointers.current.entries()]
    if (entries.length >= 2) {
      const active = entries.slice(0, 2)
      gesture.current = { mode: 'pinch', frame, pointerIds: active.map(([id]) => id), points: active.map(([, point]) => ({ ...point })) }
    } else if (entries.length === 1) {
      const [pointerId, point] = entries[0]
      gesture.current = { mode: 'pan', frame, pointerId, point: { ...point } }
    } else gesture.current = null
  }

  function moveGesture(event) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    event.preventDefault()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const start = gesture.current

    if (start.mode === 'pinch') {
      const points = start.pointerIds.map((id) => pointers.current.get(id))
      if (points.some((point) => !point)) { rebaseGesture(start.frame); return }
      queueTransform(applyPinchDelta(liveTransform.current, start.frame, start.points, points))
      start.points = points.map((point) => ({ ...point }))
    } else if (start.mode === 'pan') {
      const point = pointers.current.get(start.pointerId)
      if (!point || pointers.current.size !== 1) { rebaseGesture(start.frame); return }
      queueTransform(applyPanDelta(liveTransform.current, start.frame, start.point, point))
      start.point = { ...point }
    }
  }

  function endGesture(event) {
    if (!pointers.current.has(event.pointerId)) return
    const hasCapture = event.currentTarget.hasPointerCapture?.(event.pointerId)
    pointers.current.delete(event.pointerId)
    if (hasCapture) event.currentTarget.releasePointerCapture(event.pointerId)
    flushTransform()
    const frame = event.currentTarget.closest('.composition-canvas-photo')?.getBoundingClientRect()
    if (frame) rebaseGesture(frame)
  }

  function zoomWithWheel(event) {
    event.preventDefault()
    const factor = Math.exp(-event.deltaY * 0.0015)
    queueTransform({ ...liveTransform.current, scale: liveTransform.current.scale * factor })
  }

  function resetRainbow() {
    const next = { x: 50, y: 58, scale: 1, rotation: 0, transparency: 0, radius: 1, colorWidth: 1, angle: 180 }
    if (renderFrame.current !== null) cancelAnimationFrame(renderFrame.current)
    renderFrame.current = null
    liveTransform.current = next
    setTransform(next)
  }

  const editorTools = [
    { key: 'transparency', icon: 'opacity', label: t.toolTransparency, title: t.transparency, min: 0, max: 1, step: 0.01, value: transform.transparency ?? 0, output: `${Math.round((transform.transparency ?? 0) * 100)}%` },
    { key: 'radius', icon: 'radius', label: t.toolRadius, title: t.rainbowRadius, min: 0.55, max: 15, step: 0.05, value: transform.radius ?? 1, output: `${Math.round((transform.radius ?? 1) * 100)}%` },
    { key: 'angle', icon: 'angle', label: t.toolAngle, title: t.rainbowAngle, min: 10, max: 180, step: 1, value: transform.angle ?? 180, output: `${Math.round(transform.angle ?? 180)}°` },
    { key: 'film', icon: 'film', label: t.filmPickerLabel },
  ]
  const activeControl = editorTools.find((tool) => tool.key === activeTool && tool.min !== undefined) ?? editorTools[0]
  return <section className="compose-screen screen-enter" aria-labelledby="compose-title">
    <header className="studio-topbar"><button className="icon-button" type="button" onClick={onBack} aria-label={t.cancel}><Icon name="back" /></button><div><span>RAINBOW STUDIO</span><h1 id="compose-title">{background ? t.adjustRainbow : t.composeTitle}</h1></div>{background ? <div className="studio-actions"><button className="studio-reset" type="button" disabled={finishing} onClick={resetRainbow}><Icon name="reset" size={18} />{t.resetShort}</button><button className="studio-finish" type="button" disabled={finishing} onClick={onFinish}><Icon name="check" size={18} />{finishing ? t.developing : t.done}</button></div> : <i aria-hidden="true" />}</header>
    {!background ? <div className="background-capture-card"><div className="camera-portal"><Icon name="camera" size={46} /></div><h2>{t.takeBackground}</h2><p>{t.takeBackgroundHint}</p><div className="background-source-actions"><label className="background-source camera-source"><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="camera" /><span><b>{t.openCamera}</b><small>{t.backgroundOnly}</small></span></label><label className="background-source upload-source"><input type="file" accept="image/*" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="upload" /><span><b>{t.uploadBackground}</b><small>{t.chooseFromDevice}</small></span></label></div></div> : <div className="studio-workspace">
      <div className="canvas-stage"><PolaroidCard className="composition-canvas" photoClassName="composition-canvas-photo" media={<img src={background} alt={t.backgroundAlt} />} overlay={<><RainbowArtwork samples={samples} transform={transform} label={t.adjustRainbow} onPointerDown={beginGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onWheel={zoomWithWheel} /><div className="canvas-source-actions"><label title={t.retakeBackground}><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="camera" size={17} /><span>{t.retakeBackground}</span></label><label title={t.uploadBackground}><input type="file" accept="image/*" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="upload" size={17} /><span>{t.uploadBackground}</span></label></div></>} photos={photos} samples={samples} labels={t.colors} date={date} lang={lang} filmId={selectedFilmId}><EditablePolaroidCaption value={caption} t={t} onChange={onCaptionChange} onCommit={onCaptionCommit} /></PolaroidCard></div>
      <div className="editor-dock">
        {activeTool === 'film' ? <FilmPicker selectedFilmId={selectedFilmId} unlockedFilmIds={unlockedFilmIds} lang={lang} t={t} onSelect={onSelectFilm} /> : <label className="active-editor-control"><span>{activeControl.title}<output>{activeControl.output}</output></span><input aria-label={activeControl.title} type="range" min={activeControl.min} max={activeControl.max} step={activeControl.step} value={activeControl.value} onChange={(event) => queueTransform({ ...liveTransform.current, [activeControl.key]: Number(event.target.value) })} /></label>}
        <div className="editor-toolbar" role="toolbar" aria-label={t.editorTools}>{editorTools.map((tool) => <button type="button" key={tool.key} className={`${activeTool === tool.key ? 'active' : ''} ${tool.key === 'film' ? 'toolbar-film' : ''}`} aria-pressed={activeTool === tool.key} onClick={() => setActiveTool(tool.key)}><Icon name={tool.icon} size={21} /><span>{tool.label}</span></button>)}</div>
      </div>
    </div>}
  </section>
}

function ArchivePolaroid({ item, lang, t }) {
  return <CompletedPolaroid item={item} alt={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })} lang={lang} t={t} />
}

function ArchiveScreen({ history, lang, t, onOpen, onRequestDelete }) {
  const [deleteMode, setDeleteMode] = useState(null)
  const [overTrash, setOverTrash] = useState(false)
  const drag = useRef(null)
  const longPressTimer = useRef(null)
  const animationFrame = useRef(null)
  const previewRef = useRef(null)
  const trashRef = useRef(null)
  const deleteDialogRef = useRef(null)
  const nativeTouchHandlers = useRef(null)
  const settleTimer = useRef(null)
  const discardTimer = useRef(null)
  const discarding = useRef(false)
  const suppressClickUntil = useRef(0)

  useEffect(() => {
    if (!deleteMode) return undefined
    const previousFocus = document.activeElement
    requestAnimationFrame(() => deleteDialogRef.current?.focus())
    return () => previousFocus?.focus?.()
  }, [deleteMode?.date])

  useEffect(() => {
    function preventNativeLongPressMenu(event) {
      if (event.target?.closest?.('.archive-card, .archive-delete-polaroid')) event.preventDefault()
    }

    document.addEventListener('contextmenu', preventNativeLongPressMenu, true)
    return () => document.removeEventListener('contextmenu', preventNativeLongPressMenu, true)
  }, [])

  useEffect(() => () => {
    window.clearTimeout(longPressTimer.current)
    window.clearTimeout(settleTimer.current)
    window.clearTimeout(discardTimer.current)
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    detachNativeTouchListeners()
  }, [])

  function clearLongPress() {
    window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }

  function paintPreview() {
    animationFrame.current = null
    const current = drag.current
    if (!current?.active || !previewRef.current) return
    previewRef.current.style.setProperty('--drag-x', `${current.x - current.anchorX}px`)
    previewRef.current.style.setProperty('--drag-y', `${current.y - current.anchorY}px`)
  }

  function queuePreviewPaint() {
    if (animationFrame.current !== null) return
    animationFrame.current = requestAnimationFrame(paintPreview)
  }

  function activateDrag() {
    const current = drag.current
    if (!current || current.active) return
    current.active = true
    current.anchorX = current.x
    current.anchorY = current.y
    current.overTrash = false
    current.trashRect = null
    if (current.kind === 'pointer') {
      try { current.source.setPointerCapture?.(current.pointerId) } catch { /* Pointer may already be released. */ }
    } else {
      attachNativeTouchListeners()
    }
    setDeleteMode(current.item)
    setOverTrash(false)
    suppressClickUntil.current = Date.now() + 1000
    navigator.vibrate?.(18)
    requestAnimationFrame(queuePreviewPaint)
  }

  function beginPress(item, source, kind, pointerId, x, y) {
    clearLongPress()
    drag.current = { item, source, kind, pointerId, startX: x, startY: y, anchorX: x, anchorY: y, x, y, active: false, overTrash: false, trashRect: null }
    longPressTimer.current = window.setTimeout(activateDrag, 450)
  }

  function beginActiveDrag(item, source, kind, pointerId, x, y) {
    if (discarding.current) return
    clearLongPress()
    window.clearTimeout(settleTimer.current)
    if (previewRef.current) {
      previewRef.current.classList.remove('settling')
      previewRef.current.style.removeProperty('--drag-x')
      previewRef.current.style.removeProperty('--drag-y')
    }
    drag.current = { item, source, kind, pointerId, startX: x, startY: y, anchorX: x, anchorY: y, x, y, active: true, overTrash: false, trashRect: null }
    if (kind === 'pointer') {
      try { source.setPointerCapture?.(pointerId) } catch { /* Pointer capture is best effort. */ }
    } else {
      attachNativeTouchListeners()
    }
    setOverTrash(false)
  }

  function detachNativeTouchListeners() {
    const handlers = nativeTouchHandlers.current
    if (!handlers) return
    document.removeEventListener('touchmove', handlers.move)
    document.removeEventListener('touchend', handlers.end)
    document.removeEventListener('touchcancel', handlers.cancel)
    nativeTouchHandlers.current = null
  }

  function attachNativeTouchListeners() {
    detachNativeTouchListeners()
    const handlers = {
      move(event) {
        const current = drag.current
        if (!current || current.kind !== 'touch') return
        const touch = findTouch(event.touches, current.pointerId)
        if (touch) movePress(touch.clientX, touch.clientY, event)
      },
      end(event) {
        const current = drag.current
        if (!current || current.kind !== 'touch') return
        const touch = findTouch(event.changedTouches, current.pointerId)
        finishPress(touch?.clientX ?? current.x, touch?.clientY ?? current.y, true)
      },
      cancel() {
        cancelPress()
      },
    }
    nativeTouchHandlers.current = handlers
    document.addEventListener('touchmove', handlers.move, { passive: false })
    document.addEventListener('touchend', handlers.end)
    document.addEventListener('touchcancel', handlers.cancel)
  }

  function pointIsOverTrash(x, y) {
    const current = drag.current
    if (!current?.active) return false
    current.trashRect ??= trashRef.current?.getBoundingClientRect() ?? null
    const rect = current.trashRect
    return Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
  }

  function aimPreviewAtTrash(current) {
    const preview = previewRef.current
    const trash = trashRef.current
    if (!preview || !trash) return

    preview.style.setProperty('--drag-x', `${current.x - current.anchorX}px`)
    preview.style.setProperty('--drag-y', `${current.y - current.anchorY}px`)
    const previewRect = preview.getBoundingClientRect()
    const trashRect = current.trashRect ?? trash.getBoundingClientRect()
    preview.style.setProperty('--trash-origin-x', `${trashRect.left + trashRect.width / 2 - previewRect.left}px`)
    preview.style.setProperty('--trash-origin-y', `${trashRect.top + trashRect.height / 2 - previewRect.top}px`)
  }

  function movePress(x, y, event) {
    const current = drag.current
    if (!current) return
    current.x = x
    current.y = y
    if (!current.active) {
      if (Math.hypot(x - current.startX, y - current.startY) > 10) {
        clearLongPress()
        drag.current = null
      }
      return
    }
    event.preventDefault()
    queuePreviewPaint()
    const nextOverTrash = pointIsOverTrash(x, y)
    if (nextOverTrash !== current.overTrash) {
      current.overTrash = nextOverTrash
      if (nextOverTrash) aimPreviewAtTrash(current)
      setOverTrash(nextOverTrash)
      if (nextOverTrash) navigator.vibrate?.(24)
    }
  }

  function settlePreview() {
    const preview = previewRef.current
    if (!preview) return
    preview.classList.add('settling')
    preview.style.setProperty('--drag-x', '0px')
    preview.style.setProperty('--drag-y', '0px')
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => preview.classList.remove('settling'), 260)
  }

  function animatePreviewToTrash(item, currentOffset = { x: 0, y: 0 }) {
    if (discarding.current) return
    const preview = previewRef.current
    const trash = trashRef.current
    if (!preview || !trash) {
      setDeleteMode(null)
      onRequestDelete(item)
      return
    }

    discarding.current = true
    const previewRect = preview.getBoundingClientRect()
    const trashRect = trash.getBoundingClientRect()
    const targetX = currentOffset.x + (trashRect.left + trashRect.width / 2) - (previewRect.left + previewRect.width / 2)
    const targetY = currentOffset.y + (trashRect.top + trashRect.height / 2) - (previewRect.top + previewRect.height / 2)

    preview.classList.remove('settling')
    trash.classList.add('accepting')
    trash.disabled = true
    trash.setAttribute('aria-busy', 'true')
    requestAnimationFrame(() => {
      preview.style.setProperty('--drag-x', `${targetX}px`)
      preview.style.setProperty('--drag-y', `${targetY}px`)
      preview.classList.add('discarding')
    })
    navigator.vibrate?.([28, 24, 42])

    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 30 : 360
    window.clearTimeout(discardTimer.current)
    discardTimer.current = window.setTimeout(() => {
      discarding.current = false
      setDeleteMode(null)
      setOverTrash(false)
      onRequestDelete(item)
    }, duration)
  }

  function finishPress(x, y, requestDelete) {
    const current = drag.current
    if (!current) return
    clearLongPress()
    if (current.active) {
      current.x = x
      current.y = y
      current.overTrash = pointIsOverTrash(x, y)
      suppressClickUntil.current = Date.now() + 700
    }
    if (current.kind === 'pointer' && current.source.hasPointerCapture?.(current.pointerId)) {
      current.source.releasePointerCapture(current.pointerId)
    }
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current)
    animationFrame.current = null
    detachNativeTouchListeners()
    drag.current = null
    if (current.active && current.overTrash && requestDelete) {
      animatePreviewToTrash(current.item, { x: current.x - current.anchorX, y: current.y - current.anchorY })
      return
    }
    setOverTrash(false)
    if (current.active) settlePreview()
  }

  function cancelPress() {
    const current = drag.current
    if (!current) return
    if (!current.active) {
      clearLongPress()
      drag.current = null
      return
    }
    finishPress(current.x, current.y, false)
  }

  function findTouch(touches, identifier) {
    for (let index = 0; index < touches.length; index++) {
      if (touches[index].identifier === identifier) return touches[index]
    }
    return null
  }

  function handleTouchStart(event, item) {
    if (event.touches.length !== 1) { cancelPress(); return }
    const touch = event.touches[0]
    beginPress(item, event.currentTarget, 'touch', touch.identifier, touch.clientX, touch.clientY)
  }

  function handleTouchMove(event) {
    const current = drag.current
    if (!current || current.kind !== 'touch') return
    if (current.active && nativeTouchHandlers.current) return
    const touch = findTouch(event.touches, current.pointerId)
    if (touch) movePress(touch.clientX, touch.clientY, event)
  }

  function handleTouchEnd(event) {
    const current = drag.current
    if (!current || current.kind !== 'touch') return
    if (current.active && nativeTouchHandlers.current) return
    const touch = findTouch(event.changedTouches, current.pointerId)
    finishPress(touch?.clientX ?? current.x, touch?.clientY ?? current.y, true)
  }

  function beginDeleteModeTouch(event) {
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    beginActiveDrag(deleteMode, event.currentTarget, 'touch', touch.identifier, touch.clientX, touch.clientY)
  }

  function handlePointerDown(event, item) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    beginPress(item, event.currentTarget, 'pointer', event.pointerId, event.clientX, event.clientY)
  }

  function handlePointerMove(event) {
    const current = drag.current
    if (!current || current.kind !== 'pointer' || current.pointerId !== event.pointerId) return
    movePress(event.clientX, event.clientY, event)
  }

  function handlePointerUp(event) {
    const current = drag.current
    if (!current || current.kind !== 'pointer' || current.pointerId !== event.pointerId) return
    finishPress(event.clientX, event.clientY, true)
  }

  function beginDeleteModePointer(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return
    event.preventDefault()
    beginActiveDrag(deleteMode, event.currentTarget, 'pointer', event.pointerId, event.clientX, event.clientY)
  }

  function closeDeleteMode() {
    if (drag.current?.active || discarding.current) return
    setDeleteMode(null)
    setOverTrash(false)
  }

  function handleDeleteModeKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeDeleteMode()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      trashRef.current?.focus()
    }
  }

  return (
    <section className="archive-screen screen-enter" aria-labelledby="archive-title">
      <div className="screen-title"><span className="chrome-kicker">POLAROID ALBUM</span><h1 id="archive-title">{t.archiveTitle}</h1><p>{formatText(t.rainbowCount, { count: history.length })}</p></div>
      <div className="archive-scroll-region" role="region" aria-label={t.albumListLabel} tabIndex={0}>
        {history.length ? <div className="archive-grid">{history.map((item) => (
          <button type="button" className="archive-card" key={item.date} aria-describedby="archive-delete-instructions" aria-label={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })} onClick={(event) => { if (Date.now() < suppressClickUntil.current) { event.preventDefault(); return }; onOpen(item) }} onKeyDown={(event) => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); setDeleteMode(item) } }} onPointerDown={(event) => handlePointerDown(event, item)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={cancelPress} onTouchStart={(event) => handleTouchStart(event, item)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={cancelPress} onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}>
            <ArchivePolaroid item={item} lang={lang} t={t} />
          </button>
        ))}</div> : <div className="empty-archive"><div className="empty-disc"><Icon name="sparkle" size={42} /></div><h2>{t.noRainbows}</h2><p>{t.noRainbowsHint}</p></div>}
      </div>
      <p className="visually-hidden" id="archive-delete-instructions">{t.archiveDeleteHint}</p>
      {deleteMode ? createPortal(<div className="archive-delete-overlay"><button className="archive-delete-dismiss" type="button" onClick={closeDeleteMode} aria-label={t.close} tabIndex="-1" /><section ref={deleteDialogRef} className="archive-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-delete-date" tabIndex="-1" onKeyDown={handleDeleteModeKeyDown}><h2 className="visually-hidden" id="archive-delete-date">{formatDate(deleteMode.date, lang)}</h2><div ref={previewRef} className={`archive-delete-polaroid ${overTrash ? 'over-trash' : ''}`} onPointerDown={beginDeleteModePointer} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={cancelPress} onTouchStart={beginDeleteModeTouch} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={cancelPress} onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}><ArchivePolaroid item={deleteMode} lang={lang} t={t} /></div><button ref={trashRef} className={`album-delete-tray ${overTrash ? 'over-trash' : ''}`} type="button" onClick={() => { if (!drag.current?.active) animatePreviewToTrash(deleteMode) }} aria-label={t.dragToDelete}><span className="album-trash-icon"><Icon name="trash" size={34} /></span><strong aria-live="polite">{overTrash ? t.releaseToDelete : t.dragToDelete}</strong></button></section></div>, document.body) : null}
    </section>
  )
}

function DeletePolaroidDialog({ day, lang, t, deleting, onCancel, onConfirm }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!day) return undefined
    const previousFocus = document.activeElement
    requestAnimationFrame(() => cancelRef.current?.focus())
    return () => previousFocus?.focus?.()
  }, [day?.date])

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape' && !deleting) {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]
    if (!controls.length) return
    const first = controls[0]
    const last = controls.at(-1)
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!day) return null
  const displayDate = formatDate(day.date, lang, true)
  return <div className="delete-confirm-scrim"><button className="delete-confirm-dismiss" type="button" onClick={onCancel} aria-label={t.cancelDelete} disabled={deleting} /><section className="delete-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" onKeyDown={handleDialogKeyDown}><span className="delete-dialog-icon"><Icon name="trash" size={34} /></span><div><span className="chrome-kicker">DELETE POLAROID?</span><h2 id="delete-dialog-title">{t.deleteTitle}</h2><p id="delete-dialog-description">{formatText(t.deleteMessage, { date: displayDate })}</p></div><div className="delete-dialog-actions"><button ref={cancelRef} type="button" onClick={onCancel} disabled={deleting}>{t.cancelDelete}</button><button className="confirm-delete" type="button" onClick={onConfirm} disabled={deleting}><Icon name="trash" size={19} />{deleting ? t.deletingPolaroid : t.confirmDelete}</button></div></section></div>
}

function FilmsScreen({ completedDays, filmCollection, lang, t, onSelectFilm }) {
  const [filter, setFilter] = useState('all')
  const unlocked = new Set(filmCollection.unlockedFilmIds)
  const visibleFilms = [...FILMS.filter((film) => filter === 'all' || (filter === 'unlocked' ? unlocked.has(film.id) : !unlocked.has(film.id)))].sort((left, right) => {
    const ownershipOrder = Number(unlocked.has(right.id)) - Number(unlocked.has(left.id))
    return ownershipOrder || FILM_DATABASE_ORDER.get(left.id) - FILM_DATABASE_ORDER.get(right.id)
  })
  const unlockedCount = FILMS.filter((film) => unlocked.has(film.id)).length
  const selectedFilm = getFilm(filmCollection.selectedFilmId)

  return <section className="films-screen screen-enter" aria-labelledby="films-title">
    <div className="screen-title"><span className="chrome-kicker">FILM COLLECTION</span><h1 id="films-title">{t.filmCollectionTitle}</h1><p>{t.filmCollectionHint}</p></div>
    <div className="film-collection-summary"><FilmPreviewCard filmId={filmCollection.selectedFilmId} lang={lang} t={t} /><div><strong>{formatText(t.filmCollectionProgress, { unlocked: unlockedCount, total: FILMS.length })}</strong><span>{t.filmCurrent}{t[selectedFilm.nameKey]}</span></div><div className="film-count-orb"><b>{unlockedCount}</b><span>/{FILMS.length}</span></div></div>
    <div className="film-filter-bar" role="tablist" aria-label={t.filmCollectionListLabel}>
      {[['all', t.filmFilterAll], ['unlocked', t.filmFilterUnlocked], ['locked', t.filmFilterLocked]].map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>)}
    </div>
    <div className="film-grid" role="list" aria-label={t.filmCollectionListLabel}>
      {visibleFilms.length ? visibleFilms.map((film) => {
        const isUnlocked = unlocked.has(film.id)
        const isSelected = filmCollection.selectedFilmId === film.id
        const progress = getFilmProgress(film, completedDays)
        return <article className={`film-card ${film.className} ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'is-selected' : ''}`} key={film.id} role="listitem">
          <div className="film-card-top"><FilmPreviewCard filmId={film.id} lang={lang} t={t} /></div>
          <h2>{t[film.nameKey]}</h2>
          {isUnlocked ? <button className={`film-use-button ${isSelected ? 'is-active' : ''}`} type="button" disabled={isSelected} aria-pressed={isSelected} onClick={() => onSelectFilm(film.id)}>{isSelected ? t.filmSelected : t.useFilm}</button> : <>
            <div className="film-condition"><span>{t.filmConditionLabel}</span><p>{t[film.conditionKey]}</p></div>
            <div className="film-progress"><div><span>{formatText(t.filmProgress, progress)}</span><b>{progress.current}/{progress.target}</b></div><i><em style={{ width: `${progress.target ? Math.min(100, progress.current / progress.target * 100) : 100}%` }} /></i></div>
          </>}
        </article>
      }) : <div className="film-empty-state"><Icon name="film" size={32} /><strong>{t.filmNoResults}</strong></div>}
    </div>
  </section>
}

function SettingsScreen({ lang, setLang, t, migrationEnabled, migrationState, onMigrate, onOpenInfo }) {
  const migrationBusy = migrationState.status === 'sending'
  const migrationStatus = migrationState.status === 'success'
    ? formatText(t.migrationSuccess, {
      imported: migrationState.importedRecords,
      merged: migrationState.mergedRecords,
      skipped: migrationState.skippedRecords,
      localStorage: migrationState.importedLocalStorage,
    })
    : migrationState.status === 'error'
      ? migrationState.errorCode === 'popup-blocked' ? t.migrationPopupBlocked : migrationState.errorCode === 'timeout' ? t.migrationTimeout : t.migrationError
      : migrationState.status === 'sending' ? t.migrationSendingHint : ''

  return (
    <section className="settings-screen screen-enter" aria-labelledby="settings-title">
      <div className="screen-title"><span className="chrome-kicker">SYSTEM 2000</span><h1 id="settings-title">{t.settingsTitle}</h1><p>{t.settingsHint}</p></div>
      <div className="settings-card">
        <label htmlFor="language">{t.language}</label>
        <select id="language" value={lang} onChange={(event) => setLang(event.target.value)}>{Object.entries(LANGUAGE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      </div>
      {migrationEnabled ? <div className={`settings-card migration-card migration-${migrationState.status}`} aria-busy={migrationBusy}>
        <div className="migration-card-icon"><Icon name="upload" size={28} /></div>
        <div className="migration-card-copy">
          <span className="settings-card-kicker">LEGACY DATA</span>
          <strong>{t.migrationTitle}</strong>
          <p>{t.migrationHint}</p>
          <small>{t.migrationTarget}</small>
          {migrationStatus ? <p className="migration-status" role="status" aria-live="polite">{migrationStatus}</p> : null}
        </div>
        <button className="y2k-button migration-button" type="button" onClick={onMigrate} disabled={migrationBusy}><Icon name={migrationBusy ? 'sparkle' : 'upload'} size={19} />{migrationBusy ? t.migrationSending : t.migrationButton}</button>
      </div> : null}
      <div className="settings-card info-card"><Icon name="lock" /><div><strong>{t.privateTitle}</strong><p>{t.privateHint}</p></div></div>
      <section className="settings-info-center" aria-labelledby="info-center-title">
        <div className="settings-section-heading">
          <span className="chrome-kicker">INFO CENTER</span>
          <h2 id="info-center-title">{t.infoCenterTitle}</h2>
          <p>{t.infoCenterHint}</p>
        </div>
        <div className="info-link-grid">
          {INFO_PAGE_META.map(({ key, icon }) => <button type="button" key={key} onClick={() => onOpenInfo(key)}>
            <span className={`info-link-icon info-link-${key}`}><Icon name={icon} size={23} /></span>
            <strong>{infoContent[lang][key].label}</strong>
            <Icon name="chevron" size={19} />
          </button>)}
        </div>
      </section>
      <div className="about-sticker"><span>NIJI</span><b>拾色日記</b><small>v2.0 · Y2K EDITION</small></div>
    </section>
  )
}

function InfoScreen({ pageKey, lang, t, onBack, onNavigate }) {
  const page = infoContent[lang][pageKey]
  if (!page) return null

  return <section className="info-screen screen-enter" aria-labelledby="info-page-title">
    <div className="info-page-shell">
      <button className="info-back-button" type="button" onClick={onBack}><Icon name="back" size={21} />{t.backToSettings}</button>
      <article className="info-article">
        <header className="info-hero">
          <span className="chrome-kicker">{page.kicker}</span>
          <h1 id="info-page-title">{page.label}</h1>
          {page.status ? <strong className="info-status"><span aria-hidden="true" />{page.status}</strong> : null}
          <p>{page.summary}</p>
          {page.updated ? <small>{page.updated}</small> : null}
        </header>
        <div className="info-article-body">
          {page.sections.map((section, index) => <section key={`${pageKey}-${index}`}>
            <h2>{section.title}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {section.links?.length ? <div className="info-resource-links" aria-label={t.relatedLinks}>{section.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}<span className="visually-hidden">（{t.externalLink}）</span><Icon name="external" size={17} /></a>)}</div> : null}
          </section>)}
        </div>
      </article>
      <nav className="info-page-nav" aria-label={t.infoNavigation}>
        {INFO_PAGE_META.map(({ key, icon }) => <button type="button" key={key} className={pageKey === key ? 'active' : ''} aria-current={pageKey === key ? 'page' : undefined} onClick={() => onNavigate(key)}><Icon name={icon} size={19} /><span>{infoContent[lang][key].label}</span></button>)}
      </nav>
    </div>
  </section>
}

function RainbowModal({ day, lang, t, exporting, onClose, onSave, onShare, onCaptionChange, onCaptionCommit }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!day) return undefined
    const previousFocus = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [day?.date])

  if (!day) return null
  return <div className="modal-scrim" role="presentation"><button className="lightbox-dismiss" type="button" onClick={onClose} aria-label={t.close} /><section ref={dialogRef} className="rainbow-lightbox" role="dialog" aria-modal="true" aria-labelledby="modal-date" tabIndex="-1"><h2 className="visually-hidden" id="modal-date">{formatDate(day.date, lang)}</h2><CompletedPolaroid item={day} alt={formatText(t.viewRainbow, { date: formatDate(day.date, lang) })} lang={lang} t={t} editable onCaptionChange={onCaptionChange} onCaptionCommit={onCaptionCommit} /><div className="lightbox-actions" aria-busy={exporting}><button className="lightbox-save" type="button" onClick={onSave} disabled={exporting}><Icon name="download" />{exporting ? t.preparingCard : t.saveImage}</button><button className="lightbox-share" type="button" onClick={onShare} disabled={exporting}><Icon name="share" />{exporting ? t.preparingCard : t.shareImage}</button></div></section></div>
}

function PrinterShell({ foreground = false }) {
  return <div className={`printer-shell printer-shell-body ${foreground ? 'printer-shell-mask' : ''}`} aria-hidden="true"><i /><span>NIJI PRINT 2000</span><b /></div>
}

async function waitForImageElement(image) {
  if (!image.complete) {
    await new Promise((resolve) => {
      const finish = () => {
        image.removeEventListener('load', finish)
        image.removeEventListener('error', finish)
        resolve()
      }
      image.addEventListener('load', finish)
      image.addEventListener('error', finish)
    })
  }
  try { await image.decode?.() } catch { /* a failed thumbnail must not block the completed card */ }
}

function DevelopedCard({ day, lang, t, exporting, onSave, onShare, onDone, onCaptionChange, onCaptionCommit }) {
  const [printPhase, setPrintPhase] = useState('loading')
  const printedPolaroidRef = useRef(null)

  useEffect(() => {
    setPrintPhase('loading')
    if (!day) return undefined
    let active = true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const preparePrint = async () => {
      const images = [...(printedPolaroidRef.current?.querySelectorAll('img') ?? [])]
      await Promise.all([document.fonts?.ready, ...images.map(waitForImageElement)])
      if (!active) return
      if (reducedMotion) setPrintPhase('complete')
      else requestAnimationFrame(() => { if (active) setPrintPhase('printing') })
    }
    preparePrint()
    return () => { active = false }
  }, [day?.date, day?.cardImage, day?.polaroidImage])

  function finishPrintAnimation(event) {
    if (event.animationName === 'eject-polaroid') setPrintPhase('complete')
  }

  if (!day) return null
  return <div className="developed-overlay"><section className="developed-result" role="dialog" aria-modal="true" aria-labelledby="developed-title">
    <div className="developed-heading"><span className="chrome-kicker">RAINBOW DEVELOPED</span><h2 id="developed-title">{t.developedTitle}</h2></div>
    <div className={`printer-stage print-${printPhase}`} aria-label={t.developedTitle} aria-busy={printPhase === 'loading'}><PrinterShell /><div ref={printedPolaroidRef} className="printed-polaroid-feed"><div className="printed-polaroid-motion" onAnimationEnd={finishPrintAnimation}><CompletedPolaroid className="printed-polaroid" item={day} imageLoading="eager" alt={t.developedAlt} lang={lang} t={t} editable onCaptionChange={onCaptionChange} onCaptionCommit={onCaptionCommit} /></div></div><PrinterShell foreground /></div>
    <p className="caption-edit-hint"><Icon name="edit" size={17} />{t.editCaptionHint}</p>
    <div className="result-actions" aria-busy={exporting}><button className="save-card-action" type="button" onClick={onSave} disabled={exporting}><Icon name="download" />{exporting ? t.preparingCard : t.saveImage}</button><button className="share-card-action" type="button" onClick={onShare} disabled={exporting}><Icon name="share" />{exporting ? t.preparingCard : t.shareImage}</button></div>
    <button className="result-done" type="button" onClick={onDone}>{t.done}</button>
  </section></div>
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('niji-language') || 'zh-Hant')
  const [activeTab, setActiveTab] = useState(() => parseAppHash(location.hash).tab)
  const [infoPage, setInfoPage] = useState(() => parseAppHash(location.hash).infoPage)
  const [day, setDay] = useState(null)
  const [dailyLocked, setDailyLocked] = useState(false)
  const [history, setHistory] = useState([])
  const [filmCollection, setFilmCollection] = useState(createDefaultFilmCollection)
  const [filmNotifications, setFilmNotifications] = useState(createQaFilmNotifications)
  const [selectedDay, setSelectedDay] = useState(null)
  const [staged, setStaged] = useState(QA_SAMPLE)
  const [samplerOpen, setSamplerOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState('red')
  const [composing, setComposing] = useState(QA_MODE === 'compose')
  const [background, setBackground] = useState(QA_MODE === 'compose' ? './rainbow.svg' : null)
  const [rainbowTransform, setRainbowTransform] = useState({ x: 50, y: 58, scale: 1, rotation: 0, transparency: 0, radius: 1, colorWidth: 1, angle: 180 })
  const [loading, setLoading] = useState(true)
  const [filmCollectionReady, setFilmCollectionReady] = useState(Boolean(QA_MODE))
  const [processing, setProcessing] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [developedDay, setDevelopedDay] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deletingPolaroid, setDeletingPolaroid] = useState(false)
  const [message, setMessage] = useState('')
  const [migrationState, setMigrationState] = useState({ status: 'idle' })
  const messageTimer = useRef(null)
  const hydrationRequestRef = useRef(0)
  const incomingMigrationRequests = useRef(new Set())
  const [date, setDate] = useState(localDateKey)
  const t = translations[lang]
  const photos = day?.photos ?? {}
  const count = dailyLocked ? COLOR_KEYS.length : COLOR_KEYS.reduce((total, key) => total + (photos[key] ? 1 : 0), 0)

  function showMessage(text) {
    clearTimeout(messageTimer.current)
    setMessage(text)
    messageTimer.current = setTimeout(() => setMessage(''), 3200)
  }

  function applyHydratedCollectionState(hydrated) {
    setDay(hydrated.day)
    setDailyLocked(hydrated.dailyLocked)
    setHistory(hydrated.history)
    setFilmCollection(hydrated.filmCollection)
  }

  async function refreshCollectionStateAfterMigration() {
    const hydrationRequest = ++hydrationRequestRef.current
    setFilmCollectionReady(false)
    try {
      const hydrated = await hydrateCollectionState(date, lang)
      if (hydrationRequest === hydrationRequestRef.current) applyHydratedCollectionState(hydrated)
    } finally {
      if (hydrationRequest === hydrationRequestRef.current) {
        setLoading(false)
        setFilmCollectionReady(true)
      }
    }
  }

  function formatMigrationSuccess(result) {
    return formatText(t.migrationSuccess, {
      imported: result.importedRecords,
      merged: result.mergedRecords,
      skipped: result.skippedRecords,
      localStorage: result.importedLocalStorage,
    })
  }

  function migrationErrorMessage(error) {
    if (error?.code === 'popup-blocked') return t.migrationPopupBlocked
    if (error?.code === 'timeout') return t.migrationTimeout
    return t.migrationError
  }

  async function handleLegacyMigration() {
    if (migrationState.status === 'sending') return
    setMigrationState({ status: 'sending' })
    try {
      const result = await sendLegacyStorageToNewSite()
      setMigrationState({ status: 'success', ...result })
      showMessage(result.importedRecords || result.mergedRecords || result.importedLocalStorage ? formatMigrationSuccess(result) : t.migrationNoData)
    } catch (error) {
      setMigrationState({ status: 'error', errorCode: error?.code })
      showMessage(migrationErrorMessage(error))
    }
  }

  async function acceptLegacyMigration(messageData, source, origin) {
    try {
      const result = await importStorageSnapshot(messageData.snapshot)
      try {
        await refreshCollectionStateAfterMigration()
      } catch {
        showMessage(t.error)
      }
      setMigrationState({ status: 'success', ...result })
      showMessage(result.importedRecords || result.mergedRecords || result.importedLocalStorage ? formatMigrationSuccess(result) : t.migrationNoData)
      source?.postMessage({ type: LEGACY_IMPORT_RESPONSE, requestId: messageData.requestId, ok: true, result }, origin)
    } catch (error) {
      setMigrationState({ status: 'error', errorCode: error?.code })
      showMessage(migrationErrorMessage(error))
      source?.postMessage({ type: LEGACY_IMPORT_RESPONSE, requestId: messageData.requestId, ok: false, errorCode: error?.code || 'import-failed' }, origin)
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('niji-language', lang)
  }, [lang])

  useEffect(() => {
    const pageTitle = infoPage ? infoContent[lang][infoPage]?.label : null
    document.title = pageTitle ? `${pageTitle} · ${t.brand}` : `${t.brand} · Niji Diary`
  }, [infoPage, lang, t.brand])

  useEffect(() => {
    const syncDate = () => setDate(localDateKey())
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') syncDate() }
    const interval = window.setInterval(syncDate, 60_000)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    const syncHash = () => {
      const route = parseAppHash(location.hash)
      setActiveTab(route.tab)
      setInfoPage(route.infoPage)
      resetAppViewport(true)
    }
    window.addEventListener('hashchange', syncHash)
    if (!location.hash) window.history.replaceState(null, '', '#today')
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    if (QA_MODE || location.origin !== NEW_APP_ORIGIN) return undefined
    const handleLegacyMigration = (event) => {
      if (event.origin !== LEGACY_ORIGIN) return
      if (window.opener && event.source !== window.opener) return
      const messageData = event.data
      if (!messageData || messageData.type !== LEGACY_IMPORT_OFFER || typeof messageData.requestId !== 'string' || !messageData.snapshot) return
      if (incomingMigrationRequests.current.has(messageData.requestId)) return
      incomingMigrationRequests.current.add(messageData.requestId)
      void acceptLegacyMigration(messageData, event.source, event.origin)
    }
    window.addEventListener('message', handleLegacyMigration)
    window.opener?.postMessage({ type: LEGACY_IMPORT_READY }, LEGACY_ORIGIN)
    return () => window.removeEventListener('message', handleLegacyMigration)
  }, [date, lang])

  useEffect(() => {
    if (QA_MODE) {
      const qaPhotos = Object.fromEntries(COLOR_KEYS.map((key) => [key, './rainbow.svg']))
      const qaCompleted = QA_MODE === 'result' || QA_MODE === 'album'
      const qaDay = qaCompleted
        ? { schemaVersion: DEV_QUERY?.get('legacy') === '1' ? 4 : COMPLETED_DAY_SCHEMA_VERSION, date, polaroidImage: './rainbow.svg', caption: t.defaultCaption, completedAt: new Date().toISOString() }
        : { schemaVersion: 3, date, photos: qaPhotos, samples: FALLBACK_COLORS, completedAt: null }
      const qaAlbum = QA_MODE === 'album' ? Array.from({ length: 12 }, (_, index) => ({ ...qaDay, date: `2026-07-${String(13 - index).padStart(2, '0')}` })) : []
      setDay(qaDay)
      setDailyLocked(qaCompleted)
      if (QA_MODE === 'result') setDevelopedDay(qaDay)
      setHistory(QA_MODE === 'album' ? qaAlbum : QA_MODE === 'result' ? [qaDay] : [])
      setLoading(false)
      return undefined
    }
    let active = true
    const hydrationRequest = ++hydrationRequestRef.current
    setLoading(true)
    setFilmCollectionReady(false)
    hydrateCollectionState(date, lang).then((hydrated) => {
      if (!active || hydrationRequest !== hydrationRequestRef.current) return
      applyHydratedCollectionState(hydrated)
    }).catch(() => showMessage(translations[lang].error)).finally(() => {
      if (active && hydrationRequest === hydrationRequestRef.current) {
        setLoading(false)
        setFilmCollectionReady(true)
      }
    })
    return () => { active = false; clearTimeout(messageTimer.current) }
  }, [date])

  function navigate(tab) {
    setStaged(null)
    setSamplerOpen(false)
    setComposing(false)
    setActiveTab(tab)
    setInfoPage(null)
    location.hash = tab
    resetAppViewport(true)
  }

  function navigateInfo(page) {
    if (!INFO_PAGE_KEYS.includes(page)) return
    setActiveTab('settings')
    setInfoPage(page)
    location.hash = infoHash(page)
    resetAppViewport(true)
  }

  function closeInfo() {
    setActiveTab('settings')
    setInfoPage(null)
    location.hash = 'settings'
    resetAppViewport(true)
  }

  function selectFilm(filmId) {
    if (!filmCollectionReady || !filmCollection.unlockedFilmIds.includes(filmId) || filmCollection.selectedFilmId === filmId) return
    const nextFilmCollection = withoutFilmCollectionMeta(normalizeFilmCollection({ ...filmCollection, selectedFilmId: filmId }, history))
    rememberPendingFilmSelection(filmId)
    setFilmCollection(nextFilmCollection)
    saveFilmCollection(nextFilmCollection).then(() => clearPendingFilmSelection(filmId)).catch(() => showMessage(t.error))
  }

  async function handleCapture(file, input) {
    if (!file || dailyLocked) return
    setProcessing(true)
    try {
      const result = await processPhoto(file)
      setStaged(result)
      setSelectedColor(result.suggestedKey)
      navigator.vibrate?.(30)
    } catch { showMessage(t.photoError) }
    finally { setProcessing(false); if (input) input.value = '' }
  }

  async function confirmColor() {
    if (!staged || dailyLocked) return
    const nextDay = { ...day, schemaVersion: 3, photos: { ...photos, [selectedColor]: staged.image }, samples: { ...(day.samples ?? {}), [selectedColor]: staged.sampleColor } }
    setDay(nextDay)
    setStaged(null)
    setSamplerOpen(false)
    navigator.vibrate?.([25, 35, 25])
    showMessage(formatText(t.colorAdded, { color: t.colors[COLOR_KEYS.indexOf(selectedColor)] }))
    try { await Promise.all([saveDraft(nextDay), requestPersistentStorage()]) } catch { showMessage(t.error) }
    if (COLOR_KEYS.every((key) => nextDay.photos[key])) {
      setComposing(true)
      resetAppViewport()
    }
  }

  function resamplePhoto(image, point) {
    const analysis = sampleSourcePhoto(image, point)
    setStaged((current) => ({ ...current, ...analysis }))
    setSelectedColor(analysis.suggestedKey)
    navigator.vibrate?.(20)
  }

  async function removeColor(key) {
    if (!photos[key] || dailyLocked) return
    if (!window.confirm(formatText(t.removeConfirm, { color: t.colors[COLOR_KEYS.indexOf(key)] }))) return
    const nextPhotos = { ...photos }; delete nextPhotos[key]
    const nextSamples = { ...(day.samples ?? {}) }; delete nextSamples[key]
    const nextDay = { ...day, photos: nextPhotos, samples: nextSamples }
    setDay(nextDay)
    try { await saveDraft(nextDay) } catch { showMessage(t.error) }
  }

  async function handleBackground(file, input) {
    if (!file) return
    setProcessing(true)
    try {
      const result = await processPhoto(file)
      setBackground(result.image)
      navigator.vibrate?.(30)
    } catch { showMessage(t.photoError) }
    finally { setProcessing(false); if (input) input.value = '' }
  }

  async function finishRainbowCard() {
    if (!background || finishing || count !== 7 || dailyLocked) return
    setFinishing(true)
    try {
      const cardImage = await renderComposite(background, day.samples ?? {}, rainbowTransform)
      const renderSource = { ...day, date, cardImage, filmId: filmCollection.selectedFilmId || DEFAULT_FILM_ID, caption: day.caption ?? t.defaultCaption, composition: rainbowTransform, completedAt: new Date().toISOString() }
      const polaroidImage = await renderPolaroidImage(renderSource, lang, t.defaultCaption, false)
      const completedDay = createCompletedDayRecord(renderSource, polaroidImage)
      await completeDraft(completedDay, date)
      await requestPersistentStorage()
      const nextHistory = [completedDay, ...history.filter((item) => item.date !== date)]
      const nextFilmCollection = withoutFilmCollectionMeta(normalizeFilmCollection(filmCollection, nextHistory))
      const nextFilmNotifications = getFilmProgressChanges(history, nextHistory)
        .filter((notification) => !filmCollection.unlockedFilmIds.includes(notification.filmId))
        .map((notification) => ({ ...notification, id: `${completedDay.completedAt}-${notification.filmId}` }))
      await saveFilmCollection(nextFilmCollection)
      setDay(completedDay)
      setDailyLocked(true)
      setHistory(nextHistory)
      setFilmCollection(nextFilmCollection)
      if (nextFilmNotifications.length) setFilmNotifications((current) => [...current, ...nextFilmNotifications])
      setDevelopedDay(completedDay)
      setComposing(false)
      setBackground(null)
      navigator.vibrate?.([50, 50, 100])
      showMessage(t.rainbowCompleteToast)
      resetAppViewport()
    } catch { showMessage(t.error) }
    finally { setFinishing(false) }
  }

  function downloadPolaroid(dataUrl, target) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `niji-polaroid-${target.date}.jpg`
    link.click()
  }

  async function saveRainbowCard(target) {
    if (!target?.polaroidImage && !target?.cardImage) return
    setExporting(true)
    try {
      const polaroidImage = await getCompletedPolaroidImage(target, lang, t.defaultCaption)
      downloadPolaroid(polaroidImage, target)
      showMessage(t.imageSaved)
    } catch { showMessage(t.error) }
    finally { setExporting(false) }
  }

  async function shareRainbowCard(target) {
    if (!target?.polaroidImage && !target?.cardImage) return
    setExporting(true)
    try {
      const polaroidImage = await getCompletedPolaroidImage(target, lang, t.defaultCaption)
      const filename = `niji-polaroid-${target.date}.jpg`
      const file = dataUrlToFile(polaroidImage, filename)
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t.shareTitle, text: target.caption ?? t.defaultCaption })
        showMessage(t.shared)
      } else {
        downloadPolaroid(polaroidImage, target)
        showMessage(t.shareFallback)
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showMessage(t.shareError)
    }
    finally { setExporting(false) }
  }

  function updateDayCaption(targetDate, caption) {
    const update = (item) => item?.date === targetDate ? { ...item, caption } : item
    setDay((current) => update(current))
    setHistory((current) => current.map(update))
    setSelectedDay((current) => update(current))
    setDevelopedDay((current) => update(current))
  }

  function updateDraftCaption(caption) {
    setDay((current) => current ? { ...current, caption } : current)
  }

  async function persistDraftCaption(caption) {
    if (!day || dailyLocked) return
    const nextDay = { ...day, caption }
    setDay(nextDay)
    try { await saveDraft(nextDay) }
    catch { showMessage(t.error) }
  }

  async function persistCaption(target) {
    if (!target) return
    try { await saveDay(target); showMessage(t.captionSaved) }
    catch { showMessage(t.error) }
  }

  function requestDeletePolaroid(target) {
    setSelectedDay(null)
    setPendingDelete(target)
  }

  async function confirmDeletePolaroid() {
    const target = pendingDelete
    if (!target || deletingPolaroid) return
    setDeletingPolaroid(true)
    try {
      await deleteDay(target.date)
      setHistory((current) => current.filter((item) => item.date !== target.date))
      setSelectedDay((current) => current?.date === target.date ? null : current)
      setDevelopedDay((current) => current?.date === target.date ? null : current)
      if (target.date === date) setDay(createEmptyDraft())
      setPendingDelete(null)
      navigator.vibrate?.([35, 45, 35])
      showMessage(t.polaroidDeleted)
    } catch { showMessage(t.error) }
    finally { setDeletingPolaroid(false) }
  }

  function startCompose() {
    if (filmCollectionReady && count === 7 && !dailyLocked) {
      setComposing(true)
      resetAppViewport()
    }
  }

  function exitCompose() {
    setComposing(false)
    resetAppViewport()
  }

  const screen = infoPage
    ? <InfoScreen pageKey={infoPage} lang={lang} t={t} onBack={closeInfo} onNavigate={navigateInfo} />
    : activeTab === 'archive'
    ? <ArchiveScreen history={history} lang={lang} t={t} onOpen={setSelectedDay} onRequestDelete={requestDeletePolaroid} />
    : activeTab === 'films'
      ? <FilmsScreen completedDays={history} filmCollection={filmCollection} lang={lang} t={t} onSelectFilm={selectFilm} />
      : activeTab === 'settings'
      ? <SettingsScreen lang={lang} setLang={setLang} t={t} migrationEnabled={location.origin === LEGACY_ORIGIN} migrationState={migrationState} onMigrate={handleLegacyMigration} onOpenInfo={navigateInfo} />
      : staged
        ? <CaptureStage staged={staged} selectedColor={selectedColor} photos={photos} t={t} onSelect={setSelectedColor} onCancel={() => { setStaged(null); setSamplerOpen(false) }} onConfirm={confirmColor} onOpenSampler={() => setSamplerOpen(true)} />
        : composing
          ? <ComposeScreen background={background} photos={day?.photos ?? {}} samples={day?.samples ?? {}} caption={day?.caption ?? t.defaultCaption} date={date} transform={rainbowTransform} setTransform={setRainbowTransform} selectedFilmId={filmCollection.selectedFilmId} unlockedFilmIds={filmCollection.unlockedFilmIds} lang={lang} t={t} onCaptionChange={updateDraftCaption} onCaptionCommit={persistDraftCaption} onSelectFilm={selectFilm} onCapture={handleBackground} onBack={exitCompose} onFinish={finishRainbowCard} finishing={finishing} />
          : <TodayScreen day={day} count={count} date={date} lang={lang} t={t} loading={loading} dailyLocked={dailyLocked} onCapture={handleCapture} onRemove={removeColor} onStartCompose={startCompose} />

  const immersiveEditor = activeTab === 'today' && composing && !staged

  if (loading && !day) return <BootSplash label={t.brand} />

  return <div className="app-environment">
    <div className="ambient-bubble bubble-one" /><div className="ambient-bubble bubble-two" />
    <div className={`app-shell ${immersiveEditor ? 'immersive-editor' : ''}`}>
      <a className="skip-link" href="#app-content" onClick={(event) => { event.preventDefault(); document.querySelector('#app-content')?.focus() }}>{t.skip}</a>
      {!immersiveEditor ? <header className="app-header"><button className="app-logo" type="button" onClick={() => navigate('today')} aria-label={t.brand}><img className="app-brand-mark" src="./logo.svg" alt="" aria-hidden="true" /><span><b>NIJI</b><small>{t.brand}</small></span></button></header> : null}
      <main id="app-content" className="app-content" tabIndex="-1">{screen}</main>
      {!immersiveEditor ? <nav className="bottom-nav" aria-label={t.mainNavigation}>{TAB_KEYS.map((key) => <button type="button" key={key} className={activeTab === key ? 'active' : ''} aria-current={activeTab === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={key === 'today' ? 'camera' : key === 'archive' ? 'book' : key === 'films' ? 'film' : 'gear'} /><span>{t.tabs[key]}</span></button>)}</nav> : null}
      {processing ? <div className="processing-overlay" role="status"><div className="scanner"><Icon name="sparkle" size={32} /></div><strong>{t.analyzing}</strong><span>{t.analyzingHint}</span></div> : null}
      <div className={`toast ${message ? 'show' : ''}`} aria-live="polite">{message}</div>
    </div>
    {samplerOpen && staged ? <FullscreenSampler staged={staged} t={t} onClose={() => setSamplerOpen(false)} onSample={resamplePhoto} /> : null}
    <RainbowModal day={selectedDay} lang={lang} t={t} exporting={exporting} onClose={() => setSelectedDay(null)} onSave={() => saveRainbowCard(selectedDay)} onShare={() => shareRainbowCard(selectedDay)} onCaptionChange={(caption) => updateDayCaption(selectedDay.date, caption)} onCaptionCommit={() => persistCaption(selectedDay)} />
    <DeletePolaroidDialog day={pendingDelete} lang={lang} t={t} deleting={deletingPolaroid} onCancel={() => { if (!deletingPolaroid) setPendingDelete(null) }} onConfirm={confirmDeletePolaroid} />
    <DevelopedCard day={developedDay} lang={lang} t={t} exporting={exporting} onSave={() => saveRainbowCard(developedDay)} onShare={() => shareRainbowCard(developedDay)} onDone={() => setDevelopedDay(null)} onCaptionChange={(caption) => updateDayCaption(developedDay.date, caption)} onCaptionCommit={() => persistCaption(developedDay)} />
    {filmNotifications[0] ? <FilmProgressBookmark key={filmNotifications[0].id} notification={filmNotifications[0]} lang={lang} t={t} offsetForNavigation={!immersiveEditor} onDismiss={() => setFilmNotifications((current) => current.slice(1))} /> : null}
  </div>
}
