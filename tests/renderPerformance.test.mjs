import assert from 'node:assert/strict'
import { canvasToDataUrl, clearRenderAssetCache, getRenderAssetCacheSize, loadImageHandleGroup, loadImageSource } from '../src/renderPerformance.js'

function createFakeImageFactory({ failures = new Set(), closed = [] } = {}) {
  let created = 0
  return {
    createImage() {
      const imageId = created
      created += 1
      const image = {
        _src: '',
        close() {
          closed.push(imageId)
        },
      }
      Object.defineProperty(image, 'src', {
        get() {
          return image._src
        },
        set(value) {
          image._src = value
          queueMicrotask(() => {
            if (value === '') return
            if (failures.has(imageId)) image.onerror?.(new Error('decode failed'))
            else image.onload?.()
          })
        },
      })
      return image
    },
    get created() {
      return created
    },
  }
}

function createDeferredImageFactory({ closed = [] } = {}) {
  let created = 0
  const controllers = []
  return {
    createImage() {
      const imageId = created
      created += 1
      const image = {
        _src: '',
        close() {
          closed.push(imageId)
        },
      }
      Object.defineProperty(image, 'src', {
        get() {
          return image._src
        },
        set(value) {
          image._src = value
          if (value === '') return
          controllers[imageId] = {
            resolve() {
              queueMicrotask(() => image.onload?.())
            },
            reject() {
              queueMicrotask(() => image.onerror?.(new Error('decode failed')))
            },
          }
        },
      })
      return image
    },
    controllers,
  }
}

const blobEncoded = await canvasToDataUrl({
  toBlob(callback, type, quality) {
    assert.equal(type, 'image/jpeg')
    assert.equal(quality, 0.84)
    callback({ encoded: 'blob-jpeg' })
  },
  toDataURL() {
    assert.fail('toDataURL fallback should not run when toBlob succeeds')
  },
}, {
  type: 'image/jpeg',
  quality: 0.84,
  readAsDataUrl: async (blob) => `data:image/jpeg;base64,${blob.encoded}`,
})
assert.equal(blobEncoded, 'data:image/jpeg;base64,blob-jpeg')

const fallbackEncoded = await canvasToDataUrl({
  toBlob(callback) {
    callback(null)
  },
  toDataURL(type, quality) {
    assert.equal(type, 'image/jpeg')
    assert.equal(quality, 0.9)
    return 'data:image/jpeg;base64,fallback'
  },
}, {
  type: 'image/jpeg',
  quality: 0.9,
})
assert.equal(fallbackEncoded, 'data:image/jpeg;base64,fallback')

const partiallyReleased = []
await assert.rejects(() => loadImageHandleGroup([
  async () => ({ release() { partiallyReleased.push('first') } }),
  async () => { throw new Error('group failed') },
  async () => ({ release() { partiallyReleased.push('third') } }),
]), /group failed/)
assert.deepEqual(partiallyReleased, ['first', 'third'], 'fulfilled transient handles must be released when a sibling load rejects')

clearRenderAssetCache()
const sharedFactory = createFakeImageFactory()
const sharedFirst = await loadImageSource('data:image/svg+xml;base64,one', {
  cacheKey: 'film-surface:test',
  createImage: sharedFactory.createImage,
})
const sharedSecond = await loadImageSource('data:image/svg+xml;base64,one', {
  cacheKey: 'film-surface:test',
  createImage: sharedFactory.createImage,
})
assert.equal(sharedFactory.created, 1, 'cached immutable film assets should decode only once')
assert.equal(sharedFirst.image, sharedSecond.image, 'same cache key must reuse the same decoded image object')
sharedFirst.release()
sharedSecond.release()
assert.equal(getRenderAssetCacheSize(), 1)

clearRenderAssetCache()
const retryFactory = createFakeImageFactory({ failures: new Set([0]) })
await assert.rejects(() => loadImageSource('data:image/svg+xml;base64,two', {
  cacheKey: 'film-overlay:retry',
  createImage: retryFactory.createImage,
}))
assert.equal(getRenderAssetCacheSize(), 0, 'failed cached loads must not poison the cache')
const retried = await loadImageSource('data:image/svg+xml;base64,two', {
  cacheKey: 'film-overlay:retry',
  createImage: retryFactory.createImage,
})
assert.equal(retryFactory.created, 2, 'a failed cached decode must retry on the next request')
retried.release()

clearRenderAssetCache()
const inFlightClosed = []
const inFlightFactory = createDeferredImageFactory({ closed: inFlightClosed })
const evictedPendingHandle = loadImageSource('data:image/svg+xml;base64,pending-a', {
  cacheKey: 'asset:pending-a',
  cacheLimit: 1,
  createImage: inFlightFactory.createImage,
})
const residentPendingHandle = loadImageSource('data:image/svg+xml;base64,pending-b', {
  cacheKey: 'asset:pending-b',
  cacheLimit: 1,
  createImage: inFlightFactory.createImage,
})
assert.equal(getRenderAssetCacheSize(), 1, 'adding a second pending cached asset should evict the oldest key immediately')
inFlightFactory.controllers[0].resolve()
inFlightFactory.controllers[1].resolve()
const [evictedHandle, residentHandle] = await Promise.all([evictedPendingHandle, residentPendingHandle])
assert.deepEqual(inFlightClosed, [], 'an evicted in-flight cached image must stay alive until the active borrower releases it')
evictedHandle.release()
assert.deepEqual(inFlightClosed, [0], 'the evicted in-flight cached image should dispose once decode completes and the borrower releases it')
residentHandle.release()
clearRenderAssetCache()

const unhandledRejections = []
const trackUnhandledRejection = (reason) => unhandledRejections.push(reason)
process.on('unhandledRejection', trackUnhandledRejection)
try {
  const rejectedClosed = []
  const rejectedFactory = createDeferredImageFactory({ closed: rejectedClosed })
  const evictedRejectedHandle = loadImageSource('data:image/svg+xml;base64,reject-a', {
    cacheKey: 'asset:reject-a',
    cacheLimit: 1,
    createImage: rejectedFactory.createImage,
  })
  const residentResolvedHandle = loadImageSource('data:image/svg+xml;base64,reject-b', {
    cacheKey: 'asset:reject-b',
    cacheLimit: 1,
    createImage: rejectedFactory.createImage,
  })
  rejectedFactory.controllers[0].reject()
  rejectedFactory.controllers[1].resolve()
  await assert.rejects(() => evictedRejectedHandle, /Unable to load image/, 'an evicted pending cached decode should still reject cleanly')
  const resolvedHandle = await residentResolvedHandle
  resolvedHandle.release()
  await Promise.resolve()
  assert.deepEqual(rejectedClosed, [], 'failed cached decodes should not attempt to close a missing image handle')
  assert.deepEqual(unhandledRejections, [], 'evicted failed cached decodes must not leak unhandled rejections')
} finally {
  process.off('unhandledRejection', trackUnhandledRejection)
  clearRenderAssetCache()
}

const evicted = []
const boundedFactory = createFakeImageFactory({ closed: evicted })
const cachedA = await loadImageSource('data:image/svg+xml;base64,a', {
  cacheKey: 'asset:a',
  cacheLimit: 2,
  createImage: boundedFactory.createImage,
})
const cachedB = await loadImageSource('data:image/svg+xml;base64,b', {
  cacheKey: 'asset:b',
  cacheLimit: 2,
  createImage: boundedFactory.createImage,
})
cachedA.release()
cachedB.release()
const cachedC = await loadImageSource('data:image/svg+xml;base64,c', {
  cacheKey: 'asset:c',
  cacheLimit: 2,
  createImage: boundedFactory.createImage,
})
cachedC.release()
assert.equal(getRenderAssetCacheSize(), 2, 'film asset cache must stay bounded')
assert.deepEqual(evicted, [0], 'oldest cached image should be released when the cache exceeds its limit')
clearRenderAssetCache()

console.log('Render performance helpers: canvas blob fallback and bounded immutable asset caching remain compatible.')
