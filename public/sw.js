const CACHE_NAME = 'mafija-cache-' + Date.now(); // Menja ime svaki put za novi update

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forsira novu verziju da postane aktivna odmah
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Brišem stari keš:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Uvek pokušaj prvo sa interneta, nemoj da koristiš stari keš ako ima mreže
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
