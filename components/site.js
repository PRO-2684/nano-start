const STORAGE_KEY = "nano-start-sites";

/** Manages the list of sites, adding, editing, deleting, and rendering. */
class SiteManager extends EventTarget {
    /**
     * Create a new SiteManager instance.
     * @param {HTMLElement} container - The container element for site cards.
     */
    constructor(container) {
        super();
        this.container = container;
        /**
         * Stored list of sites.
         * @type {Array<{id: string, name: string, url: string, icon: string}>}
         */
        this.sites = [];
        this.draggedElement = null;
        this.init();
    }

    /** Initialize the site manager: load sites, setup event listeners, render sites, register service worker. */
    init() {
        this.loadSites();
        this.renderSites();
    }

    /** Load sites from localStorage. */
    loadSites() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.sites = JSON.parse(stored);
            }
        } catch (error) {
            console.error("Error loading sites from localStorage:", error);
            this.sites = [];
        }
    }

    /** Save sites to localStorage and dispatch update event. */
    saveSites() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sites));
        } catch (error) {
            console.error("Error saving sites to localStorage:", error);
        }
        this.dispatchEvent(new Event("sitesUpdated"));
    }

    /**
     * Focus and select the site name input in the given card.
     * @param {HTMLElement} card - The site card element.
     */
    selectSiteName(card) {
        const siteName = card?.querySelector?.(".site-name");
        if (!siteName) return;
        siteName.focus();
        siteName.select();
    }

    /**
     * Enable or disable editing mode for a site card.
     * @param {HTMLElement} card - The site card element.
     * @param {Object} site - The site data object.
     * @param {string} site.name - The site name.
     * @param {string} site.url - The site URL.
     * @param {boolean} enable - Whether to enable editing mode.
     */
    setCardEditing(card, site, enable) {
        card.classList.toggle("editing", enable);

        const nameInput = card.querySelector(".site-name");
        const urlInput = card.querySelector(".site-url");

        nameInput.readOnly = !enable;
        nameInput.value = site.name;
        urlInput.readOnly = !enable;
        urlInput.value = enable ? site.url : this.formatUrl(site.url);
        urlInput.type = enable ? "url" : "text";

        // Update edit button
        const editBtn = card.querySelector(".edit-btn");
        if (enable) {
            editBtn.innerHTML = "✓";
            editBtn.setAttribute("title", "Save");
        } else {
            editBtn.innerHTML = "✎";
            editBtn.setAttribute("title", "Edit");
        }
    }

    /** Add a new site with default values and start editing. */
    addNewSite() {
        const site = {
            id: Date.now().toString(),
            name: "New Site",
            url: "https://example.org/",
            icon: "🌐",
        };
        this.sites.push(site);
        this.saveSites();

        // Append the new card
        const card = this.createSiteCard(site);
        this.container.appendChild(card);
        this.setCardEditing(card, site, true);
        this.selectSiteName(card);
    }

    /**
     * Start editing a site card.
     * @param {string} siteId - The ID of the site to edit.
     */
    startEditing(siteId) {
        const card = document.querySelector(`[data-id="${siteId}"]`);
        const site = this.sites.find((s) => s.id === siteId);
        if (!card || !site) return;

        this.setCardEditing(card, site, true);
        this.selectSiteName(card);
    }

    /**
     * Save changes to a site card.
     * @param {string} siteId - The ID of the site to save.
     */
    saveEdit(siteId) {
        const card = document.querySelector(`[data-id="${siteId}"]`);
        if (!card) return;

        const nameInput = card.querySelector(".site-name");
        const urlInput = card.querySelector(".site-url");

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        if (!name || !url) {
            alert("Please fill in both name and URL fields.");
            return;
        }

        // Validate URL
        if (!URL.canParse(url)) {
            alert("Please enter a valid URL (e.g., https://example.com)");
            return;
        }

        // Update site
        const siteIndex = this.sites.findIndex((s) => s.id === siteId);
        if (siteIndex !== -1) {
            this.sites[siteIndex].name = name;
            this.sites[siteIndex].url = url;
            // Icon is updated separately via click handler
        }

        this.saveSites();

        // Update card
        card.href = url;
        this.setCardEditing(card, this.sites[siteIndex], false);
    }

    /**
     * Cancel editing and revert to non-editing state.
     * @param {HTMLElement} card - The site card element.
     */
    cancelEdit(card) {
        const site = this.sites.find((s) => s.id === card.dataset.id);
        if (site) {
            // Revert to non-editing state
            this.setCardEditing(card, site, false);
        }
    }

    /**
     * Clear delete confirmation state.
     * @param {HTMLElement} card - The site card element.
     */
    clearDeleteConfirmation(card) {
        const deleteBtn = card.querySelector(".delete-btn");
        deleteBtn.classList.remove("delete-confirm");
        deleteBtn.setAttribute("title", "Delete");
    }

    /**
     * Delete a site after confirmation.
     * @param {string} id - The ID of the site to delete.
     */
    deleteSite(id) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.remove();
        }

        const index = this.sites.findIndex((site) => site.id === id);
        this.sites.splice(index, 1);
        this.saveSites();
    }

    /** Render all sites in the container. */
    renderSites() {
        this.container.innerHTML = "";
        this.sites.forEach((site) => {
            const card = this.createSiteCard(site);
            this.container.appendChild(card);
        });
    }

    /**
     * Create a site card element with all event listeners.
     * @param {Object} site - The site data object.
     * @param {string} site.id - The unique site ID.
     * @param {string} site.name - The site name.
     * @param {string} site.url - The site URL.
     * @param {string} site.icon - The site icon (emoji or URL).
     * @returns {HTMLAnchorElement} The created site card element.
     */
    createSiteCard(site) {
        const card = document.createElement("a");
        card.href = site.url;
        card.className = "site-card";
        card.draggable = false;
        card.rel = "noopener noreferrer";
        card.addEventListener("click", (e) => {
            const isEditing = card.classList.contains("editing");
            if (isEditing) {
                e.preventDefault();
            }
        });
        card.addEventListener("keydown", (e) => {
            const isEditing = card.classList.contains("editing");
            this.clearDeleteConfirmation(card);
            if (isEditing) {
                if (e.key === "Escape") {
                    e.preventDefault();
                    this.cancelEdit(card);
                } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.saveEdit(site.id);
                }
            }
        });
        card.dataset.id = site.id;

        // Drag handle
        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML = "⋮⋮";
        dragHandle.setAttribute("title", "Drag to reorder");
        dragHandle.draggable = true;

        // Only allow dragging from the handle
        dragHandle.addEventListener("dragstart", (e) => {
            this.handleDragStart(e);
        });
        dragHandle.addEventListener("dragend", (e) => {
            this.handleDragEnd(e);
        });
        dragHandle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        // Icon element
        const iconElement = document.createElement("div");
        iconElement.className = "site-icon";
        if (URL.canParse(site.icon)) {
            const img = document.createElement("img");
            img.src = site.icon;
            img.alt = site.name;
            iconElement.appendChild(img);
        } else {
            iconElement.textContent = site.icon;
        }

        // Click to edit icon in edit mode
        iconElement.addEventListener("click", (e) => {
            const isEditing = card.classList.contains("editing");
            if (isEditing) {
                e.preventDefault();
                e.stopPropagation();
                const newIcon = prompt("Enter emoji or image URL:", site.icon);
                if (newIcon !== null) {
                    // Update site data
                    const siteIndex = this.sites.findIndex(
                        (s) => s.id === site.id,
                    );
                    if (siteIndex !== -1) {
                        this.sites[siteIndex].icon = newIcon.trim();
                        this.saveSites();
                    }

                    // Update icon display
                    iconElement.innerHTML = "";
                    if (URL.canParse(newIcon)) {
                        const img = document.createElement("img");
                        img.src = newIcon;
                        img.alt = site.name;
                        iconElement.appendChild(img);
                    } else {
                        iconElement.textContent = newIcon;
                    }
                }
            }
        });

        const nameInput = document.createElement("input");
        nameInput.className = "site-name";
        nameInput.type = "text";
        nameInput.value = site.name;
        nameInput.readOnly = true;

        const urlInput = document.createElement("input");
        urlInput.className = "site-url";
        urlInput.value = this.formatUrl(site.url);
        urlInput.readOnly = true;
        urlInput.type = "text";

        // Site info container (name + url)
        const siteInfo = document.createElement("div");
        siteInfo.className = "site-info";
        siteInfo.appendChild(nameInput);
        siteInfo.appendChild(urlInput);

        // Card actions container
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "card-actions";

        // Edit/Save button
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = "✎";
        editBtn.setAttribute("title", "Edit");
        editBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (card.classList.contains("editing")) {
                this.saveEdit(site.id);
            } else {
                this.startEditing(site.id);
            }
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "🗑";
        deleteBtn.setAttribute("title", "Delete");
        deleteBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const deleteConfirm =
                deleteBtn.classList.contains("delete-confirm");
            if (deleteConfirm) {
                this.deleteSite(site.id);
            } else {
                deleteBtn.classList.add("delete-confirm");
                deleteBtn.setAttribute(
                    "title",
                    "Click again to confirm deletion",
                );
            }
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Drag and drop event listeners (on card, not handle)
        card.addEventListener("dragover", (e) => this.handleDragOver(e));
        card.addEventListener("drop", (e) => this.handleDrop(e));
        card.addEventListener("dragenter", (e) => this.handleDragEnter(e));
        card.addEventListener("dragleave", (e) => this.handleDragLeave(e));

        card.appendChild(dragHandle);
        card.appendChild(actionsDiv);
        card.appendChild(iconElement);
        card.appendChild(siteInfo);

        return card;
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

    /**
     * Handle drag start event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragStart(e) {
        // Find the parent card element
        const card = e.target.closest(".site-card");
        if (card) {
            this.draggedElement = card;
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/html", card.innerHTML);
        }
    }

    /**
     * Handle drag end event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragEnd(e) {
        // Remove dragging class from the dragged element
        if (this.draggedElement) {
            this.draggedElement.classList.remove("dragging");
            this.draggedElement = null;
        }
        // Remove drag-over class from all cards
        document.querySelectorAll(".site-card").forEach((card) => {
            card.classList.remove("drag-over");
        });
    }

    /**
     * Handle drag over event.
     * @param {DragEvent} e - The drag event.
     * @returns {boolean} False to allow drop.
     */
    handleDragOver(e) {
        e.dataTransfer.dropEffect = "move";
        e.preventDefault();
        return false;
    }

    /**
     * Handle drag enter event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add("drag-over");
        }
    }

    /**
     * Handle drag leave event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragLeave(e) {
        // Only remove drag-over if we're actually leaving the card, not just entering a child
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove("drag-over");
        }
    }

    /**
     * Handle drop event and reorder sites.
     * @param {DragEvent} e - The drag event.
     * @returns {boolean} False to prevent default behavior.
     */
    handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();

        const targetCard = e.currentTarget;
        const draggedCard = this.draggedElement;
        if (draggedCard && draggedCard !== targetCard) {
            const draggedIndex = this.sites.findIndex(
                (site) => site.id === draggedCard.dataset.id,
            );
            const targetIndex = this.sites.findIndex(
                (site) => site.id === targetCard.dataset.id,
            );

            // Insert dragged card before dropOnCard (pushing others to the right)
            targetCard.before(draggedCard);

            // Reorder the sites array to match DOM\
            const [movedSite] = this.sites.splice(draggedIndex, 1);
            const newTargetIndex =
                draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            this.sites.splice(newTargetIndex, 0, movedSite);
            this.saveSites();
        }

        targetCard.classList.remove("drag-over");
        return false;
    }

    /**
     * Import sites from a JSON file (appends to existing sites).
     * @param {Array} jsonData - The array of site objects to import.
     * @returns {number} The number of successfully imported sites.
     */
    importSites(jsonData) {
        // Validate and append sites
        let importedCount = 0;
        let id = Date.now();
        for (const site of jsonData) {
            if (site.name && site.url && site.icon) {
                site.id = (id++).toString();
                this.sites.push(site);
                importedCount++;
            } else {
                console.warn("Skipping invalid site:", site);
            }
        }

        if (importedCount > 0) {
            this.saveSites();
            this.renderSites();
        }
        return importedCount;
    }

    /**
     * Export sites to a JSON file.
     * @returns {number} The number of exported sites.
     */
    exportSites() {
        if (this.sites.length === 0) {
            return 0;
        }

        const dataStr = JSON.stringify(
            this.sites.map(
                (site) => ({ name: site.name, url: site.url, icon: site.icon }), // remove id for export
            ),
            null,
            2,
        );
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `nano-start-sites-${new Date().toISOString().split("T")[0]}.json`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return this.sites.length;
    }
}
export { SiteManager };
