// ColW — service worker: guarda la app para abrirla rápido y sin conexión.
// Los datos viven en el navegador (localStorage, ver js/mock-api.js).
const CACHE = 'colw-v3';
// Rutas relativas a la carpeta del service worker (funciona en GitHub Pages: /<repo>/).
const SHELL = ['./', 'index.html', 'css/styles.css', 'css/glass.css', 'js/icons.js', 'js/mock-api.js', 'js/store.js', 'js/app.js', 'manifest.webmanifest',
  'img/codesah.svg', 'img/favicon.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Pantallas: primero la red (para tener siempre la última versión); sin red, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return res; })
      .catch(async () => (await caches.match('index.html')) || caches.match('offline.html')));
    return;
  }
  // Archivos (estilos, código, imágenes): copia guardada al instante y se actualiza en segundo plano.
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
