"use strict";
import { CardManager } from "./card.js";

const ENGINE_STORAGE_KEY = "nano-start-engines";

/** Default search engines available to users on first load. */
const DEFAULT_SEARCH_ENGINES = [
    {
        id: "google",
        name: "Google",
        url: "https://www.google.com/search?q={query}",
        icon: "🔍",
    },
    {
        id: "bing",
        name: "Bing",
        url: "https://www.bing.com/search?q={query}",
        icon: "🔵",
    },
    {
        id: "duckduckgo",
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q={query}",
        icon: "🦆",
    },
];

/** Manages search engines with card-based UI. */
class SearchEngineManager extends CardManager {
    /**
     * Create a new SearchEngineManager instance.
     * @param {HTMLElement} container - The container element for engine cards.
     */
    constructor(container) {
        super(container, ENGINE_STORAGE_KEY);
    }

    /**
     * Get placeholder item template for new search engines.
     * @returns {Object} Template object for new engine.
     */
    getPlaceholderItem() {
        return {
            name: "New Search Engine",
            url: "https://example.com/search?q={query}",
            icon: "🔎",
        };
    }

    /**
     * Get default items for first load.
     * @returns {Array} Array of default search engines.
     */
    getDefaultItems() {
        return [...DEFAULT_SEARCH_ENGINES];
    }

    // Alias for compatibility
    get engines() {
        return this.items;
    }

    set engines(value) {
        this.items = value;
    }

    /**
     * Override URL validation to check for {query} placeholder.
     * @param {string} url - The URL to validate.
     * @returns {boolean} Whether the URL is valid.
     */
    validateUrl(url) {
        if (!url.includes("{query}")) {
            alert("Search URL must contain {query} placeholder.");
            return false;
        }
        // Remove {query} and validate the base URL
        const baseUrl = url.replace("{query}", "test");
        if (!URL.canParse(baseUrl)) {
            return false;
        }
        return true;
    }

    /**
     * Override createCardElement to create non-link cards.
     * @param {Object} item - The engine data.
     * @returns {HTMLDivElement} The card element.
     */
    createCardElement(item) {
        const card = document.createElement("div");
        return card;
    }

    /**
     * Override formatUrl to show placeholder.
     * @param {string} url - The URL template.
     * @returns {string} The formatted URL.
     */
    formatUrl(url) {
        return url.replace("{query}", "...");
    }

    /**
     * Get all engines as search result objects.
     * @param {string} query - The search query.
     * @returns {Array<{name: string, url: string, icon: string}>} Search result objects.
     */
    getSearchResults(query) {
        return this.items.map((engine) => ({
            name: `Search ${engine.name} for "${query}"`,
            url: engine.url.replace("{query}", encodeURIComponent(query)),
            icon: engine.icon,
        }));
    }
}

export { SearchEngineManager, DEFAULT_SEARCH_ENGINES };
