import { COLOR_KEYS, rgbToOklch } from './colorAnalysis.js'

export const DEFAULT_FILM_ID = 'classic-white'
export const DEFAULT_LAYOUT_ID = 'classic'
export const MOSAIC_LAYOUT_ID = 'mosaic-seven'
export const FILM_COLLECTION_SCHEMA_VERSION = 2
export const FILM_CHALLENGE_VERSION = 1
export const FILM_DAYPART_KEYS = Object.freeze(['morning', 'midday', 'night'])

export const FILM_CHALLENGE_RULES = Object.freeze({
  mistTransparency: 0.55,
  compactArcDegrees: 60,
  expandedRadius: 1.5,
})

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_IN_MS = 86_400_000
const FILM_ID_ALIASES = Object.freeze({ 'fourfold-light': 'threefold-light' })
const FILM_DAYPART_ALIASES = Object.freeze({
  morning: 'morning',
  midday: 'midday',
  noon: 'midday',
  daytime: 'midday',
  afternoon: 'midday',
  night: 'night',
  evening: 'night',
  'late-night': 'night',
})

export const FILMS = [
  {
    id: DEFAULT_FILM_ID,
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
    className: 'film-classic-white',
    nameKey: 'filmClassicName',
    conditionKey: 'filmClassicCondition',
    unlock: { type: 'always', target: 0 },
    paper: { top: '#ffffff', middle: '#fdfcf9', bottom: '#f5f3ee', accent: '#d7d0dc' },
    artwork: [],
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'circle', layer: 'foreground', cx: 884, cy: 84, radius: 22, fill: 'none', stroke: 'accent', strokeWidth: 6, opacity: 0.62 },
        { type: 'path', layer: 'foreground', d: 'M 916 110 L 954 148', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.48 },
        { type: 'circle', layer: 'foreground', cx: 934, cy: 220, radius: 13, opacity: 0.24 },
        { type: 'path', layer: 'foreground', d: 'M 304 52 V 274', fill: 'none', stroke: 'accent', strokeWidth: 4, strokeLinecap: 'round', opacity: 0.3 },
        { type: 'circle', layer: 'foreground', cx: 20, cy: 386, radius: 14, fill: 'none', stroke: 'accent', strokeWidth: 5, opacity: 0.34 },
        { type: 'circle', layer: 'foreground', cx: 350, cy: 1180, radius: 11, fill: 'none', stroke: 'accent', strokeWidth: 4, opacity: 0.28 },
        { type: 'path', layer: 'foreground', d: 'M 344 1354 C 402 1326 458 1328 516 1354', fill: 'none', stroke: 'accent', strokeWidth: 4, strokeLinecap: 'round', opacity: 0.3 },
        { type: 'circle', layer: 'foreground', cx: 24, cy: 1430, radius: 12, opacity: 0.24 },
        { type: 'path', layer: 'foreground', d: 'M 969 1416 L 989 1436 L 969 1456', fill: 'none', stroke: 'accent', strokeWidth: 4, strokeLinejoin: 'round', opacity: 0.34 },
      ],
    },
  },
  {
    id: 'sky-blue',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'circle', layer: 'foreground', cx: 886, cy: 88, radius: 22, fill: 'none', stroke: 'accent', strokeWidth: 7, opacity: 0.34 },
        { type: 'circle', layer: 'foreground', cx: 932, cy: 148, radius: 15, opacity: 0.24 },
        { type: 'circle', layer: 'foreground', cx: 878, cy: 216, radius: 29, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.3 },
        { type: 'circle', layer: 'foreground', cx: 923, cy: 274, radius: 10, opacity: 0.22 },
        { type: 'circle', layer: 'foreground', cx: 20, cy: 428, radius: 14, fill: 'none', stroke: 'accent', strokeWidth: 7, opacity: 0.28 },
        { type: 'circle', layer: 'foreground', cx: 20, cy: 1018, radius: 19, opacity: 0.2 },
        { type: 'path', layer: 'foreground', d: 'M 304 326 C 298 420 310 506 304 610', fill: 'none', stroke: 'accent', strokeWidth: 6, strokeLinecap: 'round', opacity: 0.22 },
        { type: 'path', layer: 'foreground', d: 'M 340 1352 C 432 1320 518 1378 608 1346 C 690 1318 772 1362 862 1332', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.24 },
        { type: 'circle', layer: 'foreground', cx: 916, cy: 1328, radius: 17, fill: 'none', stroke: 'accent', strokeWidth: 7, opacity: 0.24 },
        { type: 'circle', layer: 'foreground', cx: 24, cy: 1430, radius: 16, fill: 'none', stroke: 'accent', strokeWidth: 7, opacity: 0.26 },
        { type: 'circle', layer: 'foreground', cx: 978, cy: 1442, radius: 11, opacity: 0.2 },
      ],
    },
  },
  {
    id: 'pink-pop',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'rect', layer: 'foreground', cx: 875, cy: 88, width: 18, height: 58, rotation: -24, opacity: 0.6 },
        { type: 'path', layer: 'foreground', d: 'M 918 142 L 939 119 L 960 142 L 939 165 Z', fill: 'none', stroke: 'accent', strokeWidth: 8, strokeLinejoin: 'round', opacity: 0.62 },
        { type: 'circle', layer: 'foreground', cx: 878, cy: 224, radius: 18, fill: 'none', stroke: 'accent', strokeWidth: 8, opacity: 0.65 },
        { type: 'rect', layer: 'foreground', cx: 932, cy: 256, width: 16, height: 42, rotation: 34, opacity: 0.58 },
        { type: 'rect', layer: 'foreground', cx: 22, cy: 430, width: 18, height: 58, rotation: 24, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 304 340 L 314 370 L 304 400 L 314 430 L 304 460', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.36 },
        { type: 'path', layer: 'foreground', d: 'M 334 1170 L 352 1148 L 370 1170 L 352 1192 Z', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.42 },
        { type: 'rect', layer: 'foreground', cx: 902, cy: 1330, width: 18, height: 54, rotation: -28, opacity: 0.42 },
        { type: 'rect', layer: 'foreground', cx: 22, cy: 1432, width: 16, height: 48, rotation: -18, opacity: 0.38 },
        { type: 'circle', layer: 'foreground', cx: 978, cy: 1444, radius: 12, fill: 'none', stroke: 'accent', strokeWidth: 7, opacity: 0.4 },
      ],
    },
  },
  {
    id: 'mint-green',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 870 42 C 948 82 862 132 934 174 C 966 194 914 240 886 286', fill: 'none', stroke: 'accent', strokeWidth: 9, strokeLinecap: 'round', opacity: 0.5 },
        { type: 'ellipse', layer: 'foreground', cx: 894, cy: 90, radiusX: 19, radiusY: 33, rotation: -38, opacity: 0.58 },
        { type: 'ellipse', layer: 'foreground', cx: 924, cy: 205, radiusX: 18, radiusY: 31, rotation: 38, opacity: 0.54 },
        { type: 'ellipse', layer: 'foreground', cx: 884, cy: 270, radiusX: 13, radiusY: 23, rotation: -32, opacity: 0.46 },
        { type: 'path', layer: 'foreground', d: 'M 20 330 C 48 420 4 520 30 618 C 46 678 12 744 24 820', fill: 'none', stroke: 'accent', strokeWidth: 8, strokeLinecap: 'round', opacity: 0.32 },
        { type: 'ellipse', layer: 'foreground', cx: 22, cy: 932, radiusX: 14, radiusY: 28, rotation: -38, opacity: 0.48 },
        { type: 'path', layer: 'foreground', d: 'M 304 334 C 298 454 310 570 304 690', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.28 },
        { type: 'ellipse', layer: 'foreground', cx: 350, cy: 1180, radiusX: 17, radiusY: 30, rotation: -42, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 772 1360 C 824 1326 874 1342 920 1308', fill: 'none', stroke: 'accent', strokeWidth: 8, strokeLinecap: 'round', opacity: 0.3 },
        { type: 'ellipse', layer: 'foreground', cx: 24, cy: 1434, radiusX: 13, radiusY: 25, rotation: 38, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 969 1418 C 988 1432 988 1452 970 1468', fill: 'none', stroke: 'accent', strokeWidth: 6, strokeLinecap: 'round', opacity: 0.34 },
      ],
    },
  },
  {
    id: 'letterpress-ochre',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
    className: 'film-letterpress-ochre',
    nameKey: 'filmLetterpressName',
    conditionKey: 'filmLetterpressCondition',
    challengeTool: 'caption',
    unlock: { type: 'achievement', achievement: 'customCaption', target: 1 },
    paper: { top: '#fff9e8', middle: '#ead7b3', bottom: '#d7b081', accent: '#24324a' },
    ink: { primary: '#24324a', secondary: '#354159' },
    artwork: [
      { type: 'path', layer: 'foreground', d: 'M -20 102 H 22 V 178 H 56 V 254 H 22 V 334 H 56 V 410 H 18 V 490 H -20', fill: 'none', stroke: '#80603d', strokeWidth: 22, strokeLinejoin: 'round', opacity: 0.16 },
      { type: 'path', layer: 'foreground', d: 'M -20 102 H 22 V 178 H 56 V 254 H 22 V 334 H 56 V 410 H 18 V 490 H -20', fill: 'none', stroke: 'accent', strokeWidth: 11, strokeLinejoin: 'round', opacity: 0.78 },
      { type: 'path', layer: 'foreground', d: 'M -16 118 H 12 V 190 H 46 V 242 H 12 V 346 H 46 V 398 H 10 V 474 H -16', fill: 'none', stroke: '#a94f3d', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.68 },
      { type: 'path', layer: 'foreground', d: 'M 1020 616 H 978 V 692 H 944 V 768 H 978 V 848 H 944 V 924 H 982 V 1004 H 1020', fill: 'none', stroke: '#80603d', strokeWidth: 22, strokeLinejoin: 'round', opacity: 0.16 },
      { type: 'path', layer: 'foreground', d: 'M 1020 616 H 978 V 692 H 944 V 768 H 978 V 848 H 944 V 924 H 982 V 1004 H 1020', fill: 'none', stroke: 'accent', strokeWidth: 11, strokeLinejoin: 'round', opacity: 0.78 },
      { type: 'path', layer: 'foreground', d: 'M 1016 632 H 988 V 704 H 954 V 756 H 988 V 860 H 954 V 912 H 990 V 988 H 1016', fill: 'none', stroke: '#a94f3d', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.68 },
      { type: 'path', d: 'M 142 18 H 384 L 414 6 H 586 L 616 18 H 858', fill: 'none', stroke: 'accent', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.46 },
      { type: 'path', d: 'M 174 28 H 402 L 430 16 H 570 L 598 28 H 826', fill: 'none', stroke: '#a94f3d', strokeWidth: 4, strokeLinejoin: 'round', opacity: 0.48 },
      { type: 'path', d: 'M 176 1208 H 374 L 404 1198 H 456 L 476 1208 H 524 L 544 1198 H 596 L 626 1208 H 824', fill: 'none', stroke: 'accent', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.38 },
      { type: 'path', d: 'M 226 1217 H 392 L 420 1207 H 580 L 608 1217 H 774', fill: 'none', stroke: '#a94f3d', strokeWidth: 4, strokeLinejoin: 'round', opacity: 0.44 },
    ],
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 854 52 H 898 V 94 H 938 V 136 H 900 V 178 H 946 V 220 H 912 V 262 H 854', fill: 'none', stroke: '#80603d', strokeWidth: 20, strokeLinejoin: 'round', opacity: 0.16 },
        { type: 'path', layer: 'foreground', d: 'M 854 52 H 898 V 94 H 938 V 136 H 900 V 178 H 946 V 220 H 912 V 262 H 854', fill: 'none', stroke: 'accent', strokeWidth: 10, strokeLinejoin: 'round', opacity: 0.78 },
        { type: 'path', layer: 'foreground', d: 'M 858 62 H 890 V 104 H 928 V 126 H 890 V 188 H 936 V 210 H 902 V 252 H 858', fill: 'none', stroke: '#a94f3d', strokeWidth: 5, strokeLinejoin: 'round', opacity: 0.68 },
        { type: 'path', layer: 'foreground', d: 'M 20 344 H 48 V 388 H 18 V 432 H 48 V 476 H 20', fill: 'none', stroke: '#80603d', strokeWidth: 12, strokeLinejoin: 'round', opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 304 340 H 312 V 440 H 304 V 540', fill: 'none', stroke: '#a94f3d', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.44 },
        { type: 'path', layer: 'foreground', d: 'M 340 1174 H 390 L 408 1164 H 466 L 484 1174 H 538', fill: 'none', stroke: 'accent', strokeWidth: 7, strokeLinejoin: 'round', opacity: 0.34 },
        { type: 'path', layer: 'foreground', d: 'M 786 1348 H 832 V 1338 H 878 V 1348 H 928', fill: 'none', stroke: '#a94f3d', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 14 1434 H 58 V 1450 H 88', fill: 'none', stroke: 'accent', strokeWidth: 8, strokeLinejoin: 'round', opacity: 0.36 },
        { type: 'path', layer: 'foreground', d: 'M 970 1412 H 990 V 1458 H 970', fill: 'none', stroke: '#a94f3d', strokeWidth: 6, strokeLinejoin: 'round', opacity: 0.46 },
      ],
    },
  },
  {
    id: 'vellum-mist',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 850 46 L 960 70 L 940 156 L 864 134 Z', fill: '#b7a8d8', opacity: 0.34 },
        { type: 'path', layer: 'foreground', d: 'M 882 140 L 952 170 L 926 282 L 858 240 Z', fill: '#9dcbc3', opacity: 0.28 },
        { type: 'path', layer: 'foreground', d: 'M 862 58 L 932 46 L 910 286', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 2 332 L 38 306 L 34 452 L 6 478 Z', fill: '#b7a8d8', opacity: 0.28 },
        { type: 'path', layer: 'foreground', d: 'M 304 334 L 312 350 L 304 704', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.32 },
        { type: 'path', layer: 'foreground', d: 'M 336 1162 L 414 1144 L 452 1180 L 376 1202 Z', fill: '#9dcbc3', opacity: 0.22 },
        { type: 'path', layer: 'foreground', d: 'M 792 1332 L 914 1304 L 950 1352 L 834 1378 Z', fill: '#b7a8d8', opacity: 0.26 },
        { type: 'path', layer: 'foreground', d: 'M 4 1418 L 68 1402 L 94 1458 L 12 1470 Z', fill: '#9dcbc3', opacity: 0.24 },
        { type: 'path', layer: 'foreground', d: 'M 970 1418 L 994 1408 L 994 1472 L 972 1460', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.34 },
      ],
    },
  },
  {
    id: 'comet-orange',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 850 42 C 924 78 958 158 902 286', fill: 'none', stroke: 'accent', strokeWidth: 24, strokeLinecap: 'round', opacity: 0.24 },
        { type: 'path', layer: 'foreground', d: 'M 858 48 C 922 86 946 156 906 274', fill: 'none', stroke: '#fff0cd', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.72 },
        { type: 'rect', layer: 'foreground', cx: 890, cy: 78, width: 34, height: 7, rotation: 20, opacity: 0.52 },
        { type: 'rect', layer: 'foreground', cx: 930, cy: 116, width: 24, height: 7, rotation: 20, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 18 334 C 44 406 8 480 32 548', fill: 'none', stroke: 'accent', strokeWidth: 18, strokeLinecap: 'round', opacity: 0.18 },
        { type: 'path', layer: 'foreground', d: 'M 20 336 C 42 404 12 474 34 536', fill: 'none', stroke: '#fff0cd', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.5 },
        { type: 'rect', layer: 'foreground', cx: 304, cy: 720, width: 28, height: 7, rotation: -18, opacity: 0.38 },
        { type: 'path', layer: 'foreground', d: 'M 340 1360 C 440 1324 538 1326 638 1360 C 716 1386 804 1364 888 1328', fill: 'none', stroke: '#fff0cd', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.44 },
        { type: 'rect', layer: 'foreground', cx: 22, cy: 1432, width: 40, height: 7, rotation: -18, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 970 1418 C 988 1438 988 1456 970 1472', fill: 'none', stroke: '#fff0cd', strokeWidth: 6, strokeLinecap: 'round', opacity: 0.52 },
      ],
    },
  },
  {
    id: 'eclipse-silver',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 842 292 C 860 180 900 86 966 48', fill: 'none', stroke: 'accent', strokeWidth: 12, strokeLinecap: 'round', opacity: 0.76 },
        { type: 'path', layer: 'foreground', d: 'M 856 280 C 876 180 916 105 958 78', fill: 'none', stroke: '#7483a5', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.7 },
        { type: 'rect', layer: 'foreground', cx: 870, cy: 74, width: 30, height: 7, rotation: 0, opacity: 0.52 },
        { type: 'rect', layer: 'foreground', cx: 896, cy: 244, width: 18, height: 7, rotation: 0, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 18 566 C 56 480 60 392 28 334', fill: 'none', stroke: 'accent', strokeWidth: 11, strokeLinecap: 'round', opacity: 0.52 },
        { type: 'path', layer: 'foreground', d: 'M 28 552 C 58 472 58 404 34 350', fill: 'none', stroke: '#7483a5', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.58 },
        { type: 'rect', layer: 'foreground', cx: 304, cy: 760, width: 30, height: 7, opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 340 1352 C 456 1314 546 1376 658 1340 C 744 1312 824 1346 916 1320', fill: 'none', stroke: 'accent', strokeWidth: 10, strokeLinecap: 'round', opacity: 0.42 },
        { type: 'rect', layer: 'foreground', cx: 24, cy: 1432, width: 48, height: 8, opacity: 0.34 },
        { type: 'path', layer: 'foreground', d: 'M 970 1416 H 992 V 1468 H 970', fill: 'none', stroke: '#7483a5', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.56 },
      ],
    },
  },
  {
    id: 'threefold-light',
    supportedLayoutIds: [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID],
    className: 'film-threefold-light',
    nameKey: 'filmThreefoldName',
    conditionKey: 'filmThreefoldCondition',
    unlock: { type: 'distinct-dayparts', target: 3 },
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
    artworkByLayout: {
      [MOSAIC_LAYOUT_ID]: [
        { type: 'path', layer: 'foreground', d: 'M 846 36 H 960 V 108 C 922 96 884 102 846 132 Z', fill: '#e6b84a', opacity: 0.78 },
        { type: 'path', layer: 'foreground', d: 'M 846 132 C 886 108 930 130 960 156 V 218 C 916 198 878 204 846 238 Z', fill: '#e98c78', opacity: 0.72 },
        { type: 'path', layer: 'foreground', d: 'M 846 238 C 882 212 924 224 960 246 V 302 H 846 Z', fill: '#3d8f87', opacity: 0.7 },
        { type: 'path', layer: 'foreground', d: 'M 852 278 C 888 252 924 264 956 284', fill: 'none', stroke: 'accent', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.42 },
        { type: 'path', layer: 'foreground', d: 'M 0 334 H 42 V 418 C 28 432 14 432 0 442 Z', fill: '#59517d', opacity: 0.46 },
        { type: 'path', layer: 'foreground', d: 'M 304 340 V 460 C 310 490 310 520 304 552', fill: 'none', stroke: '#1f2b45', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.4 },
        { type: 'path', layer: 'foreground', d: 'M 338 1160 H 408 C 434 1144 458 1144 484 1160 V 1204 H 338 Z', fill: '#e98c78', opacity: 0.34 },
        { type: 'path', layer: 'foreground', d: 'M 812 1328 C 850 1306 896 1310 934 1332 V 1374 H 812 Z', fill: '#3d8f87', opacity: 0.38 },
        { type: 'path', layer: 'foreground', d: 'M 0 1414 C 28 1398 58 1408 80 1440 V 1484 H 0 Z', fill: '#e6b84a', opacity: 0.34 },
        { type: 'path', layer: 'foreground', d: 'M 970 1412 H 996 V 1468 H 970', fill: 'none', stroke: '#e98c78', strokeWidth: 7, strokeLinecap: 'round', opacity: 0.5 },
      ],
    },
  },
]

const FILM_BY_ID = new Map(FILMS.map((film) => [film.id, film]))

function normalizeFilmId(id) {
  return FILM_ID_ALIASES[id] ?? id
}

export function getFilm(id) {
  return FILM_BY_ID.get(normalizeFilmId(id)) ?? FILM_BY_ID.get(DEFAULT_FILM_ID)
}

export function getFilmArtwork(filmOrId, layoutId = DEFAULT_LAYOUT_ID) {
  const film = typeof filmOrId === 'object' && filmOrId ? filmOrId : getFilm(filmOrId)
  const resolvedLayoutId = getFilmLayoutId(film, layoutId)
  const layoutArtwork = film.artworkByLayout?.[resolvedLayoutId]
  return Array.isArray(layoutArtwork) ? layoutArtwork : (Array.isArray(film.artwork) ? film.artwork : [])
}

export function getSupportedFilmLayoutIds(filmOrId) {
  const film = typeof filmOrId === 'object' && filmOrId ? filmOrId : getFilm(filmOrId)
  const declaredIds = Array.isArray(film.supportedLayoutIds) ? film.supportedLayoutIds : []
  return [...new Set([DEFAULT_LAYOUT_ID, ...declaredIds.filter((id) => typeof id === 'string')])]
}

export function getFilmLayoutId(filmOrId, requestedLayoutId) {
  const supportedLayoutIds = getSupportedFilmLayoutIds(filmOrId)
  return supportedLayoutIds.includes(requestedLayoutId) ? requestedLayoutId : DEFAULT_LAYOUT_ID
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

export function getFilmDaypartForHour(hour) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'midday'
  return 'night'
}

function getCompletionDaypart(completedAt) {
  if (typeof completedAt !== 'string' || !completedAt.trim()) return null
  const completedDate = new Date(completedAt)
  if (!Number.isFinite(completedDate.getTime())) return null
  return getFilmDaypartForHour(completedDate.getHours())
}

function normalizeFilmDaypart(daypart) {
  return typeof daypart === 'string' ? (FILM_DAYPART_ALIASES[daypart] ?? null) : null
}

export function createFilmChallenges(day, defaultCaption = '') {
  const caption = typeof day?.caption === 'string' ? day.caption.trim() : ''
  const defaultText = typeof defaultCaption === 'string' ? defaultCaption.trim() : ''
  const hasOwnWords = caption.replace(/\s/gu, '').length > 0 && caption !== defaultText
  const transparency = day?.composition?.transparency
  const angle = day?.composition?.angle
  const radius = day?.composition?.radius
  const daypart = getCompletionDaypart(day?.completedAt)

  return {
    version: FILM_CHALLENGE_VERSION,
    customCaption: hasOwnWords,
    mistTransparency: Number.isFinite(transparency) && transparency >= FILM_CHALLENGE_RULES.mistTransparency,
    compactArc: Number.isFinite(angle) && angle >= 10 && angle <= FILM_CHALLENGE_RULES.compactArcDegrees,
    expandedRadius: Number.isFinite(radius) && radius >= FILM_CHALLENGE_RULES.expandedRadius,
    ...(daypart ? { daypart } : {}),
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function ensureCustomCaptionChallenge(day, defaultCaption = '') {
  if (!createFilmChallenges(day, defaultCaption).customCaption) return day

  const achievements = isRecord(day?.achievements) ? day.achievements : {}
  const existingChallenges = isRecord(achievements.filmChallenges) ? achievements.filmChallenges : {}
  if (existingChallenges.version !== undefined && existingChallenges.version !== FILM_CHALLENGE_VERSION) return day
  if (existingChallenges.version === FILM_CHALLENGE_VERSION && existingChallenges.customCaption === true) return day

  return {
    ...day,
    achievements: {
      ...achievements,
      filmChallenges: {
        ...existingChallenges,
        version: FILM_CHALLENGE_VERSION,
        customCaption: true,
      },
    },
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

export function getCollectedFilmDayparts(completedDays = []) {
  const collected = new Set()
  for (const day of completedDays) {
    const daypart = normalizeFilmDaypart(getStoredFilmChallenges(day)?.daypart)
    if (daypart) collected.add(daypart)
  }
  return FILM_DAYPART_KEYS.filter((daypart) => collected.has(daypart))
}

export function getFilmProgress(film, completedDays = []) {
  const target = film.unlock.target
  let current = 0

  if (film.unlock.type === 'completed-count') current = completedDates(completedDays).length
  if (film.unlock.type === 'consecutive-days') current = getLongestCompletionStreak(completedDays)
  if (film.unlock.type === 'all-green-rainbow') current = countAllGreenRainbows(completedDays)
  if (film.unlock.type === 'achievement') current = countFilmAchievement(completedDays, film.unlock.achievement)
  if (film.unlock.type === 'distinct-dayparts') current = getCollectedFilmDayparts(completedDays).length
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
  const rawStoredIds = Array.isArray(record?.unlockedFilmIds)
    ? record.unlockedFilmIds.filter((id) => typeof id === 'string')
    : []
  const storedIds = rawStoredIds.map(normalizeFilmId)
  const unlockedFilmIds = []
  for (const id of [DEFAULT_FILM_ID, ...storedIds, ...getDerivedUnlockedFilmIds(completedDays)]) {
    if (!unlockedFilmIds.includes(id)) unlockedFilmIds.push(id)
  }
  const requestedFilmId = normalizeFilmId(record?.selectedFilmId)
  const selectedFilmId = unlockedFilmIds.includes(requestedFilmId) ? requestedFilmId : DEFAULT_FILM_ID
  const selectedLayoutId = getFilmLayoutId(selectedFilmId, record?.selectedLayoutId)
  const needsSave = !record
    || record.schemaVersion !== FILM_COLLECTION_SCHEMA_VERSION
    || !sameArray(rawStoredIds, unlockedFilmIds)
    || record.selectedFilmId !== selectedFilmId
    || record.selectedLayoutId !== selectedLayoutId

  return {
    ...(record && typeof record === 'object' ? record : {}),
    schemaVersion: FILM_COLLECTION_SCHEMA_VERSION,
    unlockedFilmIds,
    selectedFilmId,
    selectedLayoutId,
    needsSave,
  }
}
