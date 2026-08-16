export const RAINBOW_GEOMETRY = Object.freeze({
  viewBoxWidth: 300,
  baseRadius: 132,
  artworkWidthRatio: 0.72,
  photoWidthToHeight: 0.8,
})

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

/**
 * Keep the rainbow's top-center point fixed while changing its radius.
 * x/y continue to represent the visual center used by the existing gestures.
 */
export function preserveRainbowTopAnchor(transform, nextRadius) {
  const previousRadius = finiteOr(transform?.radius, 1)
  const radius = finiteOr(nextRadius, previousRadius)
  const scale = Math.max(0, finiteOr(transform?.scale, 1))
  const rotationRadians = finiteOr(transform?.rotation, 0) * Math.PI / 180
  const radiusDelta = (radius - previousRadius) * RAINBOW_GEOMETRY.baseRadius * scale
  const xDelta = radiusDelta * RAINBOW_GEOMETRY.artworkWidthRatio / RAINBOW_GEOMETRY.viewBoxWidth * 100
  const yDelta = xDelta * RAINBOW_GEOMETRY.photoWidthToHeight

  return {
    ...transform,
    x: finiteOr(transform?.x, 50) - xDelta * Math.sin(rotationRadians),
    y: finiteOr(transform?.y, 58) + yDelta * Math.cos(rotationRadians),
    radius,
  }
}
