import assert from 'node:assert/strict'
import { COLOR_KEYS } from '../src/colorAnalysis.js'
import { createFilmChallenges, DEFAULT_FILM_ID, FILM_CHALLENGE_VERSION, FILMS, getFilm, getFilmProgress, getFilmProgressChanges, getLongestCompletionStreak, isAllGreenRainbow, normalizeFilmCollection } from '../src/films.js'
import { translations } from '../src/i18n.js'

const completed = (date, overrides = {}) => ({ date, completedAt: `${date}T12:00:00.000Z`, photos: {}, samples: {}, ...overrides })

const greenRainbow = {
  photos: Object.fromEntries(COLOR_KEYS.map((key) => [key, `${key}-photo`])),
  samples: Object.fromEntries(COLOR_KEYS.map((key) => [key, '#42d67a'])),
}

const challengeRecord = (date, challenges) => completed(date, {
  achievements: { filmChallenges: { version: FILM_CHALLENGE_VERSION, ...challenges } },
})

assert.equal(getFilm(undefined).id, DEFAULT_FILM_ID)
assert.deepEqual(normalizeFilmCollection(null, []).unlockedFilmIds, [DEFAULT_FILM_ID])
assert.equal(FILMS.length, 9)
for (const language of Object.values(translations)) {
  for (const key of ['filmChallengeGuideTitle', 'filmChallengeGuideHint', 'filmChallengeMet', 'filmChallengePending']) assert.equal(typeof language[key], 'string')
  for (const film of FILMS) {
    assert.equal(typeof language[film.nameKey], 'string', `${film.id} must have a localized name`)
    assert.equal(typeof language[film.conditionKey], 'string', `${film.id} must have a localized condition`)
  }
  const newConditions = FILMS.slice(4).map((film) => language[film.conditionKey]).join(' ')
  assert.doesNotMatch(newConditions, /OKLCH|05:00/, 'new film conditions must use visible editor actions instead of technical calculations')
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

const baseChallengeDay = { caption: '我的話', composition: { transparency: 0.55, angle: 60, radius: 1.5, colorWidth: 1.5 } }
const baseChallenges = createFilmChallenges(baseChallengeDay, 'NIJI 拾色日記')
assert.equal(baseChallenges.version, FILM_CHALLENGE_VERSION)
assert.equal(baseChallenges.customCaption, true)
assert.equal(baseChallenges.mistTransparency, true)
assert.equal(baseChallenges.compactArc, true)
assert.equal(baseChallenges.expandedRadius, true)
assert.equal(baseChallenges.boldColorBands, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: '我' }, 'NIJI 拾色日記').customCaption, true, 'any real custom caption is understandable and sufficient')
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: '   ' }, 'NIJI 拾色日記').customCaption, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: 'NIJI 拾色日記' }, 'NIJI 拾色日記').customCaption, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, transparency: 0.54 } }, '').mistTransparency, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, transparency: 0.55 } }, '').mistTransparency, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, angle: 61 } }, '').compactArc, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, angle: 60 } }, '').compactArc, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, radius: 1.49 } }, '').expandedRadius, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, radius: 1.5 } }, '').expandedRadius, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, colorWidth: 1.49 } }, '').boldColorBands, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, colorWidth: 1.5 } }, '').boldColorBands, true)
assert.deepEqual(createFilmChallenges({ caption: '我', composition: {} }, ''), {
  version: FILM_CHALLENGE_VERSION,
  customCaption: true,
  mistTransparency: false,
  compactArc: false,
  expandedRadius: false,
  boldColorBands: false,
})

assert.deepEqual(FILMS.slice(4).map((film) => film.challengeTool), ['caption', 'transparency', 'angle', 'radius', 'colorWidth'])

const letterpress = getFilm('letterpress-ochre')
assert.equal(getFilmProgress(letterpress, [challengeRecord('2026-08-05', { customCaption: true })]).met, true)
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05')]).met, false, 'records without challenge achievements must not unlock new films')
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05', { achievements: { filmChallenges: { customCaption: true } } })]).met, false, 'pre-challenge records must not unlock new films')
assert.equal(getFilmProgress(getFilm('vellum-mist'), [challengeRecord('2026-08-06', { mistTransparency: true })]).met, true)
assert.equal(getFilmProgress(getFilm('comet-orange'), [challengeRecord('2026-08-07', { compactArc: true })]).met, true)
assert.equal(getFilmProgress(getFilm('eclipse-silver'), [challengeRecord('2026-08-08', { eclipseContrast: true })]).met, false, 'the hidden color calculation must no longer unlock eclipse silver')
assert.equal(getFilmProgress(getFilm('eclipse-silver'), [challengeRecord('2026-08-08', { expandedRadius: true })]).met, true)

const fourfold = getFilm('fourfold-light')
assert.deepEqual(getFilmProgress(fourfold, [challengeRecord('2026-08-09', { daypart: 'morning' })]), { current: 0, target: 1, met: false })
assert.deepEqual(getFilmProgress(fourfold, [challengeRecord('2026-08-09', { boldColorBands: true })]), { current: 1, target: 1, met: true })
assert.deepEqual(getFilmProgressChanges([], [challengeRecord('2026-08-09', { boldColorBands: true })]).find((change) => change.filmId === 'fourfold-light'),
  { filmId: 'fourfold-light', previous: 0, current: 1, target: 1, unlocked: true })

const unlocked = normalizeFilmCollection(null, [...threeDayStreak, completed('2026-08-04', greenRainbow)])
assert.deepEqual(unlocked.unlockedFilmIds, [DEFAULT_FILM_ID, 'sky-blue', 'pink-pop', 'mint-green'])
assert.equal(unlocked.selectedFilmId, DEFAULT_FILM_ID)
const preservedSelection = normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID, 'mint-green'], selectedFilmId: 'mint-green' }, [])
assert.equal(preservedSelection.selectedFilmId, 'mint-green', 'an existing unlocked selection must survive the expanded film catalog')
const preservedChangedChallenge = normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID, 'eclipse-silver', 'fourfold-light'], selectedFilmId: 'fourfold-light' }, [])
assert.deepEqual(preservedChangedChallenge.unlockedFilmIds, [DEFAULT_FILM_ID, 'eclipse-silver', 'fourfold-light'], 'changing a challenge must never revoke films already unlocked')
assert.equal(preservedChangedChallenge.selectedFilmId, 'fourfold-light')
assert.equal(normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: 'sky-blue' }, []).selectedFilmId, DEFAULT_FILM_ID)

console.log('Film model: classic white is the compatible default, and film unlock conditions derive from completed history.')
