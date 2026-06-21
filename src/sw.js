const CACHE_NAME = 'trainshier-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles-G3LCCREM.css', // Matches current generated output style name or gets handled by fallback
  '/main-J3VNZ7AU.js',
  '/polyfills-FFHMD2TL.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Ignore failures on individual files (since filenames can change on build hash)
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => console.log('Some assets could not be pre-cached, fallback will handle them', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle standard GET requests on the same origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      }).catch(() => {
        // Fallback for page navigation in single page application (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
