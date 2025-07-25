const CACHE_NAME = "2025-07-21 00:00";
const urlsToCache = [
  "/talk-phonics/",
  "/talk-phonics/index.js",
  "/talk-phonics/index.yomi",
  "/talk-phonics/mp3/end.mp3",
  "/talk-phonics/mp3/incorrect1.mp3",
  "/talk-phonics/mp3/correct3.mp3",
  "/talk-phonics/favicon/favicon.svg",
  "https://marmooo.github.io/yomico/yomico.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
