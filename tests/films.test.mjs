import assert from 'node:assert/strict'
import { COLOR_KEYS } from '../src/colorAnalysis.js'
import { createFilmChallenges, DEFAULT_FILM_ID, FILM_CHALLENGE_VERSION, FILMS, getFilm, getFilmChallengeDaypart, getFilmProgress, getFilmProgressChanges, getLongestCompletionStreak, isAllGreenRainbow, normalizeFilmCollection } from '../src/films.js'
import { translations } from '../src/i18n.js'

const completed = (date, overrides = {}) => ({ date, completedAt: `${date}T12:00:00.000Z`, photos: {}, samples: {}, ...overrides })

const greenRainbow = {
  photos: Object.fromEntries(COLOR_KEYS.map((key) => [key, `${key}-photo`])),
  samples: Object.fromEntries(COLOR_KEYS.map((key) => [key, '#42d67a'])),
}

const neutralSamples = Object.fromEntries(COLOR_KEYS.map((key) => [key, 'rgb(120, 120, 120)']))
const challengeRecord = (date, challenges) => completed(date, {
  achievements: { filmChallenges: { version: FILM_CHALLENGE_VERSION, ...challenges } },
})

assert.equal(getFilm(undefined).id, DEFAULT_FILM_ID)
assert.deepEqual(normalizeFilmCollection(null, []).unlockedFilmIds, [DEFAULT_FILM_ID])
assert.equal(FILMS.length, 9)
for (const language of Object.values(translations)) {
  for (const film of FILMS) {
    assert.equal(typeof language[film.nameKey], 'string', `${film.id} must have a localized name`)
    assert.equal(typeof language[film.conditionKey], 'string', `${film.id} must have a localized condition`)
  }
}

const firstPolaroid = [completed('2026-08-01')]
assert.equal(getFilmProgress(FILMS[1], firstPolaroid).met, true)
assert.deepEqual(getFilmProgressChanges([], firstPolaroid), [
  { filmId: 'sky-blue', previous: 0, current: 1, target: 1, unlocked: true },
  { filmId: 'pink-pop', previous: 0, current: 1, target: 3, unlocked: false },
])
assert.deepEqual(getFilmProgressChanges(firstPolaroid, firstPolaroid), [])

const threeDayStreak = [completed('2026-08-01'), completed('2026-08-02'), completed('2026-08-03')]
assert.equal(getLongestCompletionStreak(threeDayStreak), 3)
assert.equal(getFilmProgress(FILMS[2], threeDayStreak).met, true)
assert.equal(getFilmProgress(FILMS[2], [completed('2026-08-01'), completed('2026-08-03')]).met, false)
assert.deepEqual(getFilmProgressChanges(threeDayStreak.slice(0, 2), threeDayStreak), [
  { filmId: 'pink-pop', previous: 2, current: 3, target: 3, unlocked: true },
])

assert.equal(isAllGreenRainbow(greenRainbow), true)
assert.equal(isAllGreenRainbow({ achievements: { allGreenRainbow: true } }), true)
assert.equal(isAllGreenRainbow({ achievements: { allGreenRainbow: false }, ...greenRainbow }), false)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04', greenRainbow)]).met, true)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04')]).met, false)
assert.deepEqual(getFilmProgressChanges([], [completed('2026-08-04', greenRainbow)]).find((change) => change.filmId === 'mint-green'),
  { filmId: 'mint-green', previous: 0, current: 1, target: 1, unlocked: true })

const baseChallengeDay = { caption: 'abcdef', samples: neutralSamples, composition: { transparency: 0.55, angle: 60 } }
const baseChallenges = createFilmChallenges(baseChallengeDay, 'NIJI 拾色日記', 5)
assert.equal(baseChallenges.version, FILM_CHALLENGE_VERSION)
assert.equal(baseChallenges.customCaption, true)
assert.equal(baseChallenges.mistTransparency, true)
assert.equal(baseChallenges.compactArc, true)
assert.equal(baseChallenges.eclipseContrast, false)
assert.equal(baseChallenges.daypart, 'morning')
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: 'abcde' }, 'NIJI 拾色日記', 5).customCaption, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: 'NIJI 拾色日記' }, 'NIJI 拾色日記', 5).customCaption, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: 'abc de f' }, 'NIJI 拾色日記', 5).customCaption, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { transparency: 0.54, angle: 60 } }, '', 5).mistTransparency, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { transparency: 0.55, angle: 61 } }, '', 5).compactArc, false)

const contrastSamples = { ...neutralSamples, red: 'rgb(66, 66, 66)', yellow: 'rgb(196, 196, 196)' }
assert.equal(createFilmChallenges({ ...baseChallengeDay, samples: contrastSamples }, '', 5).eclipseContrast, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, samples: { ...contrastSamples, red: 'rgb(67, 67, 67)' } }, '', 5).eclipseContrast, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, samples: { ...contrastSamples, yellow: 'rgb(195, 195, 195)' } }, '', 5).eclipseContrast, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, samples: { ...contrastSamples, blue: 'not-a-color' } }, '', 5).eclipseContrast, false)

assert.equal(getFilmChallengeDaypart(4), 'night')
assert.equal(getFilmChallengeDaypart(5), 'morning')
assert.equal(getFilmChallengeDaypart(10), 'morning')
assert.equal(getFilmChallengeDaypart(11), 'day')
assert.equal(getFilmChallengeDaypart(16), 'day')
assert.equal(getFilmChallengeDaypart(17), 'evening')
assert.equal(getFilmChallengeDaypart(22), 'evening')
assert.equal(getFilmChallengeDaypart(23), 'night')
assert.equal(getFilmChallengeDaypart(24), null)

const letterpress = getFilm('letterpress-ochre')
assert.equal(getFilmProgress(letterpress, [challengeRecord('2026-08-05', { customCaption: true })]).met, true)
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05')]).met, false, 'records without challenge achievements must not unlock new films')
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05', { achievements: { filmChallenges: { customCaption: true } } })]).met, false, 'pre-challenge records must not unlock new films')
assert.equal(getFilmProgress(getFilm('vellum-mist'), [challengeRecord('2026-08-06', { mistTransparency: true })]).met, true)
assert.equal(getFilmProgress(getFilm('comet-orange'), [challengeRecord('2026-08-07', { compactArc: true })]).met, true)
assert.equal(getFilmProgress(getFilm('eclipse-silver'), [challengeRecord('2026-08-08', { eclipseContrast: true })]).met, true)

const morningOne = challengeRecord('2026-08-09', { daypart: 'morning' })
const morningTwo = challengeRecord('2026-08-10', { daypart: 'morning' })
const daytime = challengeRecord('2026-08-11', { daypart: 'day' })
const evening = challengeRecord('2026-08-12', { daypart: 'evening' })
const fourfold = getFilm('fourfold-light')
assert.deepEqual(getFilmProgress(fourfold, [morningOne, morningTwo]), { current: 1, target: 3, met: false })
assert.deepEqual(getFilmProgress(fourfold, [morningOne, morningTwo, daytime]), { current: 2, target: 3, met: false })
assert.deepEqual(getFilmProgress(fourfold, [morningOne, morningTwo, daytime, evening]), { current: 3, target: 3, met: true })
assert.deepEqual(getFilmProgressChanges([morningOne, morningTwo, daytime], [morningOne, morningTwo, daytime, evening]).find((change) => change.filmId === 'fourfold-light'),
  { filmId: 'fourfold-light', previous: 2, current: 3, target: 3, unlocked: true })

const unlocked = normalizeFilmCollection(null, [...threeDayStreak, completed('2026-08-04', greenRainbow)])
assert.deepEqual(unlocked.unlockedFilmIds, [DEFAULT_FILM_ID, 'sky-blue', 'pink-pop', 'mint-green'])
assert.equal(unlocked.selectedFilmId, DEFAULT_FILM_ID)
const preservedSelection = normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID, 'mint-green'], selectedFilmId: 'mint-green' }, [])
assert.equal(preservedSelection.selectedFilmId, 'mint-green', 'an existing unlocked selection must survive the expanded film catalog')
assert.equal(normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: 'sky-blue' }, []).selectedFilmId, DEFAULT_FILM_ID)

console.log('Film model: classic white is the compatible default, and film unlock conditions derive from completed history.')
