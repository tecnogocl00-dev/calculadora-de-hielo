// CAMBIO: Actualizamos la versión de la caché a v4
const CACHE_NAME = 'calculadora-cache-v4'; 
console.log(`Service Worker: Cargando versión ${CACHE_NAME}`);

// Archivos a guardar en caché
const urlsToCache = [
  'index.html',
  'manifest.json',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'https://cdn.tailwindcss.com' 
];

// Evento 'install'
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo cache y guardando archivos');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento 'activate': Limpia cachés antiguas
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando cache antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento 'fetch': Sirve desde caché primero
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
      return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, lo devuelve
        if (response) {
          return response;
        }

        // Si no, va a la red
        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                const url = event.request.url;
                if (!url.startsWith('http') || url.startsWith(self.location.origin) || url.startsWith('https://cdn.tailwindcss.com')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(err => {
            console.warn('Service Worker: Fetch fallido,', err);
        });
      })
  );
});

