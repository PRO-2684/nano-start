// Service Worker for nano-start
'use strict';

const CACHE_NAME = 'nano-start-v1';
const ICON_CACHE_NAME = 'icons-v1';
const APP_RESOURCE = [
    '/',
    '/app.js',
    '/favicon.svg',
    '/components/clock.js',
    '/components/search.js',
    '/components/site.js',
    '/manifest.json',
    '/style.css',
];

// Install event - cache files
self.addEventListener('install', (event) => {
    // Take control immediately
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(APP_RESOURCE);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Helper to fetch and cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response && (response.status === 200 || response.status === 0 || response.type === 'basic')) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response('You are offline', { status: 503 });
    }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname === "/index.html") {
        requestUrl.pathname = "/";
    }
    const isAppResource = requestUrl.origin === self.location.origin && APP_RESOURCE.includes(requestUrl.pathname);

    if (isAppResource) {
        // App resources: Cache first, then network
        event.respondWith(
            caches.match(requestUrl, { ignoreSearch: true })
                .then(response => response || fetchAndCache(event.request, CACHE_NAME))
        );
    } else {
        // Icons: Network first, then cache
        event.respondWith(fetchAndCache(event.request, ICON_CACHE_NAME));
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    // Take control of all clients immediately
    event.waitUntil(clients.claim());

    const cacheWhitelist = [CACHE_NAME, ICON_CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => !cacheWhitelist.includes(cacheName))
                    .map((cacheName) => {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );
});
