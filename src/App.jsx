import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzePixel, COLOR_KEYS } from './colorAnalysis.js'
import { formatText, translations } from './i18n.js'
import { getCompletedDays, getDay, saveDay } from './storage.js'

const LANGUAGE_LABELS = { 'zh-Hant': '繁體中文', en: 'English', ja: '日本語' }
const TAB_KEYS = ['today', 'archive', 'settings']
const FALLBACK_COLORS = { red: '#ff527b', orange: '#ff9d3d', yellow: '#f4d629', green: '#42d67a', blue: '#25a9f0', indigo: '#655ee8', violet: '#b34ee5' }
const QA_MODE = import.meta.env.DEV ? new URLSearchParams(location.search).get('qa') : null
const QA_SAMPLE = QA_MODE === 'sample' ? { image: './rainbow.svg', suggestedKey: 'green', sampleColor: 'rgb(66, 214, 122)', confidence: 82, samplePoint: { x: 0.5, y: 0.5 } } : null

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

function resetAppViewport() {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    const environment = document.querySelector('.app-environment')
    if (environment) environment.scrollTop = 0
  })
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

  const analysis = sampleSourcePhoto(image, { x: 0.5, y: 0.5 })
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

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image'))
    image.src = source
  })
}

function drawCover(context, image, width, height) {
  const imageRatio = image.width / image.height
  const targetRatio = width / height
  let sourceX = 0, sourceY = 0, sourceWidth = image.width, sourceHeight = image.height
  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio
    sourceX = (image.width - sourceWidth) / 2
  } else {
    sourceHeight = image.width / targetRatio
    sourceY = (image.height - sourceHeight) / 2
  }
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
}

function sampleSourcePhoto(image, point) {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const x = Math.max(0, Math.min(sourceWidth - 1, Math.round(point.x * (sourceWidth - 1))))
  const y = Math.max(0, Math.min(sourceHeight - 1, Math.round(point.y * (sourceHeight - 1))))
  const canvas = document.createElement('canvas')
  canvas.width = 1; canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = false
  context.drawImage(image, x, y, 1, 1, 0, 0, 1, 1)
  const analysis = analyzePixel(context.getImageData(0, 0, 1, 1).data, 1, 1, { x: 0, y: 0 })
  return { ...analysis, samplePoint: point, pixel: { x, y } }
}

async function renderComposite(background, samples, transform) {
  const image = await loadImageSource(background)
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1500
  const context = canvas.getContext('2d', { alpha: false })
  drawCover(context, image, canvas.width, canvas.height)
  const centerX = canvas.width * transform.x / 100
  const centerY = canvas.height * transform.y / 100
  const radius = canvas.width * 0.32 * transform.scale
  const band = radius * 0.12
  context.save()
  context.translate(centerX, centerY)
  context.rotate(transform.rotation * Math.PI / 180)
  context.lineCap = 'round'
  context.shadowColor = 'rgba(20, 10, 35, .35)'
  context.shadowBlur = radius * 0.025
  context.shadowOffsetY = radius * 0.025
  COLOR_KEYS.forEach((key, index) => {
    context.beginPath()
    context.arc(0, 0, radius - index * band, Math.PI, Math.PI * 2)
    context.strokeStyle = samples[key] || FALLBACK_COLORS[key]
    context.lineWidth = band + 2
    context.stroke()
  })
  context.restore()
  return canvas.toDataURL('image/jpeg', 0.88)
}

function EnergyStrip({ photos, samples = {}, labels, interactive = false, onSelect }) {
  return (
    <div className="rainbow-strip energy-strip" aria-label={interactive ? labels.join('、') : undefined}>
      {COLOR_KEYS.map((key, index) => {
        const style = photos[key] ? { background: samples[key] || FALLBACK_COLORS[key] } : undefined
        const content = photos[key] ? <><Icon name="check" size={18} /><small>{labels[index]}</small></> : <span>{index + 1}</span>
        return interactive
          ? <button type="button" key={key} style={style} className={`strip-${key}`} aria-label={labels[index]} onClick={() => onSelect(key)}>{content}</button>
          : <div key={key} style={style} className={`strip-${key}`}>{content}</div>
      })}
    </div>
  )
}

function SourceThumbs({ photos, samples = {}, labels }) {
  return <div className="source-thumbs" aria-label={labels.join('、')}>{COLOR_KEYS.map((key, index) => photos[key]
    ? <div className="source-thumb" key={key} style={{ '--sample': samples[key] || FALLBACK_COLORS[key] }}><img src={photos[key]} alt={labels[index]} loading="lazy" /><span>{labels[index]}</span></div>
    : null)}</div>
}

function RainbowArtwork({ samples, transform, onPointerDown, onPointerMove, onPointerUp }) {
  const style = { left: `${transform.x}%`, top: `${transform.y}%`, transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scale})` }
  return <div className="rainbow-artwork" style={style} role="img" aria-label="Rainbow" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <svg viewBox="0 0 300 316" aria-hidden="true">{COLOR_KEYS.map((key, index) => { const radius = 132 - index * 16; return <path key={key} d={`M ${150 - radius} 158 A ${radius} ${radius} 0 0 1 ${150 + radius} 158`} stroke={samples[key] || FALLBACK_COLORS[key]} /> })}</svg>
    <span className="drag-handle"><Icon name="sparkle" size={16} /></span>
  </div>
}

function ColorWheel({ selected, labels, sampleColor, sampleLabel, onSelect }) {
  return (
    <div className="color-wheel" role="group" aria-label={labels.join('、')}>
      <div className="wheel-ring" aria-hidden="true" />
      {COLOR_KEYS.map((key, index) => {
        const angle = -90 + index * (360 / 7)
        const radians = angle * Math.PI / 180
        const style = { '--wheel-x': `${50 + Math.cos(radians) * 38}%`, '--wheel-y': `${50 + Math.sin(radians) * 38}%` }
        return <button type="button" key={key} style={style} className={`wheel-choice wheel-${key} ${selected === key ? 'selected' : ''}`} aria-pressed={selected === key} onClick={() => onSelect(key)}><i aria-hidden="true" /><span>{labels[index]}</span>{selected === key ? <b><Icon name="check" size={13} /></b> : null}</button>
      })}
      <div className="wheel-center" style={{ '--sample': sampleColor }} role="img" aria-label={`${sampleLabel}: ${sampleColor}`} />
    </div>
  )
}

function CaptureStage({ staged, selectedColor, photos, t, onSelect, onCancel, onConfirm, onOpenSampler }) {
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
        <button className="photo-preview sample-preview" type="button" onClick={onOpenSampler} aria-label={t.expandToSample}>
          <img src={staged.image} alt={t.newPhotoAlt} />
          <span className="sample-reticle" style={{ left: `${staged.samplePoint.x * 100}%`, top: `${staged.samplePoint.y * 100}%`, '--sample': staged.sampleColor }}><i /></span>
          <small>{t.expandToSample}</small>
        </button>
        <ColorWheel selected={selectedColor} labels={t.colors} sampleColor={staged.sampleColor} sampleLabel={t.currentSample} onSelect={onSelect} />
      </div>
      <div className="stage-actions">
        {replacing ? <p className="replace-warning" role="status">{formatText(t.replaceWarning, { color: t.colors[selectedIndex] })}</p> : null}
        <button className="y2k-button primary" type="button" onClick={onConfirm}><Icon name="check" />{formatText(t.putInRainbow, { color: t.colors[selectedIndex] })}</button>
      </div>
    </section>
  )
}

function FullscreenSampler({ staged, t, onClose, onSample }) {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [imageAspect, setImageAspect] = useState(1)
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  function clampZoom(value) { return Math.max(1, Math.min(4, value)) }

  function zoomBy(amount) {
    setView((current) => {
      const zoom = clampZoom(current.zoom + amount)
      return { zoom, x: zoom === 1 ? 0 : current.x, y: zoom === 1 ? 0 : current.y }
    })
  }

  function resetView() { setView({ zoom: 1, x: 0, y: 0 }) }

  function pointerDown(event) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false })
    const values = [...pointers.current.values()]
    if (values.length === 1) gesture.current = { type: 'pan', lastX: event.clientX, lastY: event.clientY }
    if (values.length === 2) {
      const [a, b] = values
      a.moved = true; b.moved = true
      gesture.current = { type: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y), centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2, view }
    }
  }

  function pointerMove(event) {
    const pointer = pointers.current.get(event.pointerId)
    if (!pointer) return
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 7) pointer.moved = true
    pointer.x = event.clientX; pointer.y = event.clientY
    const values = [...pointers.current.values()]
    if (values.length === 2 && gesture.current?.type === 'pinch') {
      const [a, b] = values
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const centerX = (a.x + b.x) / 2, centerY = (a.y + b.y) / 2
      const zoom = clampZoom(gesture.current.view.zoom * distance / Math.max(1, gesture.current.distance))
      setView({ zoom, x: gesture.current.view.x + centerX - gesture.current.centerX, y: gesture.current.view.y + centerY - gesture.current.centerY })
    } else if (values.length === 1 && gesture.current?.type === 'pan' && view.zoom > 1) {
      const dx = event.clientX - gesture.current.lastX, dy = event.clientY - gesture.current.lastY
      gesture.current.lastX = event.clientX; gesture.current.lastY = event.clientY
      setView((current) => ({ ...current, x: Math.max(-320, Math.min(320, current.x + dx)), y: Math.max(-320, Math.min(320, current.y + dy)) }))
    }
  }

  function pointerUp(event) {
    const pointer = pointers.current.get(event.pointerId)
    const wasSingleTap = pointers.current.size === 1 && pointer && !pointer.moved
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointers.current.delete(event.pointerId)
    if (wasSingleTap) {
      const image = event.currentTarget.querySelector('.sampler-image')
      const rect = image?.getBoundingClientRect()
      if (image && rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
        onSample(image, { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height })
      }
    }
    const remaining = [...pointers.current.values()]
    gesture.current = remaining.length === 1 ? { type: 'pan', lastX: remaining[0].x, lastY: remaining[0].y } : null
  }

  function wheelZoom(event) {
    event.preventDefault()
    zoomBy(event.deltaY < 0 ? 0.2 : -0.2)
  }

  return <section className="sampler-overlay" role="dialog" aria-modal="true" aria-labelledby="sampler-title">
    <header className="sampler-header"><button className="icon-button" type="button" onClick={onClose} aria-label={t.cancel}><Icon name="back" /></button><div><span className="chrome-kicker">COLOR PICKER</span><h2 id="sampler-title">{t.samplerTitle}</h2></div><div className="sampler-live" style={{ '--sample': staged.sampleColor }}><i /><span>{t.currentSample}<small>{staged.sampleColor.replace('rgb', '')}</small></span></div></header>
    <div className="sampler-viewport" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={wheelZoom}>
      <div className="sampler-media" style={{ '--image-aspect': imageAspect, '--inverse-zoom': 1 / view.zoom, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})` }}>
        <img className="sampler-image" src={staged.image} alt={t.newPhotoAlt} draggable="false" onLoad={(event) => setImageAspect(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight || 1)} />
        <span className="sample-reticle sampler-reticle" style={{ left: `${staged.samplePoint.x * 100}%`, top: `${staged.samplePoint.y * 100}%`, '--sample': staged.sampleColor }}><i /></span>
      </div>
    </div>
    <footer className="sampler-footer"><p>{t.pinchHint}</p><div className="zoom-controls"><button type="button" onClick={() => zoomBy(-0.25)} aria-label={t.zoomOut}>−</button><output aria-label={t.zoomLevel}>{Math.round(view.zoom * 100)}%</output><button type="button" onClick={() => zoomBy(0.25)} aria-label={t.zoomIn}>＋</button><button type="button" className="reset-zoom" onClick={resetView}>{t.resetZoom}</button></div><button className="y2k-button sampler-done" type="button" onClick={onClose}><Icon name="check" />{t.finishSampling}</button></footer>
  </section>
}

function TodayScreen({ day, count, date, lang, t, loading, onCapture, onRemove, onStartCompose }) {
  const photos = day?.photos ?? {}
  const samples = day?.samples ?? {}
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
        {loading ? <div className="slot-loading" /> : <EnergyStrip photos={photos} samples={samples} labels={t.colors} interactive={!isComplete} onSelect={onRemove} />}
        {!isComplete && count > 0 ? <p className="slot-hint">{t.tapToRemove}</p> : null}
      </div>

      <div className="primary-zone">
        {isComplete ? (
          <div className="locked-message"><Icon name="lock" /><div><strong>{t.todayLocked}</strong><span>{t.comeBackTomorrow}</span></div></div>
        ) : count === 7 ? (
          <button className="y2k-button finish" type="button" onClick={onStartCompose}><Icon name="sparkle" />{t.createRainbowCard}</button>
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

function ComposeScreen({ background, samples, transform, setTransform, t, onCapture, onBack, onFinish, finishing }) {
  const dragState = useRef(null)

  function startDrag(event) {
    const frame = event.currentTarget.closest('.composition-canvas')?.getBoundingClientRect()
    if (!frame) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { clientX: event.clientX, clientY: event.clientY, x: transform.x, y: transform.y, width: frame.width, height: frame.height }
  }

  function moveDrag(event) {
    if (!dragState.current) return
    const start = dragState.current
    const x = Math.max(12, Math.min(88, start.x + (event.clientX - start.clientX) / start.width * 100))
    const y = Math.max(18, Math.min(88, start.y + (event.clientY - start.clientY) / start.height * 100))
    setTransform((current) => ({ ...current, x, y }))
  }

  function endDrag(event) {
    if (dragState.current && event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragState.current = null
  }

  function updateValue(key, value) {
    setTransform((current) => ({ ...current, [key]: Number(value) }))
  }

  return <section className="compose-screen screen-enter" aria-labelledby="compose-title">
    <button className="icon-button compose-back" type="button" onClick={onBack} aria-label={t.cancel}><Icon name="back" /></button>
    <div className="compose-heading"><span className="chrome-kicker">RAINBOW STUDIO</span><h1 id="compose-title">{t.composeTitle}</h1><p>{background ? t.composeHint : t.backgroundHint}</p></div>
    {!background ? <div className="background-capture-card"><div className="camera-portal"><Icon name="camera" size={46} /></div><h2>{t.takeBackground}</h2><p>{t.takeBackgroundHint}</p><label className="capture-button compact"><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><span className="capture-lens"><Icon name="camera" /></span><span><b>{t.openCamera}</b><small>{t.backgroundOnly}</small></span></label></div> : <>
      <div className="composer-layout">
        <div className="composition-canvas"><img src={background} alt={t.backgroundAlt} /><RainbowArtwork samples={samples} transform={transform} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} /></div>
        <div className="editor-controls">
          <div className="control-head"><strong>{t.adjustRainbow}</strong><label className="replace-background"><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} />{t.retakeBackground}</label></div>
          <label><span>{t.size}<output>{Math.round(transform.scale * 100)}%</output></span><input aria-label={t.size} type="range" min="0.55" max="1.35" step="0.01" value={transform.scale} onChange={(event) => updateValue('scale', event.target.value)} /></label>
          <label><span>{t.rotation}<output>{Math.round(transform.rotation)}°</output></span><input aria-label={t.rotation} type="range" min="-35" max="35" step="1" value={transform.rotation} onChange={(event) => updateValue('rotation', event.target.value)} /></label>
          <label><span>{t.horizontal}<output>{Math.round(transform.x)}%</output></span><input aria-label={t.horizontal} type="range" min="12" max="88" step="1" value={transform.x} onChange={(event) => updateValue('x', event.target.value)} /></label>
          <label><span>{t.vertical}<output>{Math.round(transform.y)}%</output></span><input aria-label={t.vertical} type="range" min="18" max="88" step="1" value={transform.y} onChange={(event) => updateValue('y', event.target.value)} /></label>
          <button className="y2k-button finish-card" type="button" disabled={finishing} onClick={onFinish}><Icon name="check" />{finishing ? t.developing : t.finishCard}</button>
        </div>
      </div>
    </>}
  </section>
}

function ArchiveScreen({ history, lang, t, onOpen }) {
  return (
    <section className="archive-screen screen-enter" aria-labelledby="archive-title">
      <div className="screen-title"><span className="chrome-kicker">RAINBOW LOG</span><h1 id="archive-title">{t.archiveTitle}</h1><p>{formatText(t.rainbowCount, { count: history.length })}</p></div>
      {history.length ? <div className="archive-grid">{history.map((item, index) => (
        <button type="button" className="archive-card" key={item.date} onClick={() => onOpen(item)} aria-label={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })}>
          <span className="archive-number">#{String(history.length - index).padStart(3, '0')}</span>
          <div className="polaroid-preview">{item.cardImage ? <img src={item.cardImage} alt={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })} loading="lazy" /> : <EnergyStrip photos={item.photos} samples={item.samples} labels={t.colors} />}</div>
          <SourceThumbs photos={item.photos} samples={item.samples} labels={t.colors} />
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
  return <div className="modal-scrim" role="presentation" onMouseDown={onClose}><section className="rainbow-modal" role="dialog" aria-modal="true" aria-labelledby="modal-date" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={onClose} aria-label={t.close}>×</button><span className="chrome-kicker">MEMORY CARD</span><h2 id="modal-date">{formatDate(day.date, lang)}</h2><div className="modal-polaroid">{day.cardImage ? <img src={day.cardImage} alt={formatText(t.viewRainbow, { date: formatDate(day.date, lang) })} /> : <EnergyStrip photos={day.photos} samples={day.samples} labels={t.colors} />}</div><SourceThumbs photos={day.photos} samples={day.samples} labels={t.colors} /><p>{t.sevenMoments}</p></section></div>
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('niji-language') || 'zh-Hant')
  const [activeTab, setActiveTab] = useState(() => TAB_KEYS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'today')
  const [day, setDay] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [staged, setStaged] = useState(QA_SAMPLE)
  const [samplerOpen, setSamplerOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState('red')
  const [composing, setComposing] = useState(QA_MODE === 'compose')
  const [background, setBackground] = useState(QA_MODE === 'compose' ? './rainbow.svg' : null)
  const [rainbowTransform, setRainbowTransform] = useState({ x: 50, y: 58, scale: 1, rotation: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [finishing, setFinishing] = useState(false)
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
    if (QA_MODE) {
      const qaPhotos = Object.fromEntries(COLOR_KEYS.map((key) => [key, './rainbow.svg']))
      setDay({ schemaVersion: 2, date, photos: qaPhotos, samples: FALLBACK_COLORS, completedAt: null })
      setHistory([])
      setLoading(false)
      return undefined
    }
    let active = true
    Promise.all([getDay(date), getCompletedDays()]).then(([savedDay, savedHistory]) => {
      if (!active) return
      setDay(savedDay ? { ...savedDay, samples: savedDay.samples ?? {} } : { schemaVersion: 2, date, photos: {}, samples: {}, completedAt: null })
      setHistory(savedHistory)
    }).catch(() => showMessage(translations[lang].error)).finally(() => { if (active) setLoading(false) })
    return () => { active = false; clearTimeout(messageTimer.current) }
  }, [date])

  function navigate(tab) {
    setStaged(null)
    setSamplerOpen(false)
    setComposing(false)
    setActiveTab(tab)
    location.hash = tab
    resetAppViewport()
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
    const nextDay = { ...day, schemaVersion: 2, photos: { ...photos, [selectedColor]: staged.image }, samples: { ...(day.samples ?? {}), [selectedColor]: staged.sampleColor } }
    setDay(nextDay)
    setStaged(null)
    setSamplerOpen(false)
    navigator.vibrate?.([25, 35, 25])
    showMessage(formatText(t.colorAdded, { color: t.colors[COLOR_KEYS.indexOf(selectedColor)] }))
    try { await saveDay(nextDay) } catch { showMessage(t.error) }
    if (COLOR_KEYS.every((key) => nextDay.photos[key])) {
      setComposing(true)
      resetAppViewport()
    }
  }

  function resamplePhoto(image, point) {
    const analysis = sampleSourcePhoto(image, point)
    setStaged((current) => ({ ...current, ...analysis }))
    setSelectedColor(analysis.suggestedKey)
    navigator.vibrate?.(20)
  }

  async function removeColor(key) {
    if (!photos[key] || day?.completedAt) return
    if (!window.confirm(formatText(t.removeConfirm, { color: t.colors[COLOR_KEYS.indexOf(key)] }))) return
    const nextPhotos = { ...photos }; delete nextPhotos[key]
    const nextSamples = { ...(day.samples ?? {}) }; delete nextSamples[key]
    const nextDay = { ...day, photos: nextPhotos, samples: nextSamples }
    setDay(nextDay)
    try { await saveDay(nextDay) } catch { showMessage(t.error) }
  }

  async function handleBackground(file, input) {
    if (!file) return
    setProcessing(true)
    try {
      const result = await processPhoto(file)
      setBackground(result.image)
      navigator.vibrate?.(30)
    } catch { showMessage(t.photoError) }
    finally { setProcessing(false); if (input) input.value = '' }
  }

  async function finishRainbowCard() {
    if (!background || finishing || count !== 7 || day?.completedAt) return
    setFinishing(true)
    try {
      const cardImage = await renderComposite(background, day.samples ?? {}, rainbowTransform)
      const completedDay = { ...day, schemaVersion: 2, cardImage, composition: rainbowTransform, completedAt: new Date().toISOString() }
      setDay(completedDay)
      setHistory((current) => [completedDay, ...current.filter((item) => item.date !== date)])
      setComposing(false)
      setBackground(null)
      navigator.vibrate?.([50, 50, 100])
      showMessage(t.rainbowCompleteToast)
      resetAppViewport()
      await saveDay(completedDay)
    } catch { showMessage(t.error) }
    finally { setFinishing(false) }
  }

  function startCompose() {
    if (count === 7 && !day?.completedAt) {
      setComposing(true)
      resetAppViewport()
    }
  }

  function exitCompose() {
    setComposing(false)
    resetAppViewport()
  }

  const screen = activeTab === 'archive'
    ? <ArchiveScreen history={history} lang={lang} t={t} onOpen={setSelectedDay} />
    : activeTab === 'settings'
      ? <SettingsScreen lang={lang} setLang={setLang} t={t} />
      : staged
        ? <CaptureStage staged={staged} selectedColor={selectedColor} photos={photos} t={t} onSelect={setSelectedColor} onCancel={() => { setStaged(null); setSamplerOpen(false) }} onConfirm={confirmColor} onOpenSampler={() => setSamplerOpen(true)} />
        : composing
          ? <ComposeScreen background={background} samples={day?.samples ?? {}} transform={rainbowTransform} setTransform={setRainbowTransform} t={t} onCapture={handleBackground} onBack={exitCompose} onFinish={finishRainbowCard} finishing={finishing} />
          : <TodayScreen day={day} count={count} date={date} lang={lang} t={t} loading={loading} onCapture={handleCapture} onRemove={removeColor} onStartCompose={startCompose} />

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
    {samplerOpen && staged ? <FullscreenSampler staged={staged} t={t} onClose={() => setSamplerOpen(false)} onSample={resamplePhoto} /> : null}
    <RainbowModal day={selectedDay} lang={lang} t={t} onClose={() => setSelectedDay(null)} />
  </div>
}
