import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [appSource, appStyles] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

assert.doesNotMatch(appSource, /FilmChallengeStatus|film-challenge-summary|toolbar-challenge-check|challengeResults|challengeFilms|activeChallengeFilm|captionChallengeFilm/, 'challenge feedback must not render inside Rainbow Studio')
assert.match(appSource, /function FilmProgressBookmark\(/, 'challenge feedback should use the bookmark notification')
assert.match(appSource, /const nextFilmNotifications = getFilmProgressChanges\(history, nextHistory\)/)
assert.match(appSource, /filmChallenges: createFilmChallenges\(completionSource, t\.defaultCaption\)/)
assert.match(appSource, /function backfillCaptionChallenges\(/)
assert.match(appSource, /ensureCustomCaptionChallenge\(day, defaultCaption\)/)
assert.match(appSource, /async function persistCaption\(target, caption = target\?\.caption\)/)
assert.match(appSource, /onCaptionCommit=\{\(caption\) => persistCaption\(selectedDay, caption\)\}/)
assert.match(appSource, /onClick=\{finishWithLatestCaption\}/)
assert.match(appSource, /key: 'colorWidth',[^\n]+min: 0\.5, max: 2/)
assert.match(appSource, /function FilmPicker\(\{ selectedFilmId, unlockedFilmIds, lang, t, onSelect \}\)/)
assert.match(appSource, /const availableFilms = FILMS\.filter\(\(film\) => unlockedFilmIds\.includes\(film\.id\)\)/)
assert.match(appSource, /scopeFilmRenderSvg\(svg, scope\)/)
assert.match(appSource, /scopeFilmRenderSvg\(overlaySvg, scope\)/)
assert.match(appSource, /function updateEditorValue\(key, value\)/)
assert.match(appSource, /key === 'radius' \? preserveRainbowTopAnchor\(current, value\)/)
assert.match(appSource, /onChange=\{\(event\) => updateEditorValue\(activeControl\.key, Number\(event\.target\.value\)\)\}/)

const pickerStart = appSource.indexOf('function FilmPicker(')
const pickerEnd = appSource.indexOf('function PolaroidCard', pickerStart)
assert.ok(pickerStart >= 0 && pickerEnd > pickerStart, 'film picker source should be discoverable')
const pickerSource = appSource.slice(pickerStart, pickerEnd)
assert.doesNotMatch(pickerSource, /conditionKey|filmChallenge|pending/, 'Rainbow Studio film picker must only list available films')
assert.match(pickerSource, /scrolling \? 'is-scrolling' : ''/)
assert.match(pickerSource, /onPointerDown=\{prepareFilmScroll\}/)
assert.match(pickerSource, /onScroll=\{revealFilmScrollbar\}/)

assert.match(appStyles, /\.editor-toolbar \{[^}]*grid-template-columns: repeat\(5, minmax\(52px, 1fr\)\)/)
assert.match(appStyles, /\.film-picker-options \{[^}]*overflow-x: auto;/)
assert.match(appStyles, /\.studio-workspace,\s*\.editor-dock,\s*\.film-picker,\s*\.film-picker-options \{ min-width: 0; \}/)
assert.match(appStyles, /\.film-picker-options \{ width: 100%; max-width: 100%; \}/)
assert.match(appStyles, /\.film-picker-options \{\s*scrollbar-color: transparent transparent;/)
assert.match(appStyles, /\.film-picker-options\.is-scrolling \{\s*scrollbar-color: var\(--purple\) transparent;/)
assert.match(appStyles, /\.film-surface-artwork > svg,\s*\.film-surface-overlay > svg \{ width: 100%; height: 100%; display: block; \}/)
assert.match(appStyles, /\.film-picker-heading strong,\s*\.film-picker-current,\s*\.film-option-name \{[^}]*overflow: visible;[^}]*overflow-wrap: anywhere;[^}]*white-space: normal;/)

console.log('Film challenge UI: Rainbow Studio only lists unlocked films, keeps challenge notices in the bookmark, and supports anchored radius controls.')
