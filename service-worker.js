// Nombre de la caché (debe cambiar si actualizas los archivos)
const CACHE_NAME = 'calculadora-cache-v3'; 

// Archivos a guardar en caché para que funcione offline
const urlsToCache = [
  'index.html',
  'manifest.json',
  'icon-180.png', // Icono de Apple
  'icon-192.png', // Icono del manifest
  'icon-512.png', // Icono del manifest
  'https://cdn.tailwindcss.com' // Hoja de estilos de Tailwind
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
  // Ignoramos las peticiones que no son GET
  if (event.request.method !== 'GET') {
      return;
  }
  
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
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
              return response;
            }

            // Clonamos la respuesta para poder guardarla en caché y devolverla al navegador
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Solo guardamos en caché si es una URL de nuestra app o de la CDN
                const url = event.request.url;
                if (!url.startsWith('http') || url.startsWith(self.location.origin) || url.startsWith('https://cdn.tailwindcss.com')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(err => {
            // Manejo básico de error de red (podría devolver una página offline)
            console.warn('Service Worker: Fetch fallido,', err);
            // Opcional: devolver un recurso offline genérico
            // return caches.match('offline.html');
        });
      })
  );
});

