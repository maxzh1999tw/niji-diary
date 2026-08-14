import assert from 'node:assert/strict'
import { COLOR_KEYS } from '../src/colorAnalysis.js'
import { DEFAULT_FILM_ID, FILMS, getFilm, getFilmProgress, getLongestCompletionStreak, isAllGreenRainbow, normalizeFilmCollection } from '../src/films.js'

const completed = (date, overrides = {}) => ({ date, completedAt: `${date}T12:00:00.000Z`, photos: {}, samples: {}, ...overrides })

const greenRainbow = {
  photos: Object.fromEntries(COLOR_KEYS.map((key) => [key, `${key}-photo`])),
  samples: Object.fromEntries(COLOR_KEYS.map((key) => [key, '#42d67a'])),
}

assert.equal(getFilm(undefined).id, DEFAULT_FILM_ID)
assert.deepEqual(normalizeFilmCollection(null, []).unlockedFilmIds, [DEFAULT_FILM_ID])

const firstPolaroid = [completed('2026-08-01')]
assert.equal(getFilmProgress(FILMS[1], firstPolaroid).met, true)

const threeDayStreak = [completed('2026-08-01'), completed('2026-08-02'), completed('2026-08-03')]
assert.equal(getLongestCompletionStreak(threeDayStreak), 3)
assert.equal(getFilmProgress(FILMS[2], threeDayStreak).met, true)
assert.equal(getFilmProgress(FILMS[2], [completed('2026-08-01'), completed('2026-08-03')]).met, false)

assert.equal(isAllGreenRainbow(greenRainbow), true)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04', greenRainbow)]).met, true)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04')]).met, false)

const unlocked = normalizeFilmCollection(null, [...threeDayStreak, completed('2026-08-04', greenRainbow)])
assert.deepEqual(unlocked.unlockedFilmIds, [DEFAULT_FILM_ID, 'sky-blue', 'pink-pop', 'mint-green'])
assert.equal(unlocked.selectedFilmId, DEFAULT_FILM_ID)
assert.equal(normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: 'sky-blue' }, []).selectedFilmId, DEFAULT_FILM_ID)

console.log('Film model: classic white is the compatible default, and film unlock conditions derive from completed history.')
