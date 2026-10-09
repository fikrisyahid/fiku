// Minimal service worker for PWA installability requirements
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through fetch handler for PWA criteria
  event.respondWith(fetch(event.request));
});
