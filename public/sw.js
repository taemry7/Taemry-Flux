self.options = {
    "domain": "5gvci.com",
    "zoneId": 11814728
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

// TAEMRY FLUX Progressive Web App Service Worker (Online-Only Mode)
// Offline caching capabilities are completely disabled per architecture requirements.

self.addEventListener('install', (event) => {
  // Activate immediately without precaching any assets offline
  self.skipWaiting();
});

// Activate: purge and delete all existing browser caches completely
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Pure online direct network requests, zero offline caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Ignore non-http schemes (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Let all requests go directly to the network online
  event.respondWith(fetch(event.request));
});
