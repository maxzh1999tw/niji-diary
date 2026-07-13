import { useEffect, useMemo, useState } from 'react'
import { formatText, translations } from './i18n.js'
import { getCompletedDays, getDay, saveDay } from './storage.js'

const COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
const LANGUAGE_LABELS = { 'zh-Hant': '繁中', en: 'EN', ja: '日本語' }

function localDateKey() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function formatDate(date, lang) {
  const locale = lang === 'zh-Hant' ? 'zh-TW' : lang
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function MiniRainbow({ photos, label, onClick }) {
  return (
    <button className="mini-rainbow" type="button" aria-label={label} onClick={onClick}>
      {COLOR_KEYS.map((key) => <img key={key} src={photos[key]} alt="" />)}
    </button>
  )
}

function RainbowModal({ day, lang, t, onClose }) {
  if (!day) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="rainbow-date" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose} aria-label={t.close}>×</button>
        <p className="eyebrow">{t.history}</p>
        <h2 id="rainbow-date">{formatDate(day.date, lang)}</h2>
        <div className="rainbow-collage large">
          {COLOR_KEYS.map((key, index) => <img key={key} src={day.photos[key]} alt={formatText(t.photoAlt, { color: t.colors[index] })} />)}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('niji-language') || 'zh-Hant')
  const [day, setDay] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const date = useMemo(localDateKey, [])
  const t = translations[lang]
  const photos = day?.photos ?? {}
  const count = COLOR_KEYS.reduce((total, key) => total + (photos[key] ? 1 : 0), 0)
  const isComplete = Boolean(day?.completedAt)

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('niji-language', lang)
  }, [lang])

  useEffect(() => {
    let active = true
    Promise.all([getDay(date), getCompletedDays()])
      .then(([savedDay, savedHistory]) => {
        if (!active) return
        setDay(savedDay ?? { schemaVersion: 1, date, photos: {}, completedAt: null })
        setHistory(savedHistory)
      })
      .catch(() => setError(translations[lang].error))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date])

  async function handlePhoto(key, file) {
    if (!file || isComplete) return
    setError('')
    try {
      const image = await readFile(file)
      const nextDay = { ...day, photos: { ...photos, [key]: image } }
      setDay(nextDay)
      await saveDay(nextDay)
    } catch {
      setError(t.error)
    }
  }

  async function removePhoto(key) {
    if (isComplete) return
    const nextPhotos = { ...photos }
    delete nextPhotos[key]
    const nextDay = { ...day, photos: nextPhotos }
    setDay(nextDay)
    try { await saveDay(nextDay) } catch { setError(t.error) }
  }

  async function completeRainbow() {
    if (count !== 7 || isComplete || !window.confirm(t.confirm)) return
    const completedDay = { ...day, completedAt: new Date().toISOString() }
    setDay(completedDay)
    setHistory((current) => [completedDay, ...current.filter((item) => item.date !== date)])
    try { await saveDay(completedDay) } catch { setError(t.error) }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t.brand}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>{t.brand}</span>
        </a>
        <label className="language-select">
          <span className="sr-only">{t.language}</span>
          <select value={lang} onChange={(event) => setLang(event.target.value)}>
            {Object.entries(LANGUAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </header>

      <main id="top">
        <section className="hero">
          <p className="date-pill">{formatDate(date, lang)}</p>
          <h1>{t.tagline}</h1>
          <p>{t.intro}</p>
          <div className="hero-rainbow" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        </section>

        <section className="today-section" aria-labelledby="today-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.today}</p>
              <h2 id="today-title">{isComplete ? t.completed : formatText(t.progress, { count })}</h2>
            </div>
            <div className="progress-dots" aria-hidden="true">
              {COLOR_KEYS.map((key) => <i key={key} className={photos[key] ? 'found' : ''} />)}
            </div>
          </div>

          {loading ? <div className="loading-grid" aria-label="Loading"><i /><i /><i /><i /><i /><i /><i /></div> : (
            <div className={`color-grid ${isComplete ? 'locked' : ''}`}>
              {COLOR_KEYS.map((key, index) => (
                <article className={`color-card color-${key} ${photos[key] ? 'has-photo' : ''}`} key={key}>
                  <div className="photo-frame">
                    {photos[key] ? <img src={photos[key]} alt={formatText(t.photoAlt, { color: t.colors[index] })} /> : <span className="color-number">0{index + 1}</span>}
                    {!isComplete ? (
                      <label className="photo-action">
                        <input type="file" accept="image/*" capture="environment" onChange={(event) => handlePhoto(key, event.target.files?.[0])} />
                        <span>{photos[key] ? t.replace : t.takePhoto}</span>
                      </label>
                    ) : null}
                  </div>
                  <div className="card-caption">
                    <strong>{t.colors[index]}</strong>
                    {photos[key] && !isComplete ? <button type="button" onClick={() => removePhoto(key)}>{t.remove}</button> : <span>{String(index + 1).padStart(2, '0')}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {error ? <p className="error-message" role="alert">{error}</p> : null}
          {isComplete ? (
            <div className="complete-note"><span>♡</span><div><strong>{t.completed}</strong><p>{t.completedHint}</p></div></div>
          ) : (
            <button className="complete-button" type="button" disabled={count !== 7} onClick={completeRainbow}>
              {t.complete}<span aria-hidden="true">→</span>
            </button>
          )}
          <p className="privacy-note"><span aria-hidden="true">⌂</span>{t.local}</p>
        </section>

        <section className="history-section" aria-labelledby="history-title">
          <div className="section-heading">
            <div><p className="eyebrow">Archive</p><h2 id="history-title">{t.history}</h2></div>
            <span className="history-count">{history.length}</span>
          </div>
          {history.length ? (
            <div className="history-grid">
              {history.map((item) => (
                <article className="history-card" key={item.date}>
                  <MiniRainbow photos={item.photos} label={formatText(t.view, { date: formatDate(item.date, lang) })} onClick={() => setSelectedDay(item)} />
                  <time dateTime={item.date}>{formatDate(item.date, lang)}</time>
                </article>
              ))}
            </div>
          ) : <p className="empty-state">{t.empty}</p>}
        </section>
      </main>

      <footer><span className="footer-rainbow" aria-hidden="true" />{t.footer}</footer>
      <RainbowModal day={selectedDay} lang={lang} t={t} onClose={() => setSelectedDay(null)} />
    </>
  )
}
