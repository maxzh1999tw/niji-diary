import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [appSource, appStyles] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

assert.match(appSource, /function FilmChallengeStatus\(/)
assert.match(appSource, /role="status" aria-live="polite"/)
assert.match(appSource, /const challengeResults = createFilmChallenges\(\{ caption, composition: transform \}, t\.defaultCaption\)/)
assert.doesNotMatch(appSource, /setChallengeResults/, 'live challenge feedback must stay derived from visible editor values')
assert.match(appSource, /function backfillCaptionChallenges\(/)
assert.match(appSource, /ensureCustomCaptionChallenge\(day, defaultCaption\)/)
assert.match(appSource, /async function persistCaption\(target, caption = target\?\.caption\)/)
assert.match(appSource, /onCaptionCommit=\{\(caption\) => persistCaption\(selectedDay, caption\)\}/)
assert.match(appSource, /onClick=\{finishWithLatestCaption\}/)
assert.match(appSource, /key: 'colorWidth',[^\n]+min: 0\.5, max: 2/)
assert.match(appSource, /onFocus=\{captionChallengeFilm \? \(\) => setActiveTool\('caption'\) : undefined\}/)
assert.match(appSource, /challengeMet \? <span className="toolbar-challenge-check"/)
assert.match(appSource, /film\.unlock\.type === 'distinct-dayparts'/)
assert.match(appSource, /FILM_DAYPART_KEYS\.map\(\(daypart\)/)
assert.match(appSource, /film-daypart-item \$\{isCollected \? 'is-collected' : 'is-pending'\}/)

assert.match(appStyles, /\.film-challenge-status-copy strong, \.film-challenge-status-copy small \{[^}]*font-size: 12px/)
assert.match(appStyles, /\.film-challenge-summary-heading small \{[^}]*font-size: 12px/)
assert.match(appStyles, /\.film-challenge-summary-item b, \.film-challenge-summary-item small \{[^}]*font-size: 12px/)
assert.match(appStyles, /\.editor-toolbar \{[^}]*grid-template-columns: repeat\(5, minmax\(52px, 1fr\)\)/)
assert.match(appStyles, /\.film-daypart-item > span,[\s\S]*?font-size: 12px/)
assert.doesNotMatch(appStyles, /\.film-challenge-(?:status-copy|summary-heading|summary-item)[^{]*\{[^}]*(?:white-space:\s*nowrap|text-overflow:\s*ellipsis|line-clamp)/)

console.log('Film challenge UI: editor conditions have live feedback, and time-based progress names each collected period.')
