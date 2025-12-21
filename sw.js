// Service Worker for nano-start
"use strict";

const VERSION = "0.1.1";
const CACHE_NAME = `nano-start-${VERSION}`;
const ICON_CACHE_NAME = `icons-${VERSION}`;
const APP_RESOURCE = [
    "/",
    "/app.js",
    "/favicon.svg",
    "/components/card.js",
    "/components/clock.js",
    "/components/engine.js",
    "/components/search.js",
    "/components/settings.js",
    "/components/site.js",
    "/manifest.json",
    "/styles/index.css",
    "/styles/base.css",
    "/styles/buttons.css",
    "/styles/cards.css",
    "/styles/header.css",
    "/styles/search.css",
    "/styles/settings.css",
    "/styles/variables.css",
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

    // Handle virtual API endpoints
    if (requestUrl.pathname.startsWith("/api/")) {
        console.log(
            "Service Worker: Handling API request:",
            requestUrl.pathname,
        );
        event.respondWith(handleApiRequest(requestUrl, event.request));
        return;
    }

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

// Handle API requests
async function handleApiRequest(requestUrl, request) {
    const pathname = requestUrl.pathname;
    const method = request.method;

    // GET /api/version
    if (method === "GET" && pathname === "/api/version") {
        console.log("Service Worker: Serving version info");
        const versionInfo = {
            version: VERSION,
            cacheName: CACHE_NAME,
            iconCacheName: ICON_CACHE_NAME,
        };
        return new Response(JSON.stringify(versionInfo), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
        });
    }

    // DELETE /api/cache/icons
    if (method === "DELETE" && pathname === "/api/cache/icons") {
        console.log("Service Worker: Clearing icon cache via API");
        try {
            await caches.delete(ICON_CACHE_NAME);
            console.log("Service Worker: Icon cache cleared successfully");
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Icon cache cleared",
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        } catch (error) {
            console.error("Service Worker: Error clearing icon cache:", error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
        }
    }

    // Unknown API endpoint
    console.warn("Service Worker: Unknown API endpoint:", method, pathname);
    return new Response(
        JSON.stringify({ error: "Not Found", path: pathname, method: method }),
        {
            status: 404,
            headers: {
                "Content-Type": "application/json",
            },
        },
    );
}

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
