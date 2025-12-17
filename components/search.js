import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.1.0/dist/fuse.mjs";

/**
 * @typedef {Object} SearchResult
 * @property {string} name - The result name.
 * @property {string} url - The result URL.
 * @property {string} icon - The result icon (emoji or URL).
 */

/** Manages search functionality with fuzzy matching and keyboard navigation. */
class SearchManager {
    /**
     * Create a new SearchManager instance.
     * @param {HTMLInputElement} inputElement - The search input element.
     * @param {HTMLElement} resultsElement - The container for search results.
     * @param {import('./site.js').SiteManager} siteManager - The site manager instance.
     * @param {import('./settings.js').SettingsManager} settingsManager - The settings manager instance.
     */
    constructor(inputElement, resultsElement, siteManager, settingsManager) {
        this.input = inputElement;
        this.resultsContainer = resultsElement;
        this.siteManager = siteManager;
        this.settingsManager = settingsManager;
        this.debounceTimer = null;
        this.fuse = new Fuse(this.siteManager.sites, {
            keys: [
                {
                    name: "name",
                    weight: 0.7,
                },
                {
                    name: "url",
                    weight: 0.3,
                },
            ],
            useExtendedSearch: true, // https://www.fusejs.io/examples.html#extended-search
            threshold: 0.6,
            ignoreDiacritics: true,
            ignoreLocation: true,
        });

        this.setupEventListeners();
    }

    /**
     * Get the index of the currently highlighted result item.
     * @returns {number} The index of the highlighted item, or -1 if none.
     */
    get highlightedIndex() {
        const index = this.resultsContainer.querySelector(
            ".search-result-item.highlighted",
        )?.dataset.index;
        return index !== undefined ? parseInt(index, 10) : -1;
    }

    /**
     * Set the highlighted result item by index.
     * @param {number} value - The index to highlight.
     */
    set highlightedIndex(value) {
        this.resultsContainer.children[this.highlightedIndex]?.classList.remove(
            "highlighted",
        );
        this.resultsContainer.children[value]?.classList.add("highlighted");
    }

    /** Setup all event listeners for search input, keyboard navigation, and site updates. */
    setupEventListeners() {
        // Input change with debounce
        this.input.addEventListener("input", (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 150);
        });

        // Keyboard navigation
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                this.highlightNext();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                this.highlightPrevious();
            } else if (e.key === "Home") {
                e.preventDefault();
                this.highlightedIndex = 0;
            } else if (e.key === "End") {
                e.preventDefault();
                this.highlightedIndex =
                    this.resultsContainer.childElementCount - 1;
            } else if (e.key === "Enter") {
                e.preventDefault();
                this.resultsContainer.children[
                    this.highlightedIndex
                ]?.dispatchEvent(
                    // Delegate to highlighted item's click event, keeping modifiers
                    new MouseEvent("click", e),
                );
            } else if (e.key === "Escape") {
                e.preventDefault();
                if (this.input.value.trim() === "") {
                    // Blur input if empty
                    this.input.blur();
                } else {
                    // Otherwise clear input
                    this.clear();
                }
            }
        });

        // Click outside to close
        document.addEventListener("click", (e) => {
            if (
                !this.input.contains(e.target) &&
                !this.resultsContainer.contains(e.target)
            ) {
                this.hideResults();
            }
        });

        // Enter to focus input
        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && document.activeElement !== this.input) {
                this.input.focus();
                e.preventDefault();
            }
        });

        // Listen for site list updates to refresh Fuse index
        this.siteManager.addEventListener("sitesUpdated", () => {
            this.fuse.setCollection(this.siteManager.sites);
        });
    }

    /**
     * Handle search query and render results.
     * @param {string} query - The search query.
     */
    handleSearch(query) {
        query = query.trim();

        if (!query) {
            this.hideResults();
            return;
        }

        const results = this.getResults(query);
        this.renderResults(results);
    }

    /**
     * Get search results including filtered sites and configured search engines.
     * @param {string} query - The search query.
     * @returns {SearchResult[]} Array of result objects with name, url, and icon properties.
     */
    getResults(query) {
        const siteResults = this.filterSites(query);
        const engineResults =
            this.settingsManager.getEngineSearchResults(query);
        return [...siteResults, ...engineResults];
    }

    /**
     * Filter sites using fuzzy search.
     * @param {string} query - The search query.
     * @returns {SearchResult[]} Array of matching site objects.
     */
    filterSites(query) {
        this.fuse.setCollection(this.siteManager.sites);
        const fuseResults = this.fuse.search(query);
        return fuseResults.map((result) => result.item);
    }

    /**
     * Render search results in the results container.
     * @param {SearchResult[]} results - Array of result objects to render.
     */
    renderResults(results) {
        this.resultsContainer.innerHTML = "";

        results.forEach((result, index) => {
            const item = this.createResultItem(result, index);
            this.resultsContainer.appendChild(item);
        });

        this.highlightedIndex = 0;
        this.resultsContainer.hidden = false;
    }

    /**
     * Create a search result item element.
     * @param {SearchResult} data - The result data object.
     * @param {number} index - The index of this result in the list.
     * @returns {HTMLAnchorElement} The created result item element.
     */
    createResultItem(data, index) {
        const item = document.createElement("a");
        item.className = "search-result-item";
        item.href = data.url;
        item.rel = "noopener noreferrer";
        item.dataset.index = index;

        // Icon
        const iconDiv = document.createElement("div");
        iconDiv.className = "result-icon";

        if (URL.canParse(data.icon)) {
            const img = document.createElement("img");
            img.src = data.icon;
            img.alt = data.name;
            iconDiv.appendChild(img);
        } else {
            iconDiv.textContent = data.icon;
        }

        // Info
        const infoDiv = document.createElement("div");
        infoDiv.className = "result-info";

        const nameDiv = document.createElement("div");
        nameDiv.className = "result-name";
        nameDiv.textContent = data.name;

        const urlDiv = document.createElement("div");
        urlDiv.className = "result-url";
        urlDiv.textContent = this.formatUrl(data.url);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(urlDiv);

        item.appendChild(iconDiv);
        item.appendChild(infoDiv);

        // Click handler to clear search
        item.addEventListener("click", () => {
            this.clear();
        });

        return item;
    }

    /**
     * Format URL for display by extracting hostname.
     * @param {string} url - The full URL.
     * @returns {string} The hostname or original URL if parsing fails.
     */
    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return url;
        }
    }

    /** Highlight the next result item (wraps to first). */
    highlightNext() {
        if (this.resultsContainer.hidden) return;

        const itemCount = this.resultsContainer.childElementCount;
        this.highlightedIndex = (this.highlightedIndex + 1) % itemCount;
    }

    /** Highlight the previous result item (wraps to last). */
    highlightPrevious() {
        if (this.resultsContainer.hidden) return;

        const itemCount = this.resultsContainer.childElementCount;
        this.highlightedIndex =
            (this.highlightedIndex - 1 + itemCount) % itemCount;
    }

    /** Hide the search results container. */
    hideResults() {
        this.resultsContainer.hidden = true;
    }

    /** Clear the search input and hide results. */
    clear() {
        this.input.value = "";
        this.hideResults();
    }
}

export { SearchManager };
