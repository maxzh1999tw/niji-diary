import assert from 'node:assert/strict'
import { COLOR_KEYS } from '../src/colorAnalysis.js'
import { createFilmChallenges, DEFAULT_FILM_ID, DEFAULT_LAYOUT_ID, ensureCustomCaptionChallenge, FILM_CHALLENGE_VERSION, FILM_DAYPART_KEYS, FILMS, getCollectedFilmDayparts, getCurrentCompletionStreak, getFilm, getFilmDaypartForHour, getFilmLayoutId, getFilmProgress, getFilmProgressChanges, getLongestCompletionStreak, getSupportedFilmLayoutIds, isAllGreenRainbow, MOSAIC_LAYOUT_ID, normalizeFilmCollection } from '../src/films.js'
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
assert.equal(normalizeFilmCollection(null, []).selectedLayoutId, DEFAULT_LAYOUT_ID)
assert.deepEqual(getSupportedFilmLayoutIds(DEFAULT_FILM_ID), [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID])
for (const film of FILMS) assert.deepEqual(getSupportedFilmLayoutIds(film), [DEFAULT_LAYOUT_ID, MOSAIC_LAYOUT_ID], `${film.id} must support the mosaic layout`)
assert.equal(getFilmLayoutId(DEFAULT_FILM_ID, MOSAIC_LAYOUT_ID), MOSAIC_LAYOUT_ID)
assert.equal(getFilmLayoutId('sky-blue', MOSAIC_LAYOUT_ID), MOSAIC_LAYOUT_ID)
assert.equal(FILMS.length, 9)
for (const language of Object.values(translations)) {
  for (const key of ['filmChallengeGuideTitle', 'filmChallengeGuideHint', 'filmChallengeMet', 'filmChallengePending', 'filmDaypartProgressLabel', 'filmDaypartMorning', 'filmDaypartMidday', 'filmDaypartNight', 'filmDaypartDone', 'filmDaypartPending', 'layoutPickerLabel', 'layoutSupportedLabel', 'layoutClassicName', 'layoutMosaicName', 'useLayout']) assert.equal(typeof language[key], 'string')
  for (const film of FILMS) {
    assert.equal(typeof language[film.nameKey], 'string', `${film.id} must have a localized name`)
    assert.equal(typeof language[film.conditionKey], 'string', `${film.id} must have a localized condition`)
  }
  const newConditions = FILMS.slice(4).map((film) => language[film.conditionKey]).join(' ')
  assert.doesNotMatch(newConditions, /OKLCH/, 'new film conditions must avoid invisible technical calculations')
  assert.match(language[getFilm('threefold-light').conditionKey], /05:00.*10:59.*11:00.*16:59.*17:00.*04:59/, 'threefold light must explain every time boundary')
}
assert.equal(translations['zh-Hant'].filmLetterpressCondition, '修改拍立得下方的預設文字，改成自己的話。')
assert.match(translations.en.filmLetterpressCondition, /below any Polaroid/)
assert.doesNotMatch(translations.ja.filmLetterpressCondition, /作成中/)

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
assert.equal(getCurrentCompletionStreak([completed('2026-08-01'), completed('2026-08-02')], '2026-08-03'), 2)
assert.equal(getCurrentCompletionStreak([completed('2026-08-01'), completed('2026-08-02')], '2026-08-04'), 0, 'a missed day must reset the current streak before another record is made')
assert.deepEqual(getFilmProgress(FILMS[2], [completed('2026-08-01'), completed('2026-08-02')], '2026-08-04'), { current: 0, target: 3, met: false })
assert.deepEqual(getFilmProgress(FILMS[2], [completed('2026-08-01'), completed('2026-08-02'), completed('2026-08-04')], '2026-08-05'), { current: 1, target: 3, met: false })
assert.deepEqual(getFilmProgressChanges(threeDayStreak.slice(0, 2), threeDayStreak), [
  { filmId: 'pink-pop', previous: 2, current: 3, target: 3, unlocked: true },
])
assert.deepEqual(getFilmProgressChanges([completed('2026-08-01'), completed('2026-08-02')], [completed('2026-08-01'), completed('2026-08-02'), completed('2026-08-04')]).find((change) => change.filmId === 'pink-pop'), {
  filmId: 'pink-pop', previous: 0, current: 1, target: 3, unlocked: false,
}, 'a new streak must start from zero after a missed day')

assert.equal(isAllGreenRainbow(greenRainbow), true)
assert.equal(isAllGreenRainbow({ achievements: { allGreenRainbow: true } }), true)
assert.equal(isAllGreenRainbow({ achievements: { allGreenRainbow: false }, ...greenRainbow }), false)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04', greenRainbow)]).met, true)
assert.equal(getFilmProgress(FILMS[3], [completed('2026-08-04')]).met, false)
assert.deepEqual(getFilmProgressChanges([], [completed('2026-08-04', greenRainbow)]).find((change) => change.filmId === 'mint-green'),
  { filmId: 'mint-green', previous: 0, current: 1, target: 1, unlocked: true })

const localCompletedAt = (hour, minute = 0) => new Date(2026, 7, 15, hour, minute, 0).toISOString()
const baseChallengeDay = { caption: '我的話', completedAt: localCompletedAt(11), composition: { transparency: 0.55, angle: 60, radius: 1.5, colorWidth: 1.5 } }
const baseChallenges = createFilmChallenges(baseChallengeDay, 'NIJI 拾色日記')
assert.equal(baseChallenges.version, FILM_CHALLENGE_VERSION)
assert.equal(baseChallenges.customCaption, true)
assert.equal(baseChallenges.mistTransparency, true)
assert.equal(baseChallenges.compactArc, true)
assert.equal(baseChallenges.expandedRadius, true)
assert.equal(baseChallenges.daypart, 'midday')
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: '我' }, 'NIJI 拾色日記').customCaption, true, 'any real custom caption is understandable and sufficient')
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: '   ' }, 'NIJI 拾色日記').customCaption, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, caption: 'NIJI 拾色日記' }, 'NIJI 拾色日記').customCaption, false)
const retroactiveCaptionRecord = { date: '2026-08-06', caption: '相冊裡已寫好的話', completedAt: localCompletedAt(12), achievements: { allGreenRainbow: true, keepMe: 'yes' } }
const repairedCaptionRecord = ensureCustomCaptionChallenge(retroactiveCaptionRecord, 'NIJI 拾色日記')
assert.equal(repairedCaptionRecord.achievements.filmChallenges.customCaption, true)
assert.equal(repairedCaptionRecord.achievements.filmChallenges.version, FILM_CHALLENGE_VERSION)
assert.equal(repairedCaptionRecord.achievements.keepMe, 'yes', 'caption repair must preserve unrelated achievement data')
assert.equal(getFilmProgress(getFilm('letterpress-ochre'), [repairedCaptionRecord]).met, true)
const defaultCaptionRecord = { ...retroactiveCaptionRecord, caption: 'NIJI 拾色日記' }
assert.equal(ensureCustomCaptionChallenge(defaultCaptionRecord, 'NIJI 拾色日記'), defaultCaptionRecord)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, transparency: 0.54 } }, '').mistTransparency, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, transparency: 0.55 } }, '').mistTransparency, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, angle: 61 } }, '').compactArc, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, angle: 60 } }, '').compactArc, true)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, radius: 1.49 } }, '').expandedRadius, false)
assert.equal(createFilmChallenges({ ...baseChallengeDay, composition: { ...baseChallengeDay.composition, radius: 1.5 } }, '').expandedRadius, true)
assert.deepEqual(createFilmChallenges({ caption: '我', composition: {} }, ''), {
  version: FILM_CHALLENGE_VERSION,
  customCaption: true,
  mistTransparency: false,
  compactArc: false,
  expandedRadius: false,
})

assert.deepEqual([
  [4, 'night'], [5, 'morning'], [10, 'morning'], [11, 'midday'], [16, 'midday'], [17, 'night'], [23, 'night'],
].map(([hour, expected]) => [getFilmDaypartForHour(hour), expected]), [
  ['night', 'night'], ['morning', 'morning'], ['morning', 'morning'], ['midday', 'midday'], ['midday', 'midday'], ['night', 'night'], ['night', 'night'],
])
assert.equal(getFilmDaypartForHour(-1), null)
assert.equal(getFilmDaypartForHour(24), null)
assert.deepEqual([
  createFilmChallenges({ completedAt: localCompletedAt(4, 59) }).daypart,
  createFilmChallenges({ completedAt: localCompletedAt(5) }).daypart,
  createFilmChallenges({ completedAt: localCompletedAt(10, 59) }).daypart,
  createFilmChallenges({ completedAt: localCompletedAt(11) }).daypart,
  createFilmChallenges({ completedAt: localCompletedAt(16, 59) }).daypart,
  createFilmChallenges({ completedAt: localCompletedAt(17) }).daypart,
], ['night', 'morning', 'morning', 'midday', 'midday', 'night'])
assert.deepEqual(FILM_DAYPART_KEYS, ['morning', 'midday', 'night'])
assert.deepEqual(FILMS.slice(4).map((film) => film.challengeTool), ['caption', 'transparency', 'angle', 'radius', undefined])

const letterpress = getFilm('letterpress-ochre')
assert.equal(getFilmProgress(letterpress, [challengeRecord('2026-08-05', { customCaption: true })]).met, true)
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05')]).met, false, 'records without challenge achievements must not unlock new films')
assert.equal(getFilmProgress(letterpress, [completed('2026-08-05', { achievements: { filmChallenges: { customCaption: true } } })]).met, false, 'pre-challenge records must not unlock new films')
assert.equal(getFilmProgress(getFilm('vellum-mist'), [challengeRecord('2026-08-06', { mistTransparency: true })]).met, true)
assert.equal(getFilmProgress(getFilm('comet-orange'), [challengeRecord('2026-08-07', { compactArc: true })]).met, true)
assert.equal(getFilmProgress(getFilm('eclipse-silver'), [challengeRecord('2026-08-08', { eclipseContrast: true })]).met, false, 'the hidden color calculation must no longer unlock eclipse silver')
assert.equal(getFilmProgress(getFilm('eclipse-silver'), [challengeRecord('2026-08-08', { expandedRadius: true })]).met, true)

const threefold = getFilm('threefold-light')
const morningRecord = challengeRecord('2026-08-09', { daypart: 'morning' })
const repeatedMorningRecord = challengeRecord('2026-08-10', { daypart: 'morning' })
const middayRecord = challengeRecord('2026-08-12', { daypart: 'midday' })
const repeatedMiddayRecord = challengeRecord('2026-08-14', { daypart: 'midday' })
const nightRecord = challengeRecord('2026-08-16', { daypart: 'night' })
assert.equal(getFilm('fourfold-light').id, 'threefold-light', 'the unreleased internal id must retain a safe compatibility alias')
assert.deepEqual(getFilmProgress(threefold, [morningRecord]), { current: 1, target: 3, met: false })
assert.deepEqual(getFilmProgress(threefold, [morningRecord, repeatedMorningRecord]), { current: 1, target: 3, met: false })
assert.deepEqual(getFilmProgress(threefold, [morningRecord, middayRecord]), { current: 2, target: 3, met: false })
assert.deepEqual(getCollectedFilmDayparts([morningRecord, middayRecord, nightRecord]), ['morning', 'midday', 'night'])
assert.deepEqual(getFilmProgress(threefold, [morningRecord, middayRecord, nightRecord]), { current: 3, target: 3, met: true })
assert.deepEqual(getFilmProgress(threefold, [challengeRecord('2026-08-09', { daypart: 'breakfast' })]), { current: 0, target: 3, met: false })
assert.deepEqual(getFilmProgress(threefold, [completed('2026-08-09', { achievements: { filmChallenges: { daypart: 'morning' } } })]), { current: 0, target: 3, met: false })
assert.deepEqual(getCollectedFilmDayparts([challengeRecord('2026-08-09', { daypart: 'evening' })]), ['night'], 'legacy evening data must safely map into the new night period')
assert.equal(getFilmProgressChanges([morningRecord, middayRecord], [morningRecord, middayRecord, repeatedMiddayRecord]).some((change) => change.filmId === 'threefold-light'), false)
assert.deepEqual(getFilmProgressChanges([morningRecord, middayRecord], [morningRecord, middayRecord, nightRecord]).find((change) => change.filmId === 'threefold-light'),
  { filmId: 'threefold-light', previous: 2, current: 3, target: 3, unlocked: true })

const unlocked = normalizeFilmCollection(null, [...threeDayStreak, completed('2026-08-04', greenRainbow)])
assert.deepEqual(unlocked.unlockedFilmIds, [DEFAULT_FILM_ID, 'sky-blue', 'pink-pop', 'mint-green'])
assert.equal(normalizeFilmCollection(null, [...threeDayStreak, completed('2026-08-05')]).unlockedFilmIds.includes('pink-pop'), true, 'a previously met streak keeps the film unlocked after later gaps')
assert.equal(unlocked.selectedFilmId, DEFAULT_FILM_ID)
const preservedSelection = normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID, 'mint-green'], selectedFilmId: 'mint-green' }, [])
assert.equal(preservedSelection.selectedFilmId, 'mint-green', 'an existing unlocked selection must survive the expanded film catalog')
assert.equal(preservedSelection.selectedLayoutId, DEFAULT_LAYOUT_ID, 'pre-layout film collections must receive the compatible default')
const preservedMosaic = normalizeFilmCollection({ schemaVersion: 2, unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: DEFAULT_FILM_ID, selectedLayoutId: MOSAIC_LAYOUT_ID, futureSetting: 'keep-me' }, [])
assert.equal(preservedMosaic.selectedLayoutId, MOSAIC_LAYOUT_ID)
assert.equal(preservedMosaic.futureSetting, 'keep-me', 'unknown future collection fields must survive normalization')
const unsupportedMosaic = normalizeFilmCollection({ schemaVersion: 2, unlockedFilmIds: [DEFAULT_FILM_ID, 'mint-green'], selectedFilmId: 'mint-green', selectedLayoutId: 'future-layout' }, [])
assert.equal(unsupportedMosaic.selectedLayoutId, DEFAULT_LAYOUT_ID, 'switching to a film without the selected layout must fall back safely')
const preservedChangedChallenge = normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID, 'eclipse-silver', 'fourfold-light'], selectedFilmId: 'fourfold-light' }, [])
assert.deepEqual(preservedChangedChallenge.unlockedFilmIds, [DEFAULT_FILM_ID, 'eclipse-silver', 'threefold-light'], 'changing the unreleased internal id must never revoke a locally unlocked film')
assert.equal(preservedChangedChallenge.selectedFilmId, 'threefold-light')
assert.equal(preservedChangedChallenge.needsSave, true)
assert.equal(normalizeFilmCollection({ schemaVersion: 1, unlockedFilmIds: [DEFAULT_FILM_ID], selectedFilmId: 'sky-blue' }, []).selectedFilmId, DEFAULT_FILM_ID)

console.log('Film model: classic white is the compatible default, and film unlock conditions derive from completed history.')
