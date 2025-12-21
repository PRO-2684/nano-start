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
        this.loadVersionInfo();
    }

    /**
     * Get all engines as search results.
     * @param {string} query - The search query.
     * @returns {Array<{name: string, url: string, icon: string}>} Array of search result objects.
     */
    getEngineSearchResults(query) {
        return this.engineManager.getSearchResults(query);
    }

    /** Load version information from service worker. */
    async loadVersionInfo() {
        const versionElement = document.querySelector(".about-version");
        if (!versionElement) {
            console.warn("Version element not found");
            return;
        }

        try {
            console.log("Loading version info from service worker...");

            // Wait for service worker to be ready and controlling
            const registration = await navigator.serviceWorker.ready;
            console.log("Service worker ready:", registration);

            // If no controller yet, wait for it
            if (!navigator.serviceWorker.controller) {
                console.log("Waiting for service worker to take control...");
                // Service worker needs to take control first
                await new Promise((resolve) => {
                    navigator.serviceWorker.addEventListener(
                        "controllerchange",
                        resolve,
                        { once: true },
                    );
                });
                console.log("Service worker now controlling");
            }

            // Listen for response with timeout
            const handleMessage = (event) => {
                if (event.data.type === "VERSION_INFO") {
                    console.log("Received version info:", event.data);
                    versionElement.textContent = `Version ${event.data.version}`;
                    navigator.serviceWorker.removeEventListener(
                        "message",
                        handleMessage,
                    );
                }
            };

            navigator.serviceWorker.addEventListener("message", handleMessage);

            // Request version info from service worker
            console.log("Sending GET_VERSION message to service worker");
            navigator.serviceWorker.controller.postMessage({
                type: "GET_VERSION",
            });

            // Fallback timeout - if no response in 2 seconds, show unknown
            setTimeout(() => {
                if (versionElement.textContent === "Loading version...") {
                    console.warn(
                        "Version info timeout - no response from service worker",
                    );
                    versionElement.textContent = "Version unknown";
                    navigator.serviceWorker.removeEventListener(
                        "message",
                        handleMessage,
                    );
                }
            }, 2000);
        } catch (error) {
            console.error("Error loading version info:", error);
            versionElement.textContent = "Version unknown";
        }
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
        // Export button
        const exportBtn = document.getElementById("export-btn");
        exportBtn?.addEventListener("click", () => {
            try {
                const backupSitesCheckbox = document.getElementById(
                    "backup-sites-checkbox",
                );
                const backupEnginesCheckbox = document.getElementById(
                    "backup-engines-checkbox",
                );

                const includeSites = backupSitesCheckbox?.checked;
                const includeEngines = backupEnginesCheckbox?.checked;

                if (!includeSites && !includeEngines) {
                    alert("Please select at least one item to export.");
                    return;
                }

                const exportData = {};

                if (includeSites) {
                    exportData.sites = this.siteManager.exportToJSON();
                }

                if (includeEngines) {
                    exportData.engines = this.engineManager.exportToJSON();
                }

                const dataStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `nano-start-backup-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.info("Successfully exported backup data.");
            } catch (error) {
                console.error("Error exporting data:", error);
                alert("Failed to export data.");
            }
        });

        // Import button
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

                if (typeof json !== "object" || json === null) {
                    alert("Invalid JSON format. Expected a backup object.");
                    e.target.value = "";
                    return;
                }

                const backupSitesCheckbox = document.getElementById(
                    "backup-sites-checkbox",
                );
                const backupEnginesCheckbox = document.getElementById(
                    "backup-engines-checkbox",
                );

                const includeSites = backupSitesCheckbox?.checked;
                const includeEngines = backupEnginesCheckbox?.checked;

                let sitesImported = 0;
                let enginesImported = 0;

                if (includeSites && json.sites && Array.isArray(json.sites)) {
                    sitesImported = this.siteManager.importFromJSON(json.sites);
                }

                if (
                    includeEngines &&
                    json.engines &&
                    Array.isArray(json.engines)
                ) {
                    enginesImported = this.engineManager.importFromJSON(
                        json.engines,
                    );
                }

                e.target.value = ""; // Reset input

                const messages = [];
                if (sitesImported > 0) {
                    messages.push(`${sitesImported} site(s)`);
                }
                if (enginesImported > 0) {
                    messages.push(`${enginesImported} search engine(s)`);
                }

                if (messages.length > 0) {
                    console.info(
                        `Successfully imported ${messages.join(" and ")}.`,
                    );
                } else {
                    alert(
                        "No valid data found in the file or all items were duplicates.",
                    );
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert("Failed to import data. Please check the file format.");
                e.target.value = "";
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
                console.log(
                    "Sending CLEAR_ICON_CACHE message to service worker",
                );
                // Send message to service worker to clear icon cache
                navigator.serviceWorker.controller.postMessage({
                    type: "CLEAR_ICON_CACHE",
                });

                // Wait for response
                const response = await new Promise((resolve) => {
                    const handler = (event) => {
                        if (event.data.type === "ICON_CACHE_CLEARED") {
                            console.log(
                                "Received ICON_CACHE_CLEARED response:",
                                event.data,
                            );
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
                        console.warn(
                            "Clear cache timeout - no response from service worker",
                        );
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
