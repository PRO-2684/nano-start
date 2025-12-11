/**
 * Sets up button listeners for import, export, and clear cache functionalities.
 * @param {import("./site.js").SiteManager} siteManager - The site manager instance.
 */
function setupButtonListeners(siteManager) {
    // Add site button
    const addBtn = document.getElementById('add-site-btn');
    addBtn.addEventListener('click', () => {
        siteManager.addNewSite();
    });

    // Import button
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    importBtn?.addEventListener('click', () => {
        importFileInput.click();
    });
    importFileInput?.addEventListener('change', async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            const json = JSON.parse(text);
            if (!Array.isArray(json)) {
                alert('Invalid JSON format. Expected an array of sites.');
                return;
            }
            const importedCount = siteManager.importSites(json);
            e.target.value = ''; // Reset input
            if (importedCount > 0) {
                console.info(`Successfully imported ${importedCount} site(s).`);
            } else {
                alert('No valid sites found in the file.');
            }
        } catch (error) {
            console.error('Error importing sites:', error);
            alert('Failed to import sites. Please check the file format.');
        }
    });

    // Export button
    const exportBtn = document.getElementById('export-btn');
    exportBtn?.addEventListener('click', () => {
        try {
            const exportedCount = siteManager.exportSites();
            if (exportedCount > 0) {
                console.info(`Successfully exported ${exportedCount} site(s).`);
            } else {
                console.info('No sites to export.');
            }
        } catch (error) {
            console.error('Error exporting sites:', error);
            alert('Failed to export sites.');
        }
    });

    // Clear cache button
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    clearCacheBtn?.addEventListener('click', async () => {
        if (!confirm('Clear all cached icons? They will be re-downloaded when needed.')) {
            return;
        }

        try {
            // Send message to service worker to clear icon cache
            navigator.serviceWorker.controller.postMessage({
                type: 'CLEAR_ICON_CACHE'
            });

            // Wait for response
            const response = await new Promise((resolve) => {
                const handler = (event) => {
                    if (event.data.type === 'ICON_CACHE_CLEARED') {
                        navigator.serviceWorker.removeEventListener('message', handler);
                        resolve(event.data);
                    }
                };
                navigator.serviceWorker.addEventListener('message', handler);

                // Timeout after 5 seconds
                setTimeout(() => {
                    navigator.serviceWorker.removeEventListener('message', handler);
                    resolve({ success: false });
                }, 5000);
            });

            if (response.success) {
                console.info('Icon cache cleared successfully.');
            } else {
                console.info('Cache cleared, but confirmation was not received.');
            }
        } catch (error) {
            console.error('Error clearing icon cache:', error);
            alert('Failed to clear icon cache.');
        }
    });
}

export { setupButtonListeners };
