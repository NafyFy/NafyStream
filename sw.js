/**
 * NAFY STREAM — SERVICE WORKER PWA (CACHE OFFLINE & ACCÉLÉRATION)
 */

const CACHE_NAME = 'nafy-stream-v2.6';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png',
    './css/variables.css',
    './css/base.css',
    './css/components.css',
    './css/player.css',
    './css/responsive.css',
    './js/config.js',
    './js/storage.js',
    './js/api.js',
    './js/router.js',
    './js/ui.js',
    './js/player.js',
    './js/app.js'
];

// Installation du Service Worker et mise en cache des fichiers statiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
                console.warn('Certains assets statiques n\'ont pas pu être pré-mis en cache :', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Stratégie de récupération réseau / cache
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ne pas intercepter les requêtes non-GET ou les flux iframe des lecteurs vidéo
    if (event.request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
        return;
    }

    // Requêtes vers l'API TMDB : réseau d'abord avec fallback cache si hors-ligne
    if (url.hostname.includes('themoviedb.org')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Fichiers statiques internes : Stale-while-revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
