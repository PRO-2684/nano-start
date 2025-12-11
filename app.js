'use strict';
import { SiteManager } from "./components/site.js";
import { SearchManager } from "./components/search.js";
import { preciseClock } from "./components/clock.js";

function initApp() {
    const container = document.getElementById('sites-container');

    // Initialize site manager
    const addBtn = document.getElementById('add-site-btn');
    const siteManager = new SiteManager(container, addBtn);

    // Initialize search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    new SearchManager(searchInput, searchResults, siteManager);

    preciseClock();
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
