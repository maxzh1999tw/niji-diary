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
  if (name === 'upload') return <svg {...common}><path d="M12 16V3" /><path d="m7 8 5-5 5 5" /><path d="M5 13H3v8h18v-8h-2" /></svg>
  if (name === 'opacity') return <svg {...common}><path d="M12 3s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z" /><path d="M8.5 15.5a3.5 3.5 0 0 0 7 0" /></svg>
  if (name === 'radius') return <svg {...common}><path d="M4 18A10 10 0 0 1 20 18" /><path d="M12 18V8" /><path d="m9 11 3-3 3 3" /></svg>
  if (name === 'width') return <svg {...common}><path d="M4 8h16" /><path d="M4 16h16" /><path d="M8 5v6" /><path d="M16 13v6" /></svg>
  if (name === 'angle') return <svg {...common}><path d="M5 19 12 5l7 14" /><path d="M8.5 12a7 7 0 0 0 7 0" /></svg>
  if (name === 'download') return <svg {...common}><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></svg>
  if (name === 'share') return <svg {...common}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4" /><path d="m8.7 13.3 6.6 4.4" /></svg>
  if (name === 'edit') return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
  if (name === 'book') return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>
  if (name === 'gear') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.08V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.51-1H3v-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3h4v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.51 1H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>
  if (name === 'sparkle') return <svg {...common}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>
  if (name === 'back') return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>
  if (name === 'reset') return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
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

function dataUrlToFile(dataUrl, filename) {
  if (!dataUrl?.startsWith('data:')) return null
  const [header, encoded] = dataUrl.split(',')
  const type = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new File([bytes], filename, { type })
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

function drawCoverAt(context, image, x, y, width, height) {
  context.save()
  context.translate(x, y)
  drawCover(context, image, width, height)
  context.restore()
}

function fitCanvasText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length && context.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1)
  return `${fitted}…`
}

async function renderPolaroidImage(day, lang, fallbackCaption) {
  if (!day?.cardImage) throw new Error('Missing Rainbow Card image')
  await document.fonts?.ready
  const width = 1000
  const height = 1450
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { alpha: false })
  const paper = context.createLinearGradient(0, 0, width, height)
  paper.addColorStop(0, '#ffffff')
  paper.addColorStop(0.58, '#fdfcf9')
  paper.addColorStop(1, '#f5f3ee')
  context.fillStyle = paper
  context.fillRect(0, 0, width, height)

  const mainImage = await loadImageSource(day.cardImage)
  const photoX = 35
  const photoY = 35
  const photoWidth = 930
  const photoHeight = 1162.5
  context.fillStyle = '#e8e1ec'
  context.fillRect(photoX, photoY, photoWidth, photoHeight)
  drawCoverAt(context, mainImage, photoX, photoY, photoWidth, photoHeight)
  context.strokeStyle = 'rgba(18,13,21,.1)'
  context.lineWidth = 2
  context.strokeRect(photoX, photoY, photoWidth, photoHeight)

  const sourceY = 1221.5
  const sourceHeight = 115
  const sourceGap = 11.5
  const sourceStartX = 42
  const sourceAreaWidth = 916
  const sourceWidth = (sourceAreaWidth - sourceGap * 6) / 7
  const sourceImages = await Promise.all(COLOR_KEYS.map(async (key) => {
    if (!day.photos?.[key]) return null
    try { return await loadImageSource(day.photos[key]) } catch { return null }
  }))

  COLOR_KEYS.forEach((key, index) => {
    const x = sourceStartX + index * (sourceWidth + sourceGap)
    context.fillStyle = '#fffefa'
    context.fillRect(x, sourceY, sourceWidth, sourceHeight)
    context.strokeStyle = 'rgba(69,60,67,.2)'
    context.lineWidth = 1.5
    context.strokeRect(x, sourceY, sourceWidth, sourceHeight)
    const innerX = x + 7
    const innerY = sourceY + 7
    const innerWidth = sourceWidth - 14
    const innerHeight = sourceHeight - 22
    context.fillStyle = day.samples?.[key] || FALLBACK_COLORS[key]
    context.fillRect(innerX, innerY, innerWidth, innerHeight)
    if (sourceImages[index]) drawCoverAt(context, sourceImages[index], innerX, innerY, innerWidth, innerHeight)
    context.fillStyle = day.samples?.[key] || FALLBACK_COLORS[key]
    context.fillRect(x, sourceY + sourceHeight - 8, sourceWidth, 8)
  })

  const caption = day.caption ?? fallbackCaption
  const dateText = formatDate(day.date, lang, true)
  context.textBaseline = 'middle'
  context.fillStyle = '#241435'
  context.font = '600 31px "Noto Sans TC", "Segoe UI", sans-serif'
  const dateWidth = 180
  context.fillText(fitCanvasText(context, caption, width - 100 - dateWidth), 50, 1393)
  context.fillStyle = '#625c63'
  context.font = '600 25px "Noto Sans TC", "Segoe UI", sans-serif'
  context.textAlign = 'right'
  context.fillText(dateText, 950, 1393)
  context.textAlign = 'left'
  return canvas.toDataURL('image/png')
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
  const baseRadius = canvas.width * 0.32 * transform.scale
  const outerRadius = baseRadius * (transform.radius ?? 1)
  const colorWidth = baseRadius * 0.075 * (transform.colorWidth ?? 1)
  const innerRadius = Math.max(2, outerRadius - colorWidth * COLOR_KEYS.length)
  const angle = Math.max(10, Math.min(180, transform.angle ?? 180))
  const angleRadians = angle * Math.PI / 180
  const startAngle = -Math.PI / 2 - angleRadians / 2
  const endAngle = -Math.PI / 2 + angleRadians / 2
  const halfChord = Math.max(1, outerRadius * Math.sin(angleRadians / 2))
  const transparency = transform.transparency ?? (transform.opacity == null ? 0 : 1 - transform.opacity)
  const visibleOpacity = 1 - transparency
  const rainbowLayer = document.createElement('canvas')
  rainbowLayer.width = canvas.width; rainbowLayer.height = canvas.height
  const light = rainbowLayer.getContext('2d')

  const makeSpectrum = () => {
    const gradient = light.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius)
    const reversedColorKeys = [...COLOR_KEYS].reverse()
    gradient.addColorStop(0, samples.violet || FALLBACK_COLORS.violet)
    reversedColorKeys.forEach((key, index) => gradient.addColorStop((index + 0.5) / COLOR_KEYS.length, samples[key] || FALLBACK_COLORS[key]))
    gradient.addColorStop(1, samples.red || FALLBACK_COLORS.red)
    return gradient
  }

  const drawSpectrum = (alpha, blur) => {
    light.globalAlpha = alpha
    light.filter = `blur(${blur}px) saturate(165%) brightness(118%)`
    light.fillStyle = makeSpectrum()
    light.beginPath()
    light.arc(0, 0, outerRadius, startAngle, endAngle)
    light.arc(0, 0, innerRadius, endAngle, startAngle, true)
    light.closePath()
    light.fill()
  }

  light.save()
  light.translate(centerX, centerY)
  light.rotate(transform.rotation * Math.PI / 180)
  light.globalCompositeOperation = 'screen'
  drawSpectrum(0.34, colorWidth * COLOR_KEYS.length * 0.18)
  drawSpectrum(1, colorWidth * 0.08)
  light.filter = 'none'
  light.globalAlpha = 1
  light.globalCompositeOperation = 'destination-in'
  const endFade = light.createLinearGradient(-halfChord, 0, halfChord, 0)
  endFade.addColorStop(0, 'rgba(255,255,255,0)')
  endFade.addColorStop(0.1, 'white')
  endFade.addColorStop(0.9, 'white')
  endFade.addColorStop(1, 'rgba(255,255,255,0)')
  light.fillStyle = endFade
  light.fillRect(-outerRadius * 1.15, -outerRadius * 1.15, outerRadius * 2.3, outerRadius * 1.3)
  light.restore()

  context.save()
  context.globalAlpha = visibleOpacity
  context.globalCompositeOperation = 'source-over'
  context.drawImage(rainbowLayer, 0, 0)
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

function PolaroidSourceStrip({ photos = {}, samples = {}, labels }) {
  return <div className="polaroid-sources" aria-label={labels.join('、')}>{COLOR_KEYS.map((key, index) => (
    <div className="polaroid-source-photo" key={key} style={{ '--sample': samples[key] || FALLBACK_COLORS[key] }}>
      {photos[key] ? <img src={photos[key]} alt={labels[index]} loading="lazy" /> : <i aria-hidden="true" />}
    </div>
  ))}</div>
}

function PolaroidCard({ image, alt, media, overlay, photos, samples, labels, date, lang, className = '', children }) {
  return <div className={`polaroid-card ${className}`}><div className="polaroid-photo">{image ? <img src={image} alt={alt} loading="lazy" /> : media}{overlay}</div><PolaroidSourceStrip photos={photos} samples={samples} labels={labels} /><div className="polaroid-footer"><div className="polaroid-caption-slot">{children}</div><time className="polaroid-date" dateTime={date}>{formatDate(date, lang, true)}</time></div></div>
}

function PolaroidCaption({ children }) {
  return <span className="polaroid-caption-text">{children}</span>
}

function EditablePolaroidCaption({ value, t, onChange, onCommit }) {
  return <input className="polaroid-caption-input" aria-label={t.captionLabel} type="text" maxLength="60" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onCommit} />
}

function RainbowArtwork({ samples, transform, label, onPointerDown, onPointerMove, onPointerUp, onWheel }) {
  const transparency = transform.transparency ?? (transform.opacity == null ? 0 : 1 - transform.opacity)
  const style = { left: `${transform.x}%`, top: `${transform.y}%`, opacity: 1 - transparency, transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scale})` }
  const outerRadius = 132 * (transform.radius ?? 1)
  const colorWidth = 12 * (transform.colorWidth ?? 1)
  const innerRadius = Math.max(2, outerRadius - colorWidth * COLOR_KEYS.length)
  const angle = Math.max(10, Math.min(180, transform.angle ?? 180))
  const halfAngle = angle * Math.PI / 360
  const startAngle = -Math.PI / 2 - halfAngle
  const endAngle = -Math.PI / 2 + halfAngle
  const point = (radius, radians) => ({ x: 150 + radius * Math.cos(radians), y: 158 + radius * Math.sin(radians) })
  const outerStart = point(outerRadius, startAngle)
  const outerEnd = point(outerRadius, endAngle)
  const innerStart = point(innerRadius, startAngle)
  const innerEnd = point(innerRadius, endAngle)
  const arc = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y} Z`
  const innerRatio = innerRadius / outerRadius
  const outerEdgeStart = innerRatio + (1 - innerRatio) * 0.985
  const spectrumStops = [...COLOR_KEYS].reverse().map((key, index) => <stop key={key} offset={innerRatio + (1 - innerRatio) * (index + 0.5) / COLOR_KEYS.length} stopColor={samples[key] || FALLBACK_COLORS[key]} />)
  return <div className="rainbow-artwork" style={style} role="img" aria-label={label} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
    <svg viewBox="0 0 300 316" aria-hidden="true">
      <defs>
        <radialGradient id="rainbow-spectrum" gradientUnits="userSpaceOnUse" cx="150" cy="158" r={outerRadius}>
          <stop offset={Math.max(0, innerRatio - 0.012)} stopColor={samples.violet || FALLBACK_COLORS.violet} stopOpacity="0" />
          <stop offset={innerRatio} stopColor={samples.violet || FALLBACK_COLORS.violet} />
          {spectrumStops}
          <stop offset={outerEdgeStart} stopColor={samples.red || FALLBACK_COLORS.red} />
          <stop offset="1" stopColor={samples.red || FALLBACK_COLORS.red} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rainbow-end-fade" gradientUnits="userSpaceOnUse" x1={outerStart.x} y1={outerStart.y} x2={outerEnd.x} y2={outerEnd.y}><stop offset="0" stopColor="white" stopOpacity="0" /><stop offset=".1" stopColor="white" /><stop offset=".9" stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
        <mask id="rainbow-fade-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={150 - outerRadius * 1.25} y={158 - outerRadius * 1.25} width={outerRadius * 2.5} height={outerRadius * 2.5}><rect x={150 - outerRadius * 1.25} y={158 - outerRadius * 1.25} width={outerRadius * 2.5} height={outerRadius * 2.5} fill="url(#rainbow-end-fade)" /></mask>
        <filter id="rainbow-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /><feColorMatrix type="saturate" values="1.55" /></filter>
        <filter id="rainbow-soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation=".9" /><feColorMatrix type="saturate" values="1.45" /></filter>
      </defs>
      <path className="rainbow-glow" d={arc} fill="url(#rainbow-spectrum)" mask="url(#rainbow-fade-mask)" filter="url(#rainbow-glow)" />
      <path className="rainbow-spectrum" d={arc} fill="url(#rainbow-spectrum)" mask="url(#rainbow-fade-mask)" filter="url(#rainbow-soft)" />
    </svg>
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
  const [activeTool, setActiveTool] = useState('transparency')
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const liveTransform = useRef(transform)
  liveTransform.current = transform

  function beginGesture(event) {
    const frame = event.currentTarget.closest('.composition-canvas')?.getBoundingClientRect()
    if (!frame) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    restartGesture(frame)
  }

  function restartGesture(frame) {
    const points = [...pointers.current.values()]
    if (points.length >= 2) {
      const [a, b] = points
      gesture.current = {
        mode: 'pinch', frame, transform: liveTransform.current,
        centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2,
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
      }
    } else if (points.length === 1) {
      gesture.current = { mode: 'pan', frame, transform: liveTransform.current, x: points[0].x, y: points[0].y }
    } else gesture.current = null
  }

  function moveGesture(event) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    event.preventDefault()
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    const start = gesture.current

    if (start.mode === 'pinch' && points.length >= 2) {
      const [a, b] = points
      const centerX = (a.x + b.x) / 2
      const centerY = (a.y + b.y) / 2
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const next = {
        ...start.transform,
        x: start.transform.x + (centerX - start.centerX) / start.frame.width * 100,
        y: start.transform.y + (centerY - start.centerY) / start.frame.height * 100,
        scale: start.transform.scale * distance / Math.max(start.distance, Number.EPSILON),
        rotation: start.transform.rotation + (angle - start.angle) * 180 / Math.PI,
      }
      liveTransform.current = next
      setTransform(next)
    } else if (start.mode === 'pan' && points.length === 1) {
      const next = { ...start.transform, x: start.transform.x + (points[0].x - start.x) / start.frame.width * 100, y: start.transform.y + (points[0].y - start.y) / start.frame.height * 100 }
      liveTransform.current = next
      setTransform(next)
    }
  }

  function endGesture(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointers.current.delete(event.pointerId)
    const frame = event.currentTarget.closest('.composition-canvas')?.getBoundingClientRect()
    if (frame) restartGesture(frame)
  }

  function zoomWithWheel(event) {
    event.preventDefault()
    const factor = Math.exp(-event.deltaY * 0.0015)
    setTransform((current) => {
      const next = { ...current, scale: current.scale * factor }
      liveTransform.current = next
      return next
    })
  }

  function resetRainbow() {
    const next = { x: 50, y: 58, scale: 1, rotation: 0, transparency: 0, radius: 1, colorWidth: 1, angle: 180 }
    liveTransform.current = next
    setTransform(next)
  }

  const editorTools = [
    { key: 'transparency', icon: 'opacity', label: t.toolTransparency, title: t.transparency, min: 0, max: 1, step: 0.01, value: transform.transparency ?? 0, output: `${Math.round((transform.transparency ?? 0) * 100)}%` },
    { key: 'radius', icon: 'radius', label: t.toolRadius, title: t.rainbowRadius, min: 0.55, max: 15, step: 0.05, value: transform.radius ?? 1, output: `${Math.round((transform.radius ?? 1) * 100)}%` },
    { key: 'angle', icon: 'angle', label: t.toolAngle, title: t.rainbowAngle, min: 10, max: 180, step: 1, value: transform.angle ?? 180, output: `${Math.round(transform.angle ?? 180)}°` },
  ]
  const activeControl = editorTools.find((tool) => tool.key === activeTool) ?? editorTools[0]

  return <section className="compose-screen screen-enter" aria-labelledby="compose-title">
    <header className="studio-topbar"><button className="icon-button" type="button" onClick={onBack} aria-label={t.cancel}><Icon name="back" /></button><div><span>RAINBOW STUDIO</span><h1 id="compose-title">{background ? t.adjustRainbow : t.composeTitle}</h1></div>{background ? <button className="studio-finish" type="button" disabled={finishing} onClick={onFinish}><Icon name="check" size={18} />{finishing ? t.developing : t.done}</button> : <i aria-hidden="true" />}</header>
    {!background ? <div className="background-capture-card"><div className="camera-portal"><Icon name="camera" size={46} /></div><h2>{t.takeBackground}</h2><p>{t.takeBackgroundHint}</p><div className="background-source-actions"><label className="background-source camera-source"><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="camera" /><span><b>{t.openCamera}</b><small>{t.backgroundOnly}</small></span></label><label className="background-source upload-source"><input type="file" accept="image/*" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="upload" /><span><b>{t.uploadBackground}</b><small>{t.chooseFromDevice}</small></span></label></div></div> : <div className="studio-workspace">
      <div className="canvas-stage"><div className="composition-canvas"><img src={background} alt={t.backgroundAlt} /><RainbowArtwork samples={samples} transform={transform} label={t.adjustRainbow} onPointerDown={beginGesture} onPointerMove={moveGesture} onPointerUp={endGesture} onWheel={zoomWithWheel} /><div className="canvas-source-actions"><label title={t.retakeBackground}><input type="file" accept="image/*" capture="environment" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="camera" size={17} /><span>{t.retakeBackground}</span></label><label title={t.uploadBackground}><input type="file" accept="image/*" onChange={(event) => onCapture(event.target.files?.[0], event.target)} /><Icon name="upload" size={17} /><span>{t.uploadBackground}</span></label></div></div></div>
      <div className="editor-dock">
        <label className="active-editor-control"><span>{activeControl.title}<output>{activeControl.output}</output></span><input aria-label={activeControl.title} type="range" min={activeControl.min} max={activeControl.max} step={activeControl.step} value={activeControl.value} onChange={(event) => setTransform((current) => ({ ...current, [activeControl.key]: Number(event.target.value) }))} /></label>
        <div className="editor-toolbar" role="toolbar" aria-label={t.editorTools}>{editorTools.map((tool) => <button type="button" key={tool.key} className={activeTool === tool.key ? 'active' : ''} aria-pressed={activeTool === tool.key} onClick={() => setActiveTool(tool.key)}><Icon name={tool.icon} size={21} /><span>{tool.label}</span></button>)}<button className="toolbar-reset" type="button" onClick={resetRainbow}><Icon name="reset" size={21} /><span>{t.resetShort}</span></button></div>
      </div>
    </div>}
  </section>
}

function ArchiveScreen({ history, lang, t, onOpen }) {
  return (
    <section className="archive-screen screen-enter" aria-labelledby="archive-title">
      <div className="screen-title"><span className="chrome-kicker">RAINBOW LOG</span><h1 id="archive-title">{t.archiveTitle}</h1><p>{formatText(t.rainbowCount, { count: history.length })}</p></div>
      {history.length ? <div className="archive-grid">{history.map((item) => (
        <button type="button" className="archive-card" key={item.date} onClick={() => onOpen(item)} aria-label={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })}>
          <PolaroidCard image={item.cardImage} alt={formatText(t.viewRainbow, { date: formatDate(item.date, lang) })} media={<EnergyStrip photos={item.photos} samples={item.samples} labels={t.colors} />} photos={item.photos} samples={item.samples} labels={t.colors} date={item.date} lang={lang}><PolaroidCaption>{item.caption ?? t.defaultCaption}</PolaroidCaption></PolaroidCard>
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

function RainbowModal({ day, lang, t, exporting, onClose, onSave, onShare, onCaptionChange, onCaptionCommit }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!day) return undefined
    const previousFocus = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [day?.date])

  if (!day) return null
  const caption = day.caption ?? t.defaultCaption
  return <div className="modal-scrim" role="presentation"><button className="lightbox-dismiss" type="button" onClick={onClose} aria-label={t.close} /><section ref={dialogRef} className="rainbow-lightbox" role="dialog" aria-modal="true" aria-labelledby="modal-date" tabIndex="-1"><h2 className="visually-hidden" id="modal-date">{formatDate(day.date, lang)}</h2><PolaroidCard image={day.cardImage} alt={formatText(t.viewRainbow, { date: formatDate(day.date, lang) })} media={<EnergyStrip photos={day.photos} samples={day.samples} labels={t.colors} />} photos={day.photos} samples={day.samples} labels={t.colors} date={day.date} lang={lang}><EditablePolaroidCaption value={caption} t={t} onChange={onCaptionChange} onCommit={onCaptionCommit} /></PolaroidCard><div className="lightbox-actions" aria-busy={exporting}><button className="lightbox-save" type="button" onClick={onSave} disabled={exporting}><Icon name="download" />{exporting ? t.preparingCard : t.saveImage}</button><button className="lightbox-share" type="button" onClick={onShare} disabled={exporting}><Icon name="share" />{exporting ? t.preparingCard : t.shareImage}</button></div></section></div>
}

function PrinterShell({ foreground = false }) {
  return <div className={`printer-shell printer-shell-body ${foreground ? 'printer-shell-mask' : ''}`} aria-hidden="true"><i /><span>NIJI PRINT 2000</span><b /></div>
}

function DevelopedCard({ day, lang, t, exporting, onSave, onShare, onDone, onCaptionChange, onCaptionCommit }) {
  const [printComplete, setPrintComplete] = useState(false)

  useEffect(() => {
    setPrintComplete(false)
    if (!day) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setPrintComplete(true), reducedMotion ? 0 : 1850)
    return () => window.clearTimeout(timer)
  }, [day?.date])

  if (!day) return null
  const caption = day.caption ?? t.defaultCaption
  return <div className="developed-overlay"><section className="developed-result" role="dialog" aria-modal="true" aria-labelledby="developed-title">
    <div className="developed-heading"><span className="chrome-kicker">RAINBOW DEVELOPED</span><h2 id="developed-title">{t.developedTitle}</h2></div>
    <div className={`printer-stage ${printComplete ? 'print-complete' : ''}`} aria-label={t.developedTitle}><PrinterShell /><PolaroidCard className="printed-polaroid" image={day.cardImage} alt={t.developedAlt} overlay={<i className="developing-film" aria-hidden="true" />} photos={day.photos} samples={day.samples} labels={t.colors} date={day.date} lang={lang}><EditablePolaroidCaption value={caption} t={t} onChange={onCaptionChange} onCommit={onCaptionCommit} /></PolaroidCard><PrinterShell foreground /></div>
    <p className="caption-edit-hint"><Icon name="edit" size={17} />{t.editCaptionHint}</p>
    <div className="result-actions" aria-busy={exporting}><button className="save-card-action" type="button" onClick={onSave} disabled={exporting}><Icon name="download" />{exporting ? t.preparingCard : t.saveImage}</button><button className="share-card-action" type="button" onClick={onShare} disabled={exporting}><Icon name="share" />{exporting ? t.preparingCard : t.shareImage}</button></div>
    <button className="result-done" type="button" onClick={onDone}>{t.done}</button>
  </section></div>
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
  const [rainbowTransform, setRainbowTransform] = useState({ x: 50, y: 58, scale: 1, rotation: 0, transparency: 0, radius: 1, colorWidth: 1, angle: 180 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [developedDay, setDevelopedDay] = useState(null)
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
      const qaDay = { schemaVersion: 2, date, photos: qaPhotos, samples: FALLBACK_COLORS, cardImage: QA_MODE === 'result' ? './rainbow.svg' : undefined, completedAt: QA_MODE === 'result' ? new Date().toISOString() : null }
      setDay(qaDay)
      if (QA_MODE === 'result') setDevelopedDay(qaDay)
      setHistory(QA_MODE === 'result' ? [qaDay] : [])
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
      const completedDay = { ...day, schemaVersion: 2, cardImage, caption: t.defaultCaption, composition: rainbowTransform, completedAt: new Date().toISOString() }
      setDay(completedDay)
      setHistory((current) => [completedDay, ...current.filter((item) => item.date !== date)])
      setDevelopedDay(completedDay)
      setComposing(false)
      setBackground(null)
      navigator.vibrate?.([50, 50, 100])
      showMessage(t.rainbowCompleteToast)
      resetAppViewport()
      await saveDay(completedDay)
    } catch { showMessage(t.error) }
    finally { setFinishing(false) }
  }

  function downloadPolaroid(dataUrl, target) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `niji-polaroid-${target.date}.png`
    link.click()
  }

  async function saveRainbowCard(target) {
    if (!target?.cardImage) return
    setExporting(true)
    try {
      const polaroidImage = await renderPolaroidImage(target, lang, t.defaultCaption)
      downloadPolaroid(polaroidImage, target)
      showMessage(t.imageSaved)
    } catch { showMessage(t.error) }
    finally { setExporting(false) }
  }

  async function shareRainbowCard(target) {
    if (!target?.cardImage) return
    setExporting(true)
    try {
      const polaroidImage = await renderPolaroidImage(target, lang, t.defaultCaption)
      const filename = `niji-polaroid-${target.date}.png`
      const file = dataUrlToFile(polaroidImage, filename)
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t.shareTitle, text: target.caption ?? t.defaultCaption })
        showMessage(t.shared)
      } else {
        downloadPolaroid(polaroidImage, target)
        showMessage(t.shareFallback)
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showMessage(t.shareError)
    }
    finally { setExporting(false) }
  }

  function updateDayCaption(targetDate, caption) {
    const update = (item) => item?.date === targetDate ? { ...item, caption } : item
    setDay((current) => update(current))
    setHistory((current) => current.map(update))
    setSelectedDay((current) => update(current))
    setDevelopedDay((current) => update(current))
  }

  async function persistCaption(target) {
    if (!target) return
    try { await saveDay(target); showMessage(t.captionSaved) }
    catch { showMessage(t.error) }
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

  const immersiveEditor = activeTab === 'today' && composing && !staged

  return <div className="app-environment">
    <div className="ambient-bubble bubble-one" /><div className="ambient-bubble bubble-two" />
    <div className={`app-shell ${immersiveEditor ? 'immersive-editor' : ''}`}>
      <a className="skip-link" href="#app-content">{t.skip}</a>
      {!immersiveEditor ? <header className="app-header"><button className="app-logo" type="button" onClick={() => navigate('today')} aria-label={t.brand}><span className="logo-orb"><i /></span><span><b>NIJI</b><small>{t.brand}</small></span></button><div className="online-pill"><i />{t.localMode}</div></header> : null}
      <main id="app-content" className="app-content" tabIndex="-1">{screen}</main>
      {!immersiveEditor ? <nav className="bottom-nav" aria-label={t.mainNavigation}>{TAB_KEYS.map((key) => <button type="button" key={key} className={activeTab === key ? 'active' : ''} aria-current={activeTab === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={key === 'today' ? 'camera' : key === 'archive' ? 'book' : 'gear'} /><span>{t.tabs[key]}</span></button>)}</nav> : null}
      {processing ? <div className="processing-overlay" role="status"><div className="scanner"><Icon name="sparkle" size={32} /></div><strong>{t.analyzing}</strong><span>{t.analyzingHint}</span></div> : null}
      <div className={`toast ${message ? 'show' : ''}`} aria-live="polite">{message}</div>
    </div>
    {samplerOpen && staged ? <FullscreenSampler staged={staged} t={t} onClose={() => setSamplerOpen(false)} onSample={resamplePhoto} /> : null}
    <RainbowModal day={selectedDay} lang={lang} t={t} exporting={exporting} onClose={() => setSelectedDay(null)} onSave={() => saveRainbowCard(selectedDay)} onShare={() => shareRainbowCard(selectedDay)} onCaptionChange={(caption) => updateDayCaption(selectedDay.date, caption)} onCaptionCommit={() => persistCaption(selectedDay)} />
    <DevelopedCard day={developedDay} lang={lang} t={t} exporting={exporting} onSave={() => saveRainbowCard(developedDay)} onShare={() => shareRainbowCard(developedDay)} onDone={() => setDevelopedDay(null)} onCaptionChange={(caption) => updateDayCaption(developedDay.date, caption)} onCaptionCommit={() => persistCaption(developedDay)} />
  </div>
}
