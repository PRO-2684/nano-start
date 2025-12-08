'use strict';
import { SiteManager } from "./components/site.js";
import { initClock } from "./components/clock.js";

// Initialize and update clock

function initApp() {
    const container = document.getElementById('sites-container');
    new SiteManager(container);
    initClock();
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
