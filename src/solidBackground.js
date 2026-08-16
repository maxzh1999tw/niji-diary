export const SOLID_BACKGROUND_PRESETS = Object.freeze([
  Object.freeze({ color: '#FFFFFF', labelKey: 'solidWhite' }),
  Object.freeze({ color: '#F7F3EA', labelKey: 'solidWarmWhite' }),
  Object.freeze({ color: '#18171B', labelKey: 'solidBlack' }),
  Object.freeze({ color: '#302E34', labelKey: 'solidSoftBlack' }),
  Object.freeze({ color: '#DEDEE3', labelKey: 'solidLightGray' }),
  Object.freeze({ color: '#92929A', labelKey: 'solidGray' }),
  Object.freeze({ color: '#505058', labelKey: 'solidDarkGray' }),
  Object.freeze({ color: '#BFE6FF', labelKey: 'solidSkyBlue' }),
])

export function normalizeSolidBackgroundColor(color) {
  const normalized = typeof color === 'string' ? color.trim().toUpperCase() : ''
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null
}

export function createSolidBackgroundSource(color) {
  const normalized = normalizeSolidBackgroundColor(color)
  if (!normalized) throw new Error('Invalid solid background color')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="${normalized}"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function hslToHex(hue, saturation, lightness) {
  const h = ((Number(hue) % 360) + 360) % 360
  const s = Math.max(0, Math.min(100, Number(saturation))) / 100
  const l = Math.max(0, Math.min(100, Number(lightness))) / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const segment = h / 60
  const secondary = chroma * (1 - Math.abs(segment % 2 - 1))
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  const match = l - chroma / 2
  return `#${[red, green, blue].map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export function rgbToHex(red, green, blue) {
  const channelToHex = (channel) => Math.max(0, Math.min(255, Math.round(Number(channel) || 0))).toString(16).padStart(2, '0')
  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`.toUpperCase()
}
