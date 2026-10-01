/**
 * MOS Master - Service Worker
 * Comprehensive Offline Caching Strategy for Quizzes and Study Materials
 */

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE_NAME = `mos-static-${CACHE_VERSION}`;
const QUIZZES_CACHE_NAME = `mos-offline-quizzes-${CACHE_VERSION}`;
const MATERIALS_CACHE_NAME = `mos-study-materials-${CACHE_VERSION}`;

// Pre-cached critical assets for SPA shell
const CRITICAL_STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Offline Bundles API endpoints
const OFFLINE_API_ROUTES = [
  '/api/offline/bundle?subject=all',
  '/api/offline/bundle?subject=word',
  '/api/offline/bundle?subject=excel',
  '/api/offline/bundle?subject=powerpoint',
  '/api/mastery/progress',
];

// 1. INSTALL: Precache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching critical application shell');
      return cache.addAll(CRITICAL_STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-fatal precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE: Purge stale caches from older versions
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new Service Worker');
  const allowedCaches = [STATIC_CACHE_NAME, QUIZZES_CACHE_NAME, MATERIALS_CACHE_NAME];

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!allowedCaches.includes(key)) {
            console.log('[SW] Removing deprecated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Strategy router based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST /api/submissions)
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation Requests (HTML SPA shell): Network First, fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('[SW] Device offline, serving cached SPA shell for:', request.url);
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // B. Offline Quiz & Study Material API Requests (/api/offline/*, /api/questions, /api/mastery/*)
  if (url.pathname.startsWith('/api/offline') || 
      url.pathname.startsWith('/api/questions') || 
      url.pathname.startsWith('/api/mastery')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response from server, store a fresh copy in the quiz/materials cache
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const targetCacheName = url.pathname.includes('material') ? MATERIALS_CACHE_NAME : QUIZZES_CACHE_NAME;
            caches.open(targetCacheName).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Network unavailable. Attempting offline cache lookup for API:', request.url);
          
          // Try matching in Quiz Cache first
          const quizCache = await caches.open(QUIZZES_CACHE_NAME);
          const cachedQuizResponse = await quizCache.match(request);
          if (cachedQuizResponse) {
            console.log('[SW] Serving cached quiz set for:', request.url);
            return cachedQuizResponse;
          }

          // Try matching in Study Materials Cache
          const matCache = await caches.open(MATERIALS_CACHE_NAME);
          const cachedMatResponse = await matCache.match(request);
          if (cachedMatResponse) {
            console.log('[SW] Serving cached study material for:', request.url);
            return cachedMatResponse;
          }

          // If looking for a specific subject offline bundle and exact URL missed, fallback to the all bundle
          if (url.pathname.startsWith('/api/offline/bundle')) {
            const allBundle = await quizCache.match('/api/offline/bundle?subject=all');
            if (allBundle) {
              console.log('[SW] Serving comprehensive offline bundle fallback');
              return allBundle;
            }
          }

          // Return synthetic offline response
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'Thiết bị đang ngoại tuyến. Vui lòng tải trước bộ đề thi để học khi không có internet.',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // C. Static Assets (Scripts, Styles, Fonts, Icons, Images): Stale-While-Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached immediately if present, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. MESSAGE BUS: Client communication for background precaching & cache inspection
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  console.log('[SW] Received client message:', type, payload);

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'CACHE_QUIZ_SET') {
    const { subject, url } = payload;
    try {
      const cache = await caches.open(QUIZZES_CACHE_NAME);
      const targetUrl = url || `/api/offline/bundle?subject=${subject || 'all'}`;
      const response = await fetch(targetUrl);
      if (response && response.status === 200) {
        await cache.put(targetUrl, response.clone());
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, subject, cachedUrl: targetUrl });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  }

  if (type === 'CACHE_DIRECT_DATA') {
    // Allows client to directly push structured JSON to Service Worker cache
    const { cacheType, endpoint, data } = payload;
    try {
      const targetCacheName = cacheType === 'materials' ? MATERIALS_CACHE_NAME : QUIZZES_CACHE_NAME;
      const cache = await caches.open(targetCacheName);
      const syntheticResponse = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-MOS-Offline-Cached': 'true',
          'Date': new Date().toUTCString(),
        },
      });
      await cache.put(endpoint, syntheticResponse);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, endpoint });
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  }

  if (type === 'GET_CACHE_STATUS') {
    try {
      const qCache = await caches.open(QUIZZES_CACHE_NAME);
      const mCache = await caches.open(MATERIALS_CACHE_NAME);
      const qKeys = await qCache.keys();
      const mKeys = await mCache.keys();

      const cachedUrls = [
        ...qKeys.map((k) => k.url),
        ...mKeys.map((k) => k.url),
      ];

      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          success: true,
          quizCount: qKeys.length,
          materialsCount: mKeys.length,
          cachedUrls,
          version: CACHE_VERSION,
        });
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  }

  if (type === 'CLEAR_OFFLINE_CACHE') {
    try {
      await caches.delete(QUIZZES_CACHE_NAME);
      await caches.delete(MATERIALS_CACHE_NAME);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, message: 'Đã xóa toàn bộ bộ nhớ đề thi ngoại tuyến.' });
      }
    } catch (err) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  }
});
