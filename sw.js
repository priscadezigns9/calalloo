const CACHE_NAME = 'calalloo-heritage-v1';
const ASSETS = [
  'index.html',
  'assets/logo.png',
  'assets/heritage/callaloo.jpg',
  'assets/heritage/pelau.jpg',
  'assets/heritage/oil-down.jpg',
  'assets/heritage/pholourie.jpg',
  'assets/heritage/sahina.png',
  'js/backend.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
