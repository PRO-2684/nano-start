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

    // Alias for compatibility
    get sites() {
        return this.items;
    }

    set sites(value) {
        this.items = value;
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

    // Keep the original method name for backward compatibility
    addNewSite() {
        this.addNewItem();
    }

    /**
     * Import sites from JSON array.
     * @param {Array<{name: string, url: string, icon: string}>} sites - Array of site objects to import.
     * @returns {number} The number of sites imported.
     */
    importSites(sites) {
        let importedCount = 0;
        let id = Date.now();

        sites.forEach((site) => {
            if (!site.name || !site.url) {
                return; // Skip invalid entries
            }

            // Check for duplicates by URL
            const exists = this.sites.some((s) => s.url === site.url);
            if (exists) {
                return; // Skip duplicates
            }

            this.sites.push({
                id: (id++).toString(),
                name: site.name,
                url: site.url,
                icon: site.icon || "🌐",
            });
            importedCount++;
        });

        if (importedCount > 0) {
            this.saveItems();
            this.renderItems();
        }

        return importedCount;
    }

    /**
     * Export sites as JSON and download.
     * @returns {number} The number of sites exported.
     */
    exportSites() {
        if (this.sites.length === 0) {
            return 0;
        }

        const dataStr = JSON.stringify(
            this.sites.map(({ name, url, icon }) => ({ name, url, icon })),
            null,
            2,
        );
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `nano-start-sites-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return this.sites.length;
    }
}

export { SiteManager };
