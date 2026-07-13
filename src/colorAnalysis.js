export const COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

const TARGET_HUES = { red: 0, orange: 30, yellow: 56, green: 125, blue: 210, indigo: 248, violet: 292 }

function hueDistance(a, b) {
  const distance = Math.abs(a - b)
  return Math.min(distance, 360 - distance)
}

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
  }
  if (hue < 0) hue += 360
  return { hue, saturation: max ? delta / max : 0, value: max / 255 }
}

export function analyzePixels(pixels, stride = 16) {
  const scores = Object.fromEntries(COLOR_KEYS.map((key) => [key, 0]))
  let redTotal = 0, greenTotal = 0, blueTotal = 0, colorWeight = 0

  for (let index = 0; index < pixels.length; index += stride) {
    const r = pixels[index], g = pixels[index + 1], b = pixels[index + 2]
    const { hue, saturation, value } = rgbToHsv(r, g, b)
    if (value < 0.08 || value > 0.97 || saturation < 0.08) continue
    let nearest = COLOR_KEYS[0], nearestDistance = 361
    for (const key of COLOR_KEYS) {
      const distance = hueDistance(hue, TARGET_HUES[key])
      if (distance < nearestDistance) { nearest = key; nearestDistance = distance }
    }
    const weight = saturation * saturation * (0.45 + value * 0.55) * Math.max(0.15, 1 - nearestDistance / 90)
    scores[nearest] += weight
    redTotal += r * weight
    greenTotal += g * weight
    blueTotal += b * weight
    colorWeight += weight
  }

  let suggestedKey = 'red', bestScore = -1, scoreTotal = 0
  for (const key of COLOR_KEYS) {
    scoreTotal += scores[key]
    if (scores[key] > bestScore) { bestScore = scores[key]; suggestedKey = key }
  }
  const fallback = [pixels[0] || 255, pixels[1] || 105, pixels[2] || 180]
  const sampleColor = colorWeight
    ? `rgb(${Math.round(redTotal / colorWeight)}, ${Math.round(greenTotal / colorWeight)}, ${Math.round(blueTotal / colorWeight)})`
    : `rgb(${fallback.join(', ')})`

  return {
    suggestedKey,
    sampleColor,
    confidence: scoreTotal ? Math.round((bestScore / scoreTotal) * 100) : 14,
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
