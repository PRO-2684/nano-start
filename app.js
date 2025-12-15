"use strict";
import { SiteManager } from "./components/site.js";
import { SearchManager } from "./components/search.js";
import { preciseClock } from "./components/clock.js";
import { setupButtonListeners } from "./components/buttons.js";

function initApp() {
    registerServiceWorker();
    const container = document.getElementById("sites-container");

    // Initialize site manager
    const siteManager = new SiteManager(container);

    // Initialize search
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    new SearchManager(searchInput, searchResults, siteManager);

    // Initialize clock
    preciseClock();

    // Setup button listeners
    setupButtonListeners(siteManager);
}

function registerServiceWorker() {
    navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
            console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
            console.log("Service Worker registration failed:", error);
        });
}

// Initialize the app when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
