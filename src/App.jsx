import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzePixels, COLOR_KEYS } from './colorAnalysis.js'
import { formatText, translations } from './i18n.js'
import { getCompletedDays, getDay, saveDay } from './storage.js'

const LANGUAGE_LABELS = { 'zh-Hant': '繁體中文', en: 'English', ja: '日本語' }
const TAB_KEYS = ['today', 'archive', 'settings']

function Icon({ name, size = 24 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  if (name === 'camera') return <svg {...common}><path d="M14.5 5 13 3H7L5.5 5H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-6.5Z" /><circle cx="10" cy="12" r="4" /></svg>
  if (name === 'book') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
  if (name === 'gear') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.08V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.51-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.51 1H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>
  if (name === 'sparkle') return <svg {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>
  if (name === 'back') return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
  if (name === 'lock') return <svg {...common}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>
}

function localDateKey() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function formatDate(date, lang, compact = false) {
  const locale = lang === 'zh-Hant' ? 'zh-TW' : lang
  return new Intl.DateTimeFormat(locale, compact ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

async function processPhoto(file) {
  const image = await decodePhoto(file)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  const context = canvas.getContext('2d', { alpha: false })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const sampleCanvas = document.createElement('canvas')
  sampleCanvas.width = 72
  sampleCanvas.height = 72
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true })
  sampleContext.drawImage(image, 0, 0, 72, 72)
  const pixels = sampleContext.getImageData(0, 0, 72, 72).data
  const analysis = analyzePixels(pixels)
  image.close?.()
  return { image: canvas.toDataURL('image/jpeg', 0.84), ...analysis }
}

async function decodePhoto(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file)
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Unable to decode photo'))
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function RainbowStrip({ photos, labels, interactive = false, onSelect }) {
  return (
    <div className="rainbow-strip" aria-label={interactive ? labels.join('、') : undefined}>
      {COLOR_KEYS.map((key, index) => {
        const content = photos[key] ? <img src={photos[key]} alt={labels[index]} loading="lazy" /> : <span>{index + 1}</span>
        return interactive
          ? <button type="button" key={key} className={`strip-${key}`} aria-label={labels[index]} onClick={() => onSelect(key)}>{content}</button>
          : <div key={key} className={`strip-${key}`}>{content}</div>
      })}
    </div>
  )
}

function ColorWheel({ selected, labels, sampleColor, onSelect }) {
  return (
    <div className="color-wheel" role="group" aria-label={labels.join('、')}>
      <div className="wheel-ring" aria-hidden="true" />
      {COLOR_KEYS.map((key, index) => {
        const angle = -90 + index * (360 / 7)
        const radians = angle * Math.PI / 180
        const style = { '--wheel-x': `${50 + Math.cos(radians) * 38}%`, '--wheel-y': `${50 + Math.sin(radians) * 38}%` }
        return <button type="button" key={key} style={style} className={`wheel-choice wheel-${key} ${selected === key ? 'selected' : ''}`} aria-pressed={selected === key} onClick={() => onSelect(key)}><span>{labels[index]}</span></button>
      })}
      <div className="wheel-center"><i style={{ background: sampleColor }} /><span>AI</span></div>
    </div>
  )
}

function CaptureStage({ staged, selectedColor, photos, t, onSelect, onCancel, onConfirm }) {
  const selectedIndex = COLOR_KEYS.indexOf(selectedColor)
  const replacing = Boolean(photos[selectedColor])
  return (
    <section className="capture-stage screen-enter" aria-labelledby="color-question">
      <button className="icon-button back-button" type="button" onClick={onCancel} aria-label={t.cancel}><Icon name="back" /></button>
      <div className="capture-copy">
        <span className="ai-badge"><Icon name="sparkle" size={17} />{formatText(t.aiGuess, { confidence: staged.confidence })}</span>
        <h1 id="color-question">{t.whichColor}</h1>
        <p>{t.wheelHint}</p>
      </div>
      <div className="capture-layout">
        <div className="photo-preview"><img src={staged.image} alt={t.newPhotoAlt} /></div>
        <ColorWheel selected={selectedColor} labels={t.colors} sampleColor={staged.sampleColor} onSelect={onSelect} />
      </div>
      <div className="stage-actions">
        {replacing ? <p className="replace-warning" role="status">{formatText(t.replaceWarning, { color: t.colors[selectedIndex] })}</p> : null}
        <button className="y2k-button primary" type="button" onClick={onConfirm}><Icon name="check" />{formatText(t.putInRainbow, { color: t.colors[selectedIndex] })}</button>
      </div>
    </section>
  )
}

function TodayScreen({ day, count, date, lang, t, loading, onCapture, onRemove, onComplete }) {
  const photos = day?.photos ?? {}
  const isComplete = Boolean(day?.completedAt)
  return (
    <section className="today-screen screen-enter" aria-labelledby="today-title">
      <div className="mission-head">
        <div><span className="micro-label">{formatDate(date, lang)}</span><h1 id="today-title">{isComplete ? t.missionComplete : t.todayMission}</h1></div>
        <div className="xp-chip"><Icon name="sparkle" size={16} /><b>{count}</b><span>/7</span></div>
      </div>
      <div className={`mission-card ${isComplete ? 'is-complete' : ''}`}>
        <div className="chrome-tag">DAILY QUEST</div>
        <div className="rainbow-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="mission-copy">
          <span>{isComplete ? t.questCleared : formatText(t.colorsLeft, { count: 7 - count })}</span>
          <h2>{isComplete ? t.rainbowReady : t.findTheRainbow}</h2>
          <p>{isComplete ? t.comeBackTomorrow : t.photoFirstHint}</p>
        </div>
      </div>

      <div className="collection-panel">
        <div className="panel-title"><h2>{t.colorSlots}</h2><span>{count === 7 ? t.allFound : formatText(t.foundCount, { count })}</span></div>
        {loading ? <div className="slot-loading" /> : <RainbowStrip photos={photos} labels={t.colors} interactive={!isComplete} onSelect={onRemove} />}
        {!isComplete && count > 0 ? <p className="slot-hint">{t.tapToRemove}</p> : null}
      </div>

      <div className="primary-zone">
        {isComplete ? (
          <div className="locked-message"><Icon name="lock" /><div><strong>{t.todayLocked}</strong><span>{t.comeBackTomorrow}</span></div></div>
        ) : count === 7 ? (
          <button className="y2k-button finish" type="button" onClick={onComplete}><Icon name="sparkle" />{t.completeRainbow}</button>
        ) : (
          <label className="capture-button">
            <input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} />
            <span className="capture-lens"><Icon name="camera" size={30} /></span>
            <span><b>{t.takePhoto}</b><small>{t.thenPickColor}</small></span>
          </label>
        )}
      </div>
    </section>
  )
}

function ArchiveScreen({ history, lang, t, onOpen }) {
  return (
    <section className="archive-screen screen-enter" aria-labelledby="archive-title">
      <div className="screen-title"><span className="chrome-kicker">RAINBOW LOG</span><h1 id="archive-title">{t.archiveTitle}</h1><p>{formatText(t.rainbowCount, { count: history.length })}</p></div>
      {history.length ? <div className="archive-grid">{history.map((item, index) => (
        <button type="button" className="archive-card" key={item.date} onClick={() => onOpen(item)} aria-label={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })}>
          <span className="archive-number">#{String(history.length - index).padStart(3, '0')}</span>
          <RainbowStrip photos={item.photos} labels={t.colors} />
          <span className="archive-date">{formatDate(item.date, lang, true)}</span>
        </button>
      ))}</div> : <div className="empty-archive"><div className="empty-disc"><Icon name="sparkle" size={42} /></div><h2>{t.noRainbows}</h2><p>{t.noRainbowsHint}</p></div>}
    </section>
  )
}

function SettingsScreen({ lang, setLang, t }) {
  return (
    <section className="settings-screen screen-enter" aria-labelledby="settings-title">
      <div className="screen-title"><span className="chrome-kicker">SYSTEM 2000</span><h1 id="settings-title">{t.settingsTitle}</h1><p>{t.settingsHint}</p></div>
      <div className="settings-card">
        <label htmlFor="language">{t.language}</label>
        <select id="language" value={lang} onChange={(event) => setLang(event.target.value)}>{Object.entries(LANGUAGE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      </div>
      <div className="settings-card info-card"><Icon name="lock" /><div><strong>{t.privateTitle}</strong><p>{t.privateHint}</p></div></div>
      <div className="about-sticker"><span>NIJI</span><b>拾色日記</b><small>v2.0 · Y2K EDITION</small></div>
    </section>
  )
}

function RainbowModal({ day, lang, t, onClose }) {
  if (!day) return null
  return <div className="modal-scrim" role="presentation" onMouseDown={onClose}><section className="rainbow-modal" role="dialog" aria-modal="true" aria-labelledby="modal-date" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={onClose} aria-label={t.close}>×</button><span className="chrome-kicker">MEMORY CARD</span><h2 id="modal-date">{formatDate(day.date, lang)}</h2><RainbowStrip photos={day.photos} labels={t.colors} /><p>{t.sevenMoments}</p></section></div>
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('niji-language') || 'zh-Hant')
  const [activeTab, setActiveTab] = useState(() => TAB_KEYS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today')
  const [day, setDay] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [staged, setStaged] = useState(null)
  const [selectedColor, setSelectedColor] = useState('red')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const messageTimer = useRef(null)
  const date = useMemo(localDateKey, [])
  const t = translations[lang]
  const photos = day?.photos ?? {}
  const count = COLOR_KEYS.reduce((total, key) => total + (photos[key] ? 1 : 0), 0)

  function showMessage(text) {
    clearTimeout(messageTimer.current)
    setMessage(text)
    messageTimer.current = setTimeout(() => setMessage(''), 3200)
  }

  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('niji-language', lang)
  }, [lang])

  useEffect(() => {
    const syncHash = () => { const next = location.hash.slice(1); if (TAB_KEYS.includes(next)) setActiveTab(next) }
    window.addEventListener('hashchange', syncHash)
    if (!location.hash) window.history.replaceState(null, '', '#today')
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([getDay(date), getCompletedDays()]).then(([savedDay, savedHistory]) => {
      if (!active) return
      setDay(savedDay ?? { schemaVersion: 1, date, photos: {}, completedAt: null })
      setHistory(savedHistory)
    }).catch(() => showMessage(translations[lang].error)).finally(() => { if (active) setLoading(false) })
    return () => { active = false; clearTimeout(messageTimer.current) }
  }, [date])

  function navigate(tab) {
    setStaged(null)
    setActiveTab(tab)
    location.hash = tab
  }

  async function handleCapture(file, input) {
    if (!file || day?.completedAt) return
    setProcessing(true)
    try {
      const result = await processPhoto(file)
      setStaged(result)
      setSelectedColor(result.suggestedKey)
      navigator.vibrate?.(30)
    } catch { showMessage(t.photoError) }
    finally { setProcessing(false); if (input) input.value = '' }
  }

  async function confirmColor() {
    if (!staged) return
    const nextDay = { ...day, photos: { ...photos, [selectedColor]: staged.image } }
    setDay(nextDay)
    setStaged(null)
    navigator.vibrate?.([25, 35, 25])
    showMessage(formatText(t.colorAdded, { color: t.colors[COLOR_KEYS.indexOf(selectedColor)] }))
    try { await saveDay(nextDay) } catch { showMessage(t.error) }
  }

  async function removeColor(key) {
    if (!photos[key] || day?.completedAt) return
    if (!window.confirm(formatText(t.removeConfirm, { color: t.colors[COLOR_KEYS.indexOf(key)] }))) return
    const nextPhotos = { ...photos }; delete nextPhotos[key]
    const nextDay = { ...day, photos: nextPhotos }
    setDay(nextDay)
    try { await saveDay(nextDay) } catch { showMessage(t.error) }
  }

  async function completeRainbow() {
    if (count !== 7 || day?.completedAt || !window.confirm(t.completeConfirm)) return
    const completedDay = { ...day, completedAt: new Date().toISOString() }
    setDay(completedDay)
    setHistory((current) => [completedDay, ...current.filter((item) => item.date !== date)])
    navigator.vibrate?.([50, 50, 100])
    showMessage(t.rainbowCompleteToast)
    try { await saveDay(completedDay) } catch { showMessage(t.error) }
  }

  const screen = activeTab === 'archive'
    ? <ArchiveScreen history={history} lang={lang} t={t} onOpen={setSelectedDay} />
    : activeTab === 'settings'
      ? <SettingsScreen lang={lang} setLang={setLang} t={t} />
      : staged
        ? <CaptureStage staged={staged} selectedColor={selectedColor} photos={photos} t={t} onSelect={setSelectedColor} onCancel={() => setStaged(null)} onConfirm={confirmColor} />
        : <TodayScreen day={day} count={count} date={date} lang={lang} t={t} loading={loading} onCapture={handleCapture} onRemove={removeColor} onComplete={completeRainbow} />

  return <div className="app-environment">
    <div className="ambient-bubble bubble-one" /><div className="ambient-bubble bubble-two" />
    <div className="app-shell">
      <a className="skip-link" href="#app-content">{t.skip}</a>
      <header className="app-header"><button className="app-logo" type="button" onClick={() => navigate('today')} aria-label={t.brand}><span className="logo-orb"><i /></span><span><b>NIJI</b><small>{t.brand}</small></span></button><div className="online-pill"><i />{t.localMode}</div></header>
      <main id="app-content" className="app-content" tabIndex="-1">{screen}</main>
      <nav className="bottom-nav" aria-label={t.mainNavigation}>{TAB_KEYS.map((key) => <button type="button" key={key} className={activeTab === key ? 'active' : ''} aria-current={activeTab === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={key === 'today' ? 'camera' : key === 'archive' ? 'book' : 'gear'} /><span>{t.tabs[key]}</span></button>)}</nav>
      {processing ? <div className="processing-overlay" role="status"><div className="scanner"><Icon name="sparkle" size={32} /></div><strong>{t.analyzing}</strong><span>{t.analyzingHint}</span></div> : null}
      <div className={`toast ${message ? 'show' : ''}`} aria-live="polite">{message}</div>
    </div>
    <RainbowModal day={selectedDay} lang={lang} t={t} onClose={() => setSelectedDay(null)} />
  </div>
}
