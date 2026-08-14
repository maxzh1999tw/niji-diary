import { COLOR_KEYS, rgbToOklch } from './colorAnalysis.js'

export const DEFAULT_FILM_ID = 'classic-white'
export const FILM_COLLECTION_SCHEMA_VERSION = 1

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_IN_MS = 86_400_000

export const FILMS = [
  {
    id: DEFAULT_FILM_ID,
    className: 'film-classic-white',
    nameKey: 'filmClassicName',
    conditionKey: 'filmClassicCondition',
    unlock: { type: 'always', target: 0 },
    paper: { top: '#ffffff', middle: '#fdfcf9', bottom: '#f5f3ee', accent: '#d7d0dc' },
    artwork: [],
  },
  {
    id: 'sky-blue',
    className: 'film-sky-blue',
    nameKey: 'filmSkyBlueName',
    conditionKey: 'filmSkyBlueCondition',
    unlock: { type: 'completed-count', target: 1 },
    paper: { top: '#f3fcff', middle: '#d9f6ff', bottom: '#bfeaf5', accent: '#56c9df' },
    artwork: [
      { type: 'circle', cx: 88, cy: 1305, radius: 26, opacity: 0.42 },
      { type: 'circle', cx: 134, cy: 1322, radius: 38, opacity: 0.42 },
      { type: 'circle', cx: 180, cy: 1308, radius: 23, opacity: 0.42 },
      { type: 'circle', cx: 840, cy: 1368, radius: 30, opacity: 0.42 },
      { type: 'circle', cx: 895, cy: 1350, radius: 45, opacity: 0.42 },
      { type: 'circle', cx: 945, cy: 1372, radius: 24, opacity: 0.42 },
    ],
  },
  {
    id: 'pink-pop',
    className: 'film-pink-pop',
    nameKey: 'filmPinkName',
    conditionKey: 'filmPinkCondition',
    unlock: { type: 'consecutive-days', target: 3 },
    paper: { top: '#fff7fc', middle: '#ffe1f0', bottom: '#ffc6df', accent: '#f17aae' },
    artwork: [
      { type: 'rect', cx: 78, cy: 1290, width: 12, height: 44, rotation: -20, opacity: 0.42 },
      { type: 'rect', cx: 145, cy: 1370, width: 12, height: 44, rotation: 37, opacity: 0.42 },
      { type: 'rect', cx: 240, cy: 1325, width: 12, height: 44, rotation: -43, opacity: 0.42 },
      { type: 'rect', cx: 800, cy: 1322, width: 12, height: 44, rotation: 29, opacity: 0.42 },
      { type: 'rect', cx: 884, cy: 1382, width: 12, height: 44, rotation: -26, opacity: 0.42 },
      { type: 'rect', cx: 950, cy: 1285, width: 12, height: 44, rotation: 20, opacity: 0.42 },
      { type: 'circle', cx: 105, cy: 1390, radius: 10, opacity: 0.65 },
      { type: 'circle', cx: 205, cy: 1288, radius: 10, opacity: 0.65 },
      { type: 'circle', cx: 830, cy: 1288, radius: 10, opacity: 0.65 },
      { type: 'circle', cx: 915, cy: 1322, radius: 10, opacity: 0.65 },
    ],
  },
  {
    id: 'mint-green',
    className: 'film-mint-green',
    nameKey: 'filmMintGreenName',
    conditionKey: 'filmMintGreenCondition',
    unlock: { type: 'all-green-rainbow', target: 1 },
    paper: { top: '#f8fff6', middle: '#e1f7d9', bottom: '#c5eac0', accent: '#73bd7d' },
    artwork: [
      { type: 'ellipse', cx: 92, cy: 1320, radiusX: 13, radiusY: 29, rotation: -37, opacity: 0.42 },
      { type: 'ellipse', cx: 155, cy: 1370, radiusX: 13, radiusY: 29, rotation: 20, opacity: 0.42 },
      { type: 'ellipse', cx: 870, cy: 1320, radiusX: 13, radiusY: 29, rotation: 32, opacity: 0.42 },
      { type: 'ellipse', cx: 935, cy: 1370, radiusX: 13, radiusY: 29, rotation: -23, opacity: 0.42 },
    ],
  },
]

const FILM_BY_ID = new Map(FILMS.map((film) => [film.id, film]))

export function getFilm(id) {
  return FILM_BY_ID.get(id) ?? FILM_BY_ID.get(DEFAULT_FILM_ID)
}

function completedDates(completedDays = []) {
  return [...new Set(completedDays
    .filter((day) => DATE_PATTERN.test(day?.date ?? '') && day.completedAt)
    .map((day) => day.date))].sort()
}

function isNextDay(previousDate, currentDate) {
  const previous = Date.parse(`${previousDate}T12:00:00Z`)
  const current = Date.parse(`${currentDate}T12:00:00Z`)
  return Number.isFinite(previous) && Number.isFinite(current) && current - previous === DAY_IN_MS
}

export function getLongestCompletionStreak(completedDays = []) {
  let longest = 0
  let streak = 0
  let previousDate = null

  for (const date of completedDates(completedDays)) {
    streak = previousDate && isNextDay(previousDate, date) ? streak + 1 : 1
    longest = Math.max(longest, streak)
    previousDate = date
  }

  return longest
}

function parseColor(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  const hex = normalized.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (hex) {
    const value = hex[1].length === 3 ? hex[1].split('').map((channel) => `${channel}${channel}`).join('') : hex[1]
    return [Number.parseInt(value.slice(0, 2), 16), Number.parseInt(value.slice(2, 4), 16), Number.parseInt(value.slice(4, 6), 16)]
  }

  const rgb = normalized.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
  if (!rgb) return null
  return rgb.slice(1, 4).map((channel) => Math.max(0, Math.min(255, Number(channel))))
}

export function isGreenSpectrumColor(value) {
  const rgb = parseColor(value)
  if (!rgb || rgb.some((channel) => !Number.isFinite(channel))) return false
  const { hue, chroma } = rgbToOklch(...rgb)
  return chroma >= 0.025 && hue >= 105 && hue <= 195
}

export function isAllGreenRainbow(day) {
  if (typeof day?.achievements?.allGreenRainbow === 'boolean') return day.achievements.allGreenRainbow
  return COLOR_KEYS.every((key) => Boolean(day?.photos?.[key]) && isGreenSpectrumColor(day?.samples?.[key]))
}

function countAllGreenRainbows(completedDays) {
  return completedDays.filter((day) => isAllGreenRainbow(day)).length
}

export function getFilmProgress(film, completedDays = []) {
  const target = film.unlock.target
  let current = 0

  if (film.unlock.type === 'completed-count') current = completedDates(completedDays).length
  if (film.unlock.type === 'consecutive-days') current = getLongestCompletionStreak(completedDays)
  if (film.unlock.type === 'all-green-rainbow') current = countAllGreenRainbows(completedDays)
  if (film.unlock.type === 'always') current = target

  return { current: Math.min(current, target), target, met: current >= target }
}

export function getFilmProgressChanges(previousCompletedDays = [], nextCompletedDays = []) {
  return FILMS.flatMap((film) => {
    if (film.unlock.type === 'always') return []
    const previous = getFilmProgress(film, previousCompletedDays)
    const next = getFilmProgress(film, nextCompletedDays)
    if (next.current <= previous.current) return []
    return [{
      filmId: film.id,
      previous: previous.current,
      current: next.current,
      target: next.target,
      unlocked: !previous.met && next.met,
    }]
  })
}

export function getDerivedUnlockedFilmIds(completedDays = []) {
  return FILMS
    .filter((film) => getFilmProgress(film, completedDays).met)
    .map((film) => film.id)
}

function sameArray(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function normalizeFilmCollection(record, completedDays = []) {
  const storedIds = Array.isArray(record?.unlockedFilmIds)
    ? record.unlockedFilmIds.filter((id) => typeof id === 'string')
    : []
  const unlockedFilmIds = []
  for (const id of [DEFAULT_FILM_ID, ...storedIds, ...getDerivedUnlockedFilmIds(completedDays)]) {
    if (!unlockedFilmIds.includes(id)) unlockedFilmIds.push(id)
  }
  const selectedFilmId = unlockedFilmIds.includes(record?.selectedFilmId) ? record.selectedFilmId : DEFAULT_FILM_ID
  const needsSave = !record
    || record.schemaVersion !== FILM_COLLECTION_SCHEMA_VERSION
    || !sameArray(storedIds, unlockedFilmIds)
    || record.selectedFilmId !== selectedFilmId

  return { schemaVersion: FILM_COLLECTION_SCHEMA_VERSION, unlockedFilmIds, selectedFilmId, needsSave }
}
