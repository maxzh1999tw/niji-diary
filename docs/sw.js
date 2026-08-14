const CACHE_NAME = 'niji-diary-shell-v5'
const CACHE_PREFIX = 'niji-diary-shell-'
const CACHE_TIMEOUT_MS = 3000

function appUrl(path) {
  return new URL(path, self.location.origin).toString()
}

function sameOrigin(url) {
  return url.origin === self.location.origin
}

async function discoverShellUrls() {
  const urls = new Set([
    appUrl('/'),
    appUrl('/index.html'),
    appUrl('/manifest.webmanifest'),
    appUrl('/logo.svg'),
    appUrl('/icon-180.png'),
    appUrl('/icon-192.png'),
    appUrl('/icon-512.png'),
    appUrl('/icon-maskable-192.png'),
    appUrl('/icon-maskable-512.png'),
  ])

  try {
    const response = await fetch(appUrl('/index.html'), { cache: 'reload' })
    if (response.ok) {
      const html = await response.text()
      const references = html.matchAll(/(?:src|href)=["']([^"']+)["']/g)

      for (const match of references) {
        const url = new URL(match[1], self.registration.scope)
        if (sameOrigin(url)) {
          urls.add(url.toString())
        }
      }
    }
  } catch {
    // The first visit is normally online; keep the install resilient if it is not.
  }

  return [...urls]
}

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME)
  const urls = await discoverShellUrls()

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' })
        if (response.ok) {
          await cache.put(url, response)
        }
      } catch {
        // A single optional asset must not prevent the PWA from installing.
      }
    }),
  )
}

function fetchWithTimeout(request) {
  let timeoutId
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(null), CACHE_TIMEOUT_MS)
  })

  return Promise.race([fetch(request), timeout]).finally(() => {
    clearTimeout(timeoutId)
  })
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetchWithTimeout(request)
    if (response?.ok) {
      await cache.put(request, response.clone())
      await cache.put(appUrl('/index.html'), response.clone())
      return response
    }
  } catch {
    // Fall back to the cached app shell below.
  }

  return (
    (await cache.match(request)) ||
    (await cache.match(appUrl('/index.html'))) ||
    (await cache.match(appUrl('/'))) ||
    new Response('請先連線開啟一次網站，之後就能離線使用。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  )
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheShell().then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || !sameOrigin(url)) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  event.respondWith(cacheFirst(request))
})
