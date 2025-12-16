// Service Worker for nano-start
"use strict";

const VERSION = "0.1.0";
const CACHE_NAME = `nano-start-${VERSION}`;
const ICON_CACHE_NAME = `icons-${VERSION}`;
const APP_RESOURCE = [
    "/",
    "/app.js",
    "/favicon.svg",
    "/components/clock.js",
    "/components/search.js",
    "/components/settings.js",
    "/components/site.js",
    "/manifest.json",
    "/style.css",
    "/styles/variables.css",
    "/styles/base.css",
    "/styles/header.css",
    "/styles/search.css",
    "/styles/buttons.css",
    "/styles/sites.css",
    "/styles/dialog.css",
    "/styles/settings.css",
    "/styles/responsive.css",
    "https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs",
];

// Install event - cache files
self.addEventListener("install", (event) => {
    // Take control immediately
    self.skipWaiting();

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("Opened cache");
                return cache.addAll(APP_RESOURCE);
            })
            .catch((error) => {
                console.error("Cache installation failed:", error);
            }),
    );
});

// Helper to fetch and cache
async function fetchAndCache(request, cacheName) {
    try {
        const response = await fetch(request);
        if (
            response &&
            (response.status === 200 ||
                response.status === 0 ||
                response.type === "basic")
        ) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response("You are offline", { status: 503 });
    }
}

// Helper to determine if a request is for an app resource
function isAppResource(requestUrl) {
    return APP_RESOURCE.some((urlStr) => {
        const url = new URL(urlStr, self.location.origin);
        return (
            url.origin === requestUrl.origin &&
            url.pathname === requestUrl.pathname
        );
    });
}

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname === "/index.html") {
        requestUrl.pathname = "/";
    }
    const cacheName = isAppResource(requestUrl) ? CACHE_NAME : ICON_CACHE_NAME;

    // Cache first strategy for both app resources and icons
    event.respondWith(
        caches
            .match(isAppResource(requestUrl) ? requestUrl : event.request, {
                ignoreSearch: true,
            })
            .then(
                (response) =>
                    response || fetchAndCache(event.request, cacheName),
            ),
    );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    // Take control of all clients immediately
    event.waitUntil(clients.claim());

    const cacheWhitelist = [CACHE_NAME, ICON_CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => !cacheWhitelist.includes(cacheName))
                    .map((cacheName) => {
                        console.log("Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }),
            );
        }),
    );
});

// Message event - handle commands from the app
self.addEventListener("message", (event) => {
    if (event.data.type === "CLEAR_ICON_CACHE") {
        event.waitUntil(
            caches
                .delete(ICON_CACHE_NAME)
                .then(() => {
                    console.log("Icon cache cleared");
                    // Send confirmation back to the client
                    event.source.postMessage({
                        type: "ICON_CACHE_CLEARED",
                        success: true,
                    });
                })
                .catch((error) => {
                    console.error("Error clearing icon cache:", error);
                    event.source.postMessage({
                        type: "ICON_CACHE_CLEARED",
                        success: false,
                        error: error.message,
                    });
                }),
        );
    }
});
