"use strict";
import { CardManager } from "./card.js";

const STORAGE_KEY = "nano-start-sites";

/** Manages the list of sites, adding, editing, deleting, and rendering. */
class SiteManager extends CardManager {
    /**
     * Create a new SiteManager instance.
     * @param {HTMLElement} container - The container element for site cards.
     */
    constructor(container) {
        super(container, STORAGE_KEY);
        this.init();
    }

    /**
     * Get placeholder item template for new sites.
     * @returns {Object} Template object for new site.
     */
    getPlaceholderItem() {
        return {
            name: "New Site",
            url: "https://example.org/",
            icon: "🌐",
        };
    }

    /**
     * Get default items for first load.
     * @returns {Array} Empty array (no default sites).
     */
    getDefaultItems() {
        return [];
    }

    /**
     * Override createCardElement to make site cards clickable links.
     * @param {Object} item - The site data.
     * @returns {HTMLAnchorElement} The card element as a link.
     */
    createCardElement(item) {
        const card = document.createElement("a");
        card.href = item.url;
        card.draggable = false;
        card.rel = "noopener noreferrer";
        return card;
    }

    /**
     * Override URL validation to provide specific error message.
     * @param {string} url - The URL to validate.
     * @returns {boolean} Whether the URL is valid.
     */
    validateUrl(url) {
        if (!URL.canParse(url)) {
            alert("Please enter a valid URL (e.g., https://example.com)");
            return false;
        }
        return true;
    }
}

export { SiteManager };
