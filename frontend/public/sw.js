// Bassline Pilates - Service Worker
// Battery-friendly caching strategy with smart invalidation
// v2: Fixed external media resource handling (S3, archive.org, Supabase)

const CACHE_NAME = 'bassline-v2';
const ASSETS_CACHE = 'bassline-assets-v2';
const API_CACHE = 'bassline-api-v2';

// Critical app shell (cached immediately)
const APP_SHELL = [
  '/',
  '/index.html',
  '/assets/Logo4.jpg',
  '/assets/bassline-logo-transparent.png',
  '/assets/bassline-logo-yellow-transparent.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('bassline-') && name !== CACHE_NAME && name !== ASSETS_CACHE && name !== API_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITICAL: Skip service worker for external media resources
  // Let browser handle S3 videos, S3 music, archive.org music, cast SDK directly
  if (
    url.hostname.includes('s3.amazonaws.com') ||
    url.hostname.includes('s3.us-east-1.amazonaws.com') ||
    url.hostname.includes('archive.org') ||
    url.hostname.includes('ia802809.us.archive.org') ||
    url.hostname.includes('gstatic.com') || // Cast SDK
    url.hostname.includes('supabase.co') // Supabase Storage (voiceovers)
  ) {
    // Do NOT intercept - let browser fetch directly
    return;
  }

  // Strategy 1: Network-first for API calls (fresh data priority)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses (short TTL)
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, clone);
              // Auto-expire API cache after 5 minutes
              setTimeout(() => {
                caches.open(API_CACHE).then(cache => cache.delete(request));
              }, 5 * 60 * 1000);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Strategy 2: Cache-first for static assets (performance priority)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2|mp3)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;

          return fetch(request).then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(ASSETS_CACHE).then(cache => cache.put(request, clone));
            }
            return response;
          });
        })
    );
    return;
  }

  // Strategy 3: Network-first with cache fallback for HTML pages
  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync (battery-friendly - only when online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-classes') {
    event.waitUntil(syncClasses());
  }
});

async function syncClasses() {
  // Only sync if online (battery-friendly)
  if (!navigator.onLine) return;

  // Sync user's saved classes in background
  // (Implementation depends on your data layer)
}
