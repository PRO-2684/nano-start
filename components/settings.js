"use strict";
import { SearchEngineManager } from "./engine.js";

/** Manages application settings dialog and integrates various managers. */
class SettingsManager extends EventTarget {
    /**
     * Create a new SettingsManager instance.
     * @param {import('./site.js').SiteManager} siteManager - The site manager instance.
     */
    constructor(siteManager) {
        super();
        this.siteManager = siteManager;
        this.dialog = document.getElementById("settings-dialog");

        // Initialize search engine manager with the engines container
        const enginesContainer = document.getElementById("search-engines-list");
        this.engineManager = new SearchEngineManager(enginesContainer);

        this.init();
    }

    /** Initialize the settings manager: setup event listeners, initialize engine manager. */
    init() {
        this.engineManager.init();
        this.setupEventListeners();
    }

    /**
     * Get all engines as search results.
     * @param {string} query - The search query.
     * @returns {Array<{name: string, url: string, icon: string}>} Array of search result objects.
     */
    getEngineSearchResults(query) {
        return this.engineManager.getSearchResults(query);
    }

    /** Setup all event listeners for the settings dialog. */
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
            this.engineManager.addNewItem(),
        );

        // Setup backup and advanced buttons
        this.setupBackupButtons();
        this.setupAdvancedButtons();
    }

    /** Setup backup-related button listeners (import/export). */
    setupBackupButtons() {
        // Import button (now in settings dialog)
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
}

export { SettingsManager };
