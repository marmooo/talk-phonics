const CACHE_NAME="2024-02-25 09:42",urlsToCache=["/talk-phonics/","/talk-phonics/index.js","/talk-phonics/index.yomi","/talk-phonics/mp3/end.mp3","/talk-phonics/mp3/incorrect1.mp3","/talk-phonics/mp3/correct3.mp3","/talk-phonics/favicon/favicon.svg","https://marmooo.github.io/yomico/yomico.min.js","https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})