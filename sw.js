self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('calalloo-v1').then((cache) => {
      return cache.addAll([
        '/dashboard/',
        'https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,700;9..144,0,900;9..144,1,900&family=Inter:wght@400;500;600;700;800&display=swap'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
