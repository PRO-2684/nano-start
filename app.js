"use strict";
import { SiteManager } from "./components/site.js";
import { SearchManager } from "./components/search.js";
import { SettingsManager } from "./components/settings.js";
import { preciseClock } from "./components/clock.js";

function initApp() {
    registerServiceWorker();
    const container = document.getElementById("sites-container");

    // Initialize site manager
    const siteManager = new SiteManager(container);

    // Initialize settings manager
    const settingsManager = new SettingsManager(siteManager);

    // Initialize search
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    new SearchManager(searchInput, searchResults, siteManager, settingsManager);

    // Initialize clock
    preciseClock();

    // Setup add site button
    const addBtn = document.getElementById("add-site-btn");
    addBtn.addEventListener("click", () => {
        siteManager.addNewSite();
    });
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
