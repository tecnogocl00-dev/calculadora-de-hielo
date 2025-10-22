// Nombre de la caché (debe cambiar si actualizas los archivos)
const CACHE_NAME = 'calculadora-cache-v1';

// Archivos a guardar en caché para que funcione offline
const urlsToCache = [
  'calculadora.html',
  'https://cdn.tailwindcss.com',
  'https://placehold.co/192x192/14B8A6/FFFFFF?text=Calc',
  'https://placehold.co/512x512/14B8A6/FFFFFF?text=Calc'
];

// Evento 'install': se dispara cuando el SW se instala
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo cache y guardando archivos');
        // Añade todos los archivos definidos a la caché
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Fuerza la activación del nuevo SW
  );
});

// Evento 'activate': se dispara cuando el SW se activa
// Aquí es donde limpiamos cachés antiguas
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Si el nombre de la caché no es el actual, bórrala
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando cache antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control inmediato de las páginas
  );
});

// Evento 'fetch': se dispara con cada petición de red
// Estrategia: Cache-First (primero busca en caché)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devuelve desde ahí
        if (response) {
          return response;
        }

        // Si no está en caché, va a la red a buscarlo
        return fetch(event.request).then(
          response => {
            // Verificar si la respuesta es válida
            // No guardamos en caché respuestas que no sean 200, etc.
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            // Clonamos la respuesta para poder guardarla en caché y devolverla al navegador
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});
