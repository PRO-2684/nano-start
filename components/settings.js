"use strict";

const SETTINGS_STORAGE_KEY = "nano-start-settings";

/** Default search engines available to users. */
const DEFAULT_SEARCH_ENGINES = [
    {
        id: "google",
        name: "Google",
        url: "https://www.google.com/search?q={query}",
        icon: "🔍",
        builtin: true,
    },
    {
        id: "duckduckgo",
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q={query}",
        icon: "🦆",
        builtin: true,
    },
    {
        id: "bing",
        name: "Bing",
        url: "https://www.bing.com/search?q={query}",
        icon: "🔵",
        builtin: true,
    },
    {
        id: "brave",
        name: "Brave Search",
        url: "https://search.brave.com/search?q={query}",
        icon: "🦁",
        builtin: true,
    },
    {
        id: "ecosia",
        name: "Ecosia",
        url: "https://www.ecosia.org/search?q={query}",
        icon: "🌱",
        builtin: true,
    },
];

/** Manages application settings including search engines and preferences. */
class SettingsManager extends EventTarget {
    /**
     * Create a new SettingsManager instance.
     * @param {import('./site.js').SiteManager} siteManager - The site manager instance.
     */
    constructor(siteManager) {
        super();
        this.siteManager = siteManager;
        this.dialog = document.getElementById("settings-dialog");
        this.searchEnginesList = document.getElementById("search-engines-list");

        /** @type {{searchEngines: Array<{id: string, name: string, url: string, icon: string, builtin?: boolean}>, defaultSearchEngine: string}} */
        this.settings = {
            searchEngines: [...DEFAULT_SEARCH_ENGINES],
            defaultSearchEngine: "google",
        };

        this.init();
    }

    /** Initialize the settings manager: load settings, setup event listeners, render UI. */
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.renderSearchEngines();
    }

    /** Load settings from localStorage. */
    loadSettings() {
        try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all built-in engines are present
                const builtinIds = new Set(
                    DEFAULT_SEARCH_ENGINES.map((e) => e.id),
                );
                const customEngines = (parsed.searchEngines || []).filter(
                    (e) => !e.builtin,
                );

                this.settings = {
                    searchEngines: [
                        ...DEFAULT_SEARCH_ENGINES,
                        ...customEngines,
                    ],
                    defaultSearchEngine: parsed.defaultSearchEngine || "google",
                };
            }
        } catch (error) {
            console.error("Error loading settings from localStorage:", error);
        }
    }

    /** Save settings to localStorage and dispatch update event. */
    saveSettings() {
        try {
            localStorage.setItem(
                SETTINGS_STORAGE_KEY,
                JSON.stringify(this.settings),
            );
            this.dispatchEvent(new Event("settingsUpdated"));
        } catch (error) {
            console.error("Error saving settings to localStorage:", error);
        }
    }

    /**
     * Get the currently configured default search engine.
     * @returns {{id: string, name: string, url: string, icon: string}} The default search engine object.
     */
    getDefaultSearchEngine() {
        return (
            this.settings.searchEngines.find(
                (e) => e.id === this.settings.defaultSearchEngine,
            ) || this.settings.searchEngines[0]
        );
    }

    /**
     * Generate search URL for the given query using the default search engine.
     * @param {string} query - The search query.
     * @returns {string} The search URL.
     */
    getSearchUrl(query) {
        const engine = this.getDefaultSearchEngine();
        return engine.url.replace("{query}", encodeURIComponent(query));
    }

    /** Setup all event listeners for the settings modal. */
    setupEventListeners() {
        // Open dialog
        const settingsBtn = document.getElementById("settings-btn");
        settingsBtn?.addEventListener("click", () => this.openDialog());

        // Close dialog
        const closeBtn = document.getElementById("close-settings-btn");
        closeBtn?.addEventListener("click", () => this.closeDialog());

        // Add custom search engine
        const addEngineBtn = document.getElementById("add-search-engine-btn");
        addEngineBtn?.addEventListener("click", () =>
            this.addCustomSearchEngine(),
        );

        // Import/Export/Clear Cache - these are now in the modal
        this.setupBackupButtons();
        this.setupAdvancedButtons();
    }

    /** Setup backup-related button listeners (import/export). */
    setupBackupButtons() {
        // Import button (now in settings modal)
        const importBtn = document.getElementById("import-btn");
        const importFileInput = document.getElementById("import-file-input");

        importBtn?.addEventListener("click", () => {
            importFileInput.click();
        });

        importFileInput?.addEventListener("change", async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                const text = await file.text();
                const json = JSON.parse(text);
                if (!Array.isArray(json)) {
                    alert("Invalid JSON format. Expected an array of sites.");
                    return;
                }
                const importedCount = this.siteManager.importSites(json);
                e.target.value = ""; // Reset input
                if (importedCount > 0) {
                    console.info(
                        `Successfully imported ${importedCount} site(s).`,
                    );
                } else {
                    alert("No valid sites found in the file.");
                }
            } catch (error) {
                console.error("Error importing sites:", error);
                alert("Failed to import sites. Please check the file format.");
            }
        });

        // Export button
        const exportBtn = document.getElementById("export-btn");
        exportBtn?.addEventListener("click", () => {
            try {
                const exportedCount = this.siteManager.exportSites();
                if (exportedCount > 0) {
                    console.info(
                        `Successfully exported ${exportedCount} site(s).`,
                    );
                } else {
                    console.info("No sites to export.");
                }
            } catch (error) {
                console.error("Error exporting sites:", error);
                alert("Failed to export sites.");
            }
        });
    }

    /** Setup advanced button listeners (clear cache). */
    setupAdvancedButtons() {
        const clearCacheBtn = document.getElementById("clear-cache-btn");
        clearCacheBtn?.addEventListener("click", async () => {
            if (
                !confirm(
                    "Clear all cached icons? They will be re-downloaded when needed.",
                )
            ) {
                return;
            }

            try {
                // Send message to service worker to clear icon cache
                navigator.serviceWorker.controller.postMessage({
                    type: "CLEAR_ICON_CACHE",
                });

                // Wait for response
                const response = await new Promise((resolve) => {
                    const handler = (event) => {
                        if (event.data.type === "ICON_CACHE_CLEARED") {
                            navigator.serviceWorker.removeEventListener(
                                "message",
                                handler,
                            );
                            resolve(event.data);
                        }
                    };
                    navigator.serviceWorker.addEventListener(
                        "message",
                        handler,
                    );

                    // Timeout after 5 seconds
                    setTimeout(() => {
                        navigator.serviceWorker.removeEventListener(
                            "message",
                            handler,
                        );
                        resolve({ success: false });
                    }, 5000);
                });

                if (response.success) {
                    console.info("Icon cache cleared successfully.");
                } else {
                    console.info(
                        "Cache cleared, but confirmation was not received.",
                    );
                }
            } catch (error) {
                console.error("Error clearing icon cache:", error);
                alert("Failed to clear icon cache.");
            }
        });
    }

    /** Open the settings dialog. */
    openDialog() {
        this.dialog.showModal();
    }

    /** Close the settings dialog. */
    closeDialog() {
        this.dialog.close();
    }

    /** Render the search engines list. */
    renderSearchEngines() {
        this.searchEnginesList.innerHTML = "";

        this.settings.searchEngines.forEach((engine) => {
            const item = this.createSearchEngineItem(engine);
            this.searchEnginesList.appendChild(item);
        });
    }

    /**
     * Create a search engine list item.
     * @param {{id: string, name: string, url: string, icon: string, builtin?: boolean}} engine - The search engine data.
     * @returns {HTMLElement} The created list item element.
     */
    createSearchEngineItem(engine) {
        const item = document.createElement("label");
        item.className = "search-engine-item";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "search-engine";
        radio.value = engine.id;
        radio.checked = engine.id === this.settings.defaultSearchEngine;
        radio.addEventListener("change", () => {
            this.settings.defaultSearchEngine = engine.id;
            this.saveSettings();
        });

        const icon = document.createElement("span");
        icon.className = "engine-icon";
        icon.textContent = engine.icon;

        const name = document.createElement("span");
        name.className = "engine-name";
        name.textContent = engine.name;

        const url = document.createElement("span");
        url.className = "engine-url";
        url.textContent = engine.url.replace("{query}", "...");

        const actions = document.createElement("div");
        actions.className = "engine-actions";

        // Only allow deleting custom engines
        if (!engine.builtin) {
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "engine-delete-btn";
            deleteBtn.innerHTML = "🗑️";
            deleteBtn.title = "Delete";
            deleteBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.deleteSearchEngine(engine.id);
            });
            actions.appendChild(deleteBtn);
        }

        item.appendChild(radio);
        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(url);
        item.appendChild(actions);

        return item;
    }

    /** Add a custom search engine with user input. */
    addCustomSearchEngine() {
        const name = prompt("Search engine name:", "My Search Engine");
        if (!name) return;

        const url = prompt(
            "Search URL (use {query} as placeholder):\nExample: https://example.com/search?q={query}",
            "https://example.com/search?q={query}",
        );
        if (!url) return;

        if (!url.includes("{query}")) {
            alert("Search URL must contain {query} placeholder.");
            return;
        }

        const icon = prompt("Icon (emoji or text):", "🔎");
        if (!icon) return;

        const engine = {
            id: `custom-${Date.now()}`,
            name,
            url,
            icon,
            builtin: false,
        };

        this.settings.searchEngines.push(engine);
        this.saveSettings();
        this.renderSearchEngines();
    }

    /**
     * Delete a custom search engine.
     * @param {string} engineId - The ID of the engine to delete.
     */
    deleteSearchEngine(engineId) {
        if (!confirm("Delete this search engine?")) return;

        const index = this.settings.searchEngines.findIndex(
            (e) => e.id === engineId,
        );
        if (index === -1) return;

        this.settings.searchEngines.splice(index, 1);

        // If deleted engine was default, switch to Google
        if (this.settings.defaultSearchEngine === engineId) {
            this.settings.defaultSearchEngine = "google";
        }

        this.saveSettings();
        this.renderSearchEngines();
    }
}

export { SettingsManager };
