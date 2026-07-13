import assert from 'node:assert/strict'
import { applyPanDelta, applyPinchDelta, normalizeAngleDelta } from '../src/gestureTransform.js'

const closeTo = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`)
const frame = { left: 0, top: 0, width: 200, height: 200 }
const initial = { x: 50, y: 50, scale: 1, rotation: 0, transparency: 0 }

const panned = applyPanDelta(initial, frame, { x: 80, y: 90 }, { x: 100, y: 120 })
closeTo(panned.x, 60)
closeTo(panned.y, 65)

const firstFinger = [{ x: 100, y: 120 }, { x: 140, y: 120 }]
const unchangedOnSecondTouch = applyPinchDelta(panned, frame, firstFinger, firstFinger)
assert.deepEqual(unchangedOnSecondTouch, panned)

const centered = applyPinchDelta(initial, frame, [{ x: 80, y: 100 }, { x: 120, y: 100 }], [{ x: 120, y: 90 }, { x: 120, y: 170 }])
closeTo(centered.x, 60)
closeTo(centered.y, 65)
closeTo(centered.scale, 2)
closeTo(centered.rotation, 90)

const pointAt = (degrees) => {
  const radians = degrees * Math.PI / 180
  return { x: 100 + Math.cos(radians) * 40, y: 100 + Math.sin(radians) * 40 }
}
const acrossAngleBoundary = applyPinchDelta(initial, frame, [{ x: 100, y: 100 }, pointAt(179)], [{ x: 100, y: 100 }, pointAt(-179)])
closeTo(acrossAngleBoundary.rotation, 2)
closeTo(normalizeAngleDelta(-358 * Math.PI / 180) * 180 / Math.PI, 2)

const resumedPan = applyPanDelta(centered, frame, { x: 120, y: 170 }, { x: 130, y: 180 })
closeTo(resumedPan.x, centered.x + 5)
closeTo(resumedPan.y, centered.y + 5)
closeTo(resumedPan.scale, centered.scale)
closeTo(resumedPan.rotation, centered.rotation)

console.log('Gesture transitions: pan, pinch, rotation wrap, and resumed pan remain continuous.')
