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
      { type: 'path', d: 'M -35 24 C 35 -6 95 50 170 22 S 310 -5 390 24', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinecap: 'round', opacity: 0.28 },
      { type: 'path', d: 'M 610 23 C 690 -7 755 48 830 21 S 970 -5 1035 25', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinecap: 'round', opacity: 0.28 },
      { type: 'circle', cx: 92, cy: 1338, radius: 44, fill: 'none', stroke: 'accent', strokeWidth: 10, opacity: 0.34 },
      { type: 'path', d: 'M 67 1323 C 75 1307 91 1299 108 1303', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.5 },
      { type: 'circle', cx: 175, cy: 1398, radius: 18, opacity: 0.22 },
      { type: 'circle', cx: 858, cy: 1362, radius: 58, fill: 'none', stroke: 'accent', strokeWidth: 11, opacity: 0.32 },
      { type: 'path', d: 'M 824 1343 C 837 1322 857 1313 878 1318', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.48 },
      { type: 'circle', cx: 956, cy: 1288, radius: 24, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.3 },
      { type: 'path', d: 'M 260 1380 C 335 1340 405 1415 480 1375 S 630 1340 710 1382', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinecap: 'round', opacity: 0.24 },
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
      { type: 'rect', layer: 'foreground', cx: 34, cy: 170, width: 21, height: 68, rotation: -24, opacity: 0.6 },
      { type: 'circle', layer: 'foreground', cx: 30, cy: 390, radius: 19, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.65 },
      { type: 'rect', layer: 'foreground', cx: 35, cy: 690, width: 21, height: 68, rotation: 31, opacity: 0.58 },
      { type: 'path', layer: 'foreground', d: 'M 13 938 L 34 912 L 55 938 L 34 964 Z', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinejoin: 'round', opacity: 0.62 },
      { type: 'rect', layer: 'foreground', cx: 966, cy: 260, width: 21, height: 68, rotation: 24, opacity: 0.6 },
      { type: 'path', layer: 'foreground', d: 'M 945 520 L 966 494 L 987 520 L 966 546 Z', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinejoin: 'round', opacity: 0.62 },
      { type: 'circle', layer: 'foreground', cx: 970, cy: 820, radius: 19, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.65 },
      { type: 'rect', layer: 'foreground', cx: 965, cy: 1040, width: 21, height: 68, rotation: -31, opacity: 0.58 },
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
      { type: 'path', d: 'M 332 1342 L 346 1364 L 371 1367 L 353 1385 L 358 1410 L 334 1399 L 312 1412 L 315 1386 L 296 1369 L 321 1365 Z', fill: 'none', stroke: 'accent', strokeWidth: 8, strokeLinejoin: 'round', opacity: 0.36 },
      { type: 'path', d: 'M 665 1405 C 628 1373 647 1334 681 1353 C 715 1319 755 1351 737 1388 C 724 1411 693 1426 665 1405 Z', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinejoin: 'round', opacity: 0.38 },
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
      { type: 'path', layer: 'foreground', d: 'M 17 -15 C 8 210 67 370 20 575 C -7 690 9 820 43 1015', fill: 'none', stroke: 'accent', strokeWidth: 10, strokeLinecap: 'round', opacity: 0.5 },
      { type: 'ellipse', layer: 'foreground', cx: 34, cy: 168, radiusX: 24, radiusY: 42, rotation: -40, opacity: 0.6 },
      { type: 'ellipse', layer: 'foreground', cx: 38, cy: 365, radiusX: 23, radiusY: 40, rotation: 42, opacity: 0.54 },
      { type: 'ellipse', layer: 'foreground', cx: 31, cy: 626, radiusX: 24, radiusY: 43, rotation: -38, opacity: 0.6 },
      { type: 'ellipse', layer: 'foreground', cx: 39, cy: 875, radiusX: 23, radiusY: 40, rotation: 40, opacity: 0.54 },
      { type: 'path', layer: 'foreground', d: 'M 983 -15 C 992 220 933 390 980 590 C 1008 705 991 838 957 1055', fill: 'none', stroke: 'accent', strokeWidth: 10, strokeLinecap: 'round', opacity: 0.5 },
      { type: 'ellipse', layer: 'foreground', cx: 966, cy: 245, radiusX: 24, radiusY: 42, rotation: 40, opacity: 0.6 },
      { type: 'ellipse', layer: 'foreground', cx: 962, cy: 465, radiusX: 23, radiusY: 40, rotation: -42, opacity: 0.54 },
      { type: 'ellipse', layer: 'foreground', cx: 969, cy: 720, radiusX: 24, radiusY: 43, rotation: 38, opacity: 0.6 },
      { type: 'ellipse', layer: 'foreground', cx: 961, cy: 955, radiusX: 23, radiusY: 40, rotation: -40, opacity: 0.54 },
      { type: 'ellipse', cx: 92, cy: 1320, radiusX: 13, radiusY: 29, rotation: -37, opacity: 0.42 },
      { type: 'ellipse', cx: 155, cy: 1370, radiusX: 13, radiusY: 29, rotation: 20, opacity: 0.42 },
      { type: 'ellipse', cx: 870, cy: 1320, radiusX: 13, radiusY: 29, rotation: 32, opacity: 0.42 },
      { type: 'ellipse', cx: 935, cy: 1370, radiusX: 13, radiusY: 29, rotation: -23, opacity: 0.42 },
      { type: 'path', d: 'M 62 1408 C 210 1328 338 1435 493 1374 C 645 1314 778 1426 950 1350', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinecap: 'round', opacity: 0.38 },
      { type: 'ellipse', cx: 330, cy: 1381, radiusX: 15, radiusY: 34, rotation: -58, opacity: 0.38 },
      { type: 'ellipse', cx: 530, cy: 1363, radiusX: 15, radiusY: 34, rotation: 55, opacity: 0.38 },
      { type: 'ellipse', cx: 728, cy: 1378, radiusX: 15, radiusY: 34, rotation: -55, opacity: 0.38 },
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
