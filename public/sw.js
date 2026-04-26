const CACHE_NAME = 'mafija-v-' + Date.now(); // Svaki put unikatno ime

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forsiraj instalaciju odmah
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    return caches.delete(cache); // Briše apsolutno sav stari keš
                })
            );
        }).then(() => self.clients.claim()) // Preuzmi kontrolu odmah
    );
});

self.addEventListener('fetch', (event) => {
    // Strategija: Mreža prvo, ako nema interneta onda keš
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
