const DEFAULT_RENDER_ASSET_CACHE_LIMIT = 24

const renderAssetCache = new Map()

function releaseLoadedHandle(handle) {
  handle?.release?.()
}

function disposeCachedImage(image) {
  if (!image) return
  if (typeof image.close === 'function') {
    try { image.close() } catch { /* ignore disposal failures */ }
    return
  }
  if (typeof image === 'object' && image) {
    try {
      image.onload = null
      image.onerror = null
      if ('src' in image) image.src = ''
    } catch { /* best effort release for detached Image instances */ }
  }
}

function disposeCacheEntryImage(entry) {
  if (!entry?.image) return
  disposeCachedImage(entry.image)
  entry.image = null
}

function finalizeCacheEntryDisposal(entry) {
  if (!entry || entry.retainedByCache || entry.borrowCount > 0 || !entry.settled) return
  disposeCacheEntryImage(entry)
}

function trimRenderAssetCache(limit = DEFAULT_RENDER_ASSET_CACHE_LIMIT) {
  while (renderAssetCache.size > limit) {
    const oldestKey = renderAssetCache.keys().next().value
    const oldestEntry = renderAssetCache.get(oldestKey)
    renderAssetCache.delete(oldestKey)
    oldestEntry?.dispose?.()
  }
}

function createImageLoadPromise(source, createImage) {
  return new Promise((resolve, reject) => {
    const image = createImage()
    let settled = false

    const finishResolve = () => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      resolve(image)
    }

    const finishReject = () => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      reject(new Error('Unable to load image'))
    }

    image.decoding = 'async'
    image.onload = finishResolve
    image.onerror = finishReject
    image.src = source

    if (typeof image.decode === 'function') {
      image.decode().then(finishResolve).catch(() => {})
    }
  })
}

function readBlobAsDataUrl(blob, readAsDataUrl) {
  if (typeof readAsDataUrl === 'function') return readAsDataUrl(blob)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read encoded image'))
    reader.readAsDataURL(blob)
  })
}

export async function canvasToDataUrl(canvas, {
  type = 'image/jpeg',
  quality,
  readAsDataUrl,
} = {}) {
  if (typeof canvas?.toBlob === 'function') {
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) resolve(value)
          else reject(new Error('Canvas toBlob returned null'))
        }, type, quality)
      })
      return await readBlobAsDataUrl(blob, readAsDataUrl)
    } catch {
      /* fall back to the synchronous encoder for older browsers or failed blob reads */
    }
  }
  return canvas.toDataURL(type, quality)
}

async function createCachedHandle(entry) {
  entry.borrowCount += 1
  let released = false
  const release = () => {
    if (released) return
    released = true
    entry.borrowCount = Math.max(0, entry.borrowCount - 1)
    finalizeCacheEntryDisposal(entry)
  }

  try {
    const image = await entry.promise
    return { image, release }
  } catch (error) {
    release()
    throw error
  }
}

export async function loadImageHandleGroup(loaders) {
  const results = await Promise.allSettled(loaders.map((loader) => loader()))
  const handles = []
  let firstError = null

  for (const result of results) {
    if (result.status === 'fulfilled') handles.push(result.value)
    else if (firstError == null) firstError = result.reason
  }

  if (firstError != null) {
    handles.forEach((handle) => releaseLoadedHandle(handle))
    throw firstError
  }

  return results.map((result) => result.value)
}

export async function loadImageSource(source, {
  cacheKey = null,
  cacheLimit = DEFAULT_RENDER_ASSET_CACHE_LIMIT,
  createImage = () => new Image(),
} = {}) {
  if (!source) throw new Error('Missing image source')

  if (cacheKey) {
    const cachedEntry = renderAssetCache.get(cacheKey)
    if (cachedEntry) {
      renderAssetCache.delete(cacheKey)
      renderAssetCache.set(cacheKey, cachedEntry)
      return createCachedHandle(cachedEntry)
    }

    const entry = {
      image: null,
      settled: false,
      borrowCount: 0,
      retainedByCache: true,
      dispose: () => {
        entry.retainedByCache = false
        finalizeCacheEntryDisposal(entry)
      },
    }
    entry.promise = createImageLoadPromise(source, createImage)
      .then((image) => {
        entry.settled = true
        entry.image = image
        finalizeCacheEntryDisposal(entry)
        return image
      })
      .catch((error) => {
        entry.settled = true
        if (renderAssetCache.get(cacheKey) === entry) renderAssetCache.delete(cacheKey)
        finalizeCacheEntryDisposal(entry)
        throw error
      })

    renderAssetCache.set(cacheKey, entry)
    trimRenderAssetCache(cacheLimit)
    return createCachedHandle(entry)
  }

  const image = await createImageLoadPromise(source, createImage)
  let released = false
  return {
    image,
    release: () => {
      if (released) return
      released = true
      disposeCachedImage(image)
    },
  }
}

export function clearRenderAssetCache() {
  for (const entry of renderAssetCache.values()) entry.dispose?.()
  renderAssetCache.clear()
}

export function getRenderAssetCacheSize() {
  return renderAssetCache.size
}
