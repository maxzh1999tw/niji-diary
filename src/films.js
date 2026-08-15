import { COLOR_KEYS, rgbToOklch } from './colorAnalysis.js'

export const DEFAULT_FILM_ID = 'classic-white'
export const FILM_COLLECTION_SCHEMA_VERSION = 1
export const FILM_CHALLENGE_VERSION = 1

export const FILM_CHALLENGE_RULES = Object.freeze({
  mistTransparency: 0.55,
  compactArcDegrees: 60,
  expandedRadius: 1.5,
  boldColorBands: 1.5,
})

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
      { type: 'circle', layer: 'foreground', cx: 32, cy: 190, radius: 29, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.34 },
      { type: 'circle', layer: 'foreground', cx: 27, cy: 510, radius: 17, opacity: 0.24 },
      { type: 'circle', layer: 'foreground', cx: 35, cy: 870, radius: 24, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.3 },
      { type: 'circle', layer: 'foreground', cx: 968, cy: 330, radius: 26, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.32 },
      { type: 'circle', layer: 'foreground', cx: 973, cy: 650, radius: 17, opacity: 0.24 },
      { type: 'circle', layer: 'foreground', cx: 966, cy: 1000, radius: 32, fill: 'none', stroke: 'accent', strokeWidth: 9, opacity: 0.34 },
      { type: 'circle', cx: 78, cy: 1334, radius: 32, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.3 },
      { type: 'circle', cx: 143, cy: 1380, radius: 48, fill: 'none', stroke: 'accent', strokeWidth: 10, opacity: 0.26 },
      { type: 'circle', cx: 205, cy: 1305, radius: 15, opacity: 0.22 },
      { type: 'circle', cx: 818, cy: 1375, radius: 55, fill: 'none', stroke: 'accent', strokeWidth: 11, opacity: 0.28 },
      { type: 'circle', cx: 930, cy: 1298, radius: 27, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.3 },
      { type: 'circle', cx: 910, cy: 1395, radius: 16, opacity: 0.22 },
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
  {
    id: 'letterpress-ochre',
    className: 'film-letterpress-ochre',
    nameKey: 'filmLetterpressName',
    conditionKey: 'filmLetterpressCondition',
    challengeTool: 'caption',
    unlock: { type: 'achievement', achievement: 'customCaption', target: 1 },
    paper: { top: '#fff9e8', middle: '#ead7b3', bottom: '#d7b081', accent: '#24324a' },
    ink: { primary: '#24324a', secondary: '#354159' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M 8 88 H 58 M 8 88 V 154 M 8 444 H 52 M 8 444 V 510 M 8 800 H 58 M 8 800 V 866', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.72 },
      { type: 'path', layer: 'foreground', d: 'M 992 188 H 942 M 992 188 V 254 M 992 602 H 948 M 992 602 V 668 M 992 1010 H 942 M 992 1010 V 1076', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.72 },
      { type: 'rect', layer: 'foreground', cx: 24, cy: 290, width: 24, height: 84, rotation: -2, fill: '#a94f3d', opacity: 0.64 },
      { type: 'rect', layer: 'foreground', cx: 976, cy: 390, width: 24, height: 84, rotation: 2, fill: '#a94f3d', opacity: 0.64 },
      { type: 'rect', layer: 'foreground', cx: 24, cy: 650, width: 13, height: 58, rotation: 1, fill: '#a94f3d', opacity: 0.52 },
      { type: 'rect', layer: 'foreground', cx: 976, cy: 820, width: 13, height: 58, rotation: -1, fill: '#a94f3d', opacity: 0.52 },
      { type: 'path', d: 'M 18 1464 H 44 V 1398 M 30 1476 H 58', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.66 },
      { type: 'path', d: 'M 982 1464 H 956 V 1398 M 970 1476 H 942', fill: 'none', stroke: '#a94f3d', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.6 },
    ],
  },
  {
    id: 'vellum-mist',
    className: 'film-vellum-mist',
    nameKey: 'filmVellumName',
    conditionKey: 'filmVellumCondition',
    challengeTool: 'transparency',
    unlock: { type: 'achievement', achievement: 'mistTransparency', target: 1 },
    paper: { top: '#fcfbf7', middle: '#e8e3f2', bottom: '#d9edea', accent: '#73689b' },
    ink: { primary: '#322a46', secondary: '#554f6b' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M -46 58 L 82 -12 L 55 382 L -34 520 Z', fill: '#b7a8d8', opacity: 0.34 },
      { type: 'path', layer: 'foreground', d: 'M -24 246 L 74 174 L 48 704 L -42 792 Z', fill: '#9dcbc3', opacity: 0.28 },
      { type: 'path', layer: 'foreground', d: 'M 1048 112 L 930 -18 L 948 448 L 1038 562 Z', fill: '#c7badf', opacity: 0.34 },
      { type: 'path', layer: 'foreground', d: 'M 1028 520 L 940 426 L 956 1052 L 1046 1142 Z', fill: '#8fbfb7', opacity: 0.26 },
      { type: 'path', layer: 'foreground', d: 'M 12 64 L 62 34 L 42 1142', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.42 },
      { type: 'path', layer: 'foreground', d: 'M 988 112 L 946 60 L 960 1112', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.38 },
      { type: 'path', d: 'M -20 1452 L 188 1468 L 116 1518 L -20 1518 Z', fill: '#b7a8d8', opacity: 0.34 },
      { type: 'path', d: 'M 1020 1440 L 824 1474 L 902 1524 L 1020 1524 Z', fill: '#9dcbc3', opacity: 0.32 },
    ],
  },
  {
    id: 'comet-orange',
    className: 'film-comet-orange',
    nameKey: 'filmCometName',
    conditionKey: 'filmCometCondition',
    challengeTool: 'angle',
    unlock: { type: 'achievement', achievement: 'compactArc', target: 1 },
    paper: { top: '#fff2d2', middle: '#efa257', bottom: '#d47752', accent: '#3a2845' },
    ink: { primary: '#251b2e', secondary: '#251b2e' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M -68 1118 C 118 994 130 730 48 470 C 8 342 24 194 90 68', fill: 'none', stroke: 'accent', strokeWidth: 34, strokeLinecap: 'round', opacity: 0.28 },
      { type: 'path', layer: 'foreground', d: 'M -54 1120 C 122 1000 140 742 60 478 C 22 350 38 210 96 86', fill: 'none', stroke: '#fff3d8', strokeWidth: 8, strokeLinecap: 'round', opacity: 0.72 },
      { type: 'path', layer: 'foreground', d: 'M 1064 244 C 890 350 894 626 966 822 C 1010 944 1000 1060 936 1160', fill: 'none', stroke: 'accent', strokeWidth: 28, strokeLinecap: 'round', opacity: 0.24 },
      { type: 'path', d: 'M 242 1346 C 492 1264 764 1272 1028 1184 L 1010 1242 C 754 1322 508 1324 278 1388 Z', fill: '#3a2845', opacity: 0.2 },
      { type: 'path', d: 'M 278 1350 C 520 1288 744 1290 966 1224', fill: 'none', stroke: '#fff0cd', strokeWidth: 10, strokeLinecap: 'round', opacity: 0.64 },
      { type: 'rect', layer: 'foreground', cx: 26, cy: 280, width: 42, height: 8, rotation: -18, opacity: 0.52 },
      { type: 'rect', layer: 'foreground', cx: 28, cy: 330, width: 28, height: 8, rotation: -18, opacity: 0.42 },
      { type: 'rect', layer: 'foreground', cx: 974, cy: 930, width: 42, height: 8, rotation: 18, opacity: 0.52 },
      { type: 'rect', layer: 'foreground', cx: 972, cy: 980, width: 28, height: 8, rotation: 18, opacity: 0.42 },
    ],
  },
  {
    id: 'eclipse-silver',
    className: 'film-eclipse-silver',
    nameKey: 'filmEclipseName',
    conditionKey: 'filmEclipseCondition',
    challengeTool: 'radius',
    unlock: { type: 'achievement', achievement: 'expandedRadius', target: 1 },
    paper: { top: '#171923', middle: '#24283b', bottom: '#0d0f16', accent: '#c9d6f2' },
    ink: { primary: '#f8f5ea', secondary: '#cdd1dd' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M -124 196 C 92 76 126 396 -18 574', fill: 'none', stroke: 'accent', strokeWidth: 12, strokeLinecap: 'round', opacity: 0.76 },
      { type: 'path', layer: 'foreground', d: 'M -100 232 C 58 148 82 382 -10 522', fill: 'none', stroke: '#7483a5', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.7 },
      { type: 'path', layer: 'foreground', d: 'M 1120 574 C 904 438 900 788 1018 982', fill: 'none', stroke: 'accent', strokeWidth: 12, strokeLinecap: 'round', opacity: 0.74 },
      { type: 'path', layer: 'foreground', d: 'M 1096 614 C 944 518 936 770 1010 930', fill: 'none', stroke: '#7483a5', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.7 },
      { type: 'rect', layer: 'foreground', cx: 18, cy: 720, width: 30, height: 7, rotation: 0, opacity: 0.52 },
      { type: 'rect', layer: 'foreground', cx: 18, cy: 770, width: 18, height: 7, rotation: 0, opacity: 0.42 },
      { type: 'rect', layer: 'foreground', cx: 982, cy: 250, width: 30, height: 7, rotation: 0, opacity: 0.52 },
      { type: 'rect', layer: 'foreground', cx: 982, cy: 300, width: 18, height: 7, rotation: 0, opacity: 0.42 },
      { type: 'rect', cx: 120, cy: 1473, width: 44, height: 8, rotation: 0, opacity: 0.34 },
      { type: 'rect', cx: 288, cy: 1473, width: 26, height: 8, rotation: 0, opacity: 0.24 },
      { type: 'rect', cx: 500, cy: 1473, width: 58, height: 8, rotation: 0, opacity: 0.38 },
      { type: 'rect', cx: 712, cy: 1473, width: 26, height: 8, rotation: 0, opacity: 0.24 },
      { type: 'rect', cx: 880, cy: 1473, width: 44, height: 8, rotation: 0, opacity: 0.34 },
    ],
  },
  {
    id: 'fourfold-light',
    className: 'film-fourfold-light',
    nameKey: 'filmFourfoldName',
    conditionKey: 'filmFourfoldCondition',
    challengeTool: 'colorWidth',
    unlock: { type: 'achievement', achievement: 'boldColorBands', target: 1 },
    paper: { top: '#fcf6e8', middle: '#efe6d3', bottom: '#dbccb2', accent: '#1f2b45' },
    ink: { primary: '#1f2b45', secondary: '#394760' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M -22 -18 H 184 C 116 48 84 120 48 252 L -22 300 Z', fill: '#e98c78', opacity: 0.76 },
      { type: 'path', layer: 'foreground', d: 'M 1022 -18 H 822 C 904 66 934 146 954 294 L 1022 330 Z', fill: '#e6b84a', opacity: 0.78 },
      { type: 'path', layer: 'foreground', d: 'M 1022 1124 C 942 1052 914 940 950 806 L 1022 760 Z', fill: '#3d8f87', opacity: 0.76 },
      { type: 'path', layer: 'foreground', d: 'M -22 1138 C 72 1068 90 938 48 820 L -22 782 Z', fill: '#59517d', opacity: 0.78 },
      { type: 'path', d: 'M 46 1360 C 270 1324 724 1324 954 1360', fill: 'none', stroke: 'accent', strokeWidth: 6, strokeLinecap: 'round', opacity: 0.38 },
      { type: 'rect', cx: 250, cy: 1346, width: 8, height: 30, rotation: -5, opacity: 0.34 },
      { type: 'rect', cx: 500, cy: 1338, width: 8, height: 38, rotation: 0, opacity: 0.42 },
      { type: 'rect', cx: 750, cy: 1346, width: 8, height: 30, rotation: 5, opacity: 0.34 },
      { type: 'path', d: 'M -16 1450 C 72 1378 148 1390 210 1508 H -16 Z', fill: '#59517d', opacity: 0.3 },
      { type: 'path', d: 'M 1016 1450 C 928 1378 852 1390 790 1508 H 1016 Z', fill: '#3d8f87', opacity: 0.28 },
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

export function createFilmChallenges(day, defaultCaption = '') {
  const caption = typeof day?.caption === 'string' ? day.caption.trim() : ''
  const defaultText = typeof defaultCaption === 'string' ? defaultCaption.trim() : ''
  const hasOwnWords = caption.replace(/\s/gu, '').length > 0 && caption !== defaultText
  const transparency = day?.composition?.transparency
  const angle = day?.composition?.angle
  const radius = day?.composition?.radius
  const colorWidth = day?.composition?.colorWidth

  return {
    version: FILM_CHALLENGE_VERSION,
    customCaption: hasOwnWords,
    mistTransparency: Number.isFinite(transparency) && transparency >= FILM_CHALLENGE_RULES.mistTransparency,
    compactArc: Number.isFinite(angle) && angle >= 10 && angle <= FILM_CHALLENGE_RULES.compactArcDegrees,
    expandedRadius: Number.isFinite(radius) && radius >= FILM_CHALLENGE_RULES.expandedRadius,
    boldColorBands: Number.isFinite(colorWidth) && colorWidth >= FILM_CHALLENGE_RULES.boldColorBands,
  }
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

function getStoredFilmChallenges(day) {
  const challenges = day?.achievements?.filmChallenges
  return challenges?.version === FILM_CHALLENGE_VERSION ? challenges : null
}

function countFilmAchievement(completedDays, achievement) {
  let count = 0
  for (const day of completedDays) {
    if (getStoredFilmChallenges(day)?.[achievement] === true) count += 1
  }
  return count
}

export function getFilmProgress(film, completedDays = []) {
  const target = film.unlock.target
  let current = 0

  if (film.unlock.type === 'completed-count') current = completedDates(completedDays).length
  if (film.unlock.type === 'consecutive-days') current = getLongestCompletionStreak(completedDays)
  if (film.unlock.type === 'all-green-rainbow') current = countAllGreenRainbows(completedDays)
  if (film.unlock.type === 'achievement') current = countFilmAchievement(completedDays, film.unlock.achievement)
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
