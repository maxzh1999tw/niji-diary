const EPSILON = Number.EPSILON

function frameSize(frame) {
  return { width: Math.max(frame.width, EPSILON), height: Math.max(frame.height, EPSILON) }
}

export function normalizeAngleDelta(radians) {
  return Math.atan2(Math.sin(radians), Math.cos(radians))
}

export function applyPanDelta(transform, frame, previous, current) {
  const { width, height } = frameSize(frame)
  return {
    ...transform,
    x: transform.x + (current.x - previous.x) / width * 100,
    y: transform.y + (current.y - previous.y) / height * 100,
  }
}

export function pinchGeometry([a, b]) {
  return {
    centerX: (a.x + b.x) / 2,
    centerY: (a.y + b.y) / 2,
    distance: Math.hypot(b.x - a.x, b.y - a.y),
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  }
}

export function applyPinchDelta(transform, frame, previousPoints, currentPoints) {
  const previous = pinchGeometry(previousPoints)
  const current = pinchGeometry(currentPoints)
  const { width, height } = frameSize(frame)
  const scaleFactor = previous.distance > EPSILON ? current.distance / previous.distance : 1
  const rotationDelta = normalizeAngleDelta(current.angle - previous.angle)
  const cosine = Math.cos(rotationDelta)
  const sine = Math.sin(rotationDelta)
  const objectX = frame.left + transform.x / 100 * width
  const objectY = frame.top + transform.y / 100 * height
  const relativeX = (objectX - previous.centerX) * scaleFactor
  const relativeY = (objectY - previous.centerY) * scaleFactor
  const nextObjectX = current.centerX + relativeX * cosine - relativeY * sine
  const nextObjectY = current.centerY + relativeX * sine + relativeY * cosine

  return {
    ...transform,
    x: (nextObjectX - frame.left) / width * 100,
    y: (nextObjectY - frame.top) / height * 100,
    scale: transform.scale * scaleFactor,
    rotation: transform.rotation + rotationDelta * 180 / Math.PI,
  }
}
