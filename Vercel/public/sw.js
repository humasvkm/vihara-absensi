const CACHE_NAME = 'vkm-absensi-v1';
const urlsToCache = [
  '/',
  '/daftar',
  '/admin'
];

// Install event - cache halaman utama
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve dari cache jika offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version jika ada
        if (response) {
          return response;
        }
        // Jika tidak ada di cache, fetch dari network
        return fetch(event.request);
      }
    )
  );
});

// Activate event - hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
