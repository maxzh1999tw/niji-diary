export const COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

// OKLCH uses a perceptually uniform hue circle. These anchors follow the visual
// centers of the seven rainbow families rather than equal RGB/HSV intervals.
const HUE_ANCHORS = {
  red: 20,
  orange: 60,
  yellow: 100,
  green: 150,
  blue: 240,
  indigo: 280,
  violet: 315,
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function smoothstep(edge0, edge1, value) {
  const position = clamp((value - edge0) / (edge1 - edge0))
  return position * position * (3 - 2 * position)
}

function hueDistance(a, b) {
  const distance = Math.abs(a - b)
  return Math.min(distance, 360 - distance)
}

function srgbChannelToLinear(channel) {
  const normalized = channel / 255
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

export function rgbToOklch(red, green, blue) {
  const r = srgbChannelToLinear(red)
  const g = srgbChannelToLinear(green)
  const b = srgbChannelToLinear(blue)

  const linearL = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const linearM = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const linearS = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)

  const lightness = 0.2104542553 * linearL + 0.793617785 * linearM - 0.0040720468 * linearS
  const a = 1.9779984951 * linearL - 2.428592205 * linearM + 0.4505937099 * linearS
  const labB = 0.0259040371 * linearL + 0.7827717662 * linearM - 0.808675766 * linearS
  const chroma = Math.hypot(a, labB)
  const hue = chroma < 1e-7 ? 0 : (Math.atan2(labB, a) * 180 / Math.PI + 360) % 360

  return { lightness, chroma, hue }
}

function classifyHue(hue) {
  let nearestKey = COLOR_KEYS[0]
  let nearestDistance = Infinity
  let secondDistance = Infinity

  for (const key of COLOR_KEYS) {
    const distance = hueDistance(hue, HUE_ANCHORS[key])
    if (distance < nearestDistance) {
      secondDistance = nearestDistance
      nearestDistance = distance
      nearestKey = key
    } else if (distance < secondDistance) {
      secondDistance = distance
    }
  }

  return {
    key: nearestKey,
    distance: nearestDistance,
    margin: secondDistance - nearestDistance,
  }
}

export function analyzePixels(pixels, stride = 16) {
  const scores = Object.fromEntries(COLOR_KEYS.map((key) => [key, 0]))
  let redTotal = 0, greenTotal = 0, blueTotal = 0, colorWeight = 0
  let reliabilityTotal = 0, clarityTotal = 0, visiblePixels = 0

  for (let index = 0; index < pixels.length; index += stride) {
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2]
    const alpha = (pixels[index + 3] ?? 255) / 255
    if (!alpha) continue

    const { lightness, chroma, hue } = rgbToOklch(r, g, b)
    const classification = classifyHue(hue)
    const chromaReliability = smoothstep(0.018, 0.13, chroma)
    const shadowReliability = smoothstep(0.025, 0.16, lightness)
    const highlightReliability = 1 - smoothstep(0.94, 1, lightness)
    const reliability = chromaReliability * (0.55 + 0.45 * shadowReliability * highlightReliability)
    const clarity = smoothstep(0, 34, classification.margin)
    const weight = alpha * (0.08 + 0.92 * reliability)

    scores[classification.key] += weight
    redTotal += r * weight
    greenTotal += g * weight
    blueTotal += b * weight
    colorWeight += weight
    reliabilityTotal += reliability * alpha
    clarityTotal += clarity * reliability * alpha
    visiblePixels += alpha
  }

  let suggestedKey = 'red', bestScore = -1, scoreTotal = 0
  for (const key of COLOR_KEYS) {
    scoreTotal += scores[key]
    if (scores[key] > bestScore) { bestScore = scores[key]; suggestedKey = key }
  }
  const fallback = [pixels[0] ?? 255, pixels[1] ?? 105, pixels[2] ?? 180]
  const sampleColor = colorWeight
    ? `rgb(${Math.round(redTotal / colorWeight)}, ${Math.round(greenTotal / colorWeight)}, ${Math.round(blueTotal / colorWeight)})`
    : `rgb(${fallback.join(', ')})`
  const consensus = scoreTotal ? bestScore / scoreTotal : 0
  const averageReliability = visiblePixels ? reliabilityTotal / visiblePixels : 0
  const averageClarity = reliabilityTotal ? clarityTotal / reliabilityTotal : 0
  const confidence = Math.round(clamp(
    8 + 91 * averageReliability * consensus * (0.35 + 0.65 * averageClarity),
    8,
    99,
  ))

  return {
    suggestedKey,
    sampleColor,
    confidence,
  }
}

export function analyzeRegion(imageData, width, height, point = { x: 0.5, y: 0.5 }, radiusRatio = 0.12) {
  const centerX = Math.round(point.x * (width - 1))
  const centerY = Math.round(point.y * (height - 1))
  const radius = Math.max(2, Math.round(Math.min(width, height) * radiusRatio))
  const selected = []
  let red = 0, green = 0, blue = 0, totalWeight = 0

  for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x++) {
      const distance = Math.hypot(x - centerX, y - centerY)
      if (distance > radius) continue
      const index = (y * width + x) * 4
      const weight = Math.max(0.15, 1 - distance / (radius + 1))
      const r = imageData[index], g = imageData[index + 1], b = imageData[index + 2]
      selected.push(r, g, b, 255)
      red += r * weight; green += g * weight; blue += b * weight; totalWeight += weight
    }
  }

  const analysis = analyzePixels(new Uint8ClampedArray(selected), 4)
  return {
    ...analysis,
    sampleColor: `rgb(${Math.round(red / totalWeight)}, ${Math.round(green / totalWeight)}, ${Math.round(blue / totalWeight)})`,
    samplePoint: point,
  }
}

export function analyzePixel(imageData, width, height, point = { x: 0.5, y: 0.5 }) {
  const x = Math.max(0, Math.min(width - 1, Math.round(point.x * (width - 1))))
  const y = Math.max(0, Math.min(height - 1, Math.round(point.y * (height - 1))))
  const index = (y * width + x) * 4
  const r = imageData[index], g = imageData[index + 1], b = imageData[index + 2]
  return {
    ...analyzePixels(new Uint8ClampedArray([r, g, b, 255]), 4),
    sampleColor: `rgb(${r}, ${g}, ${b})`,
    samplePoint: point,
    pixel: { x, y },
  }
}
