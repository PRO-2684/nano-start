"use strict";

/**
 * Base class for managing card-based items with drag-drop, editing, and CRUD operations.
 * @abstract
 */
class CardManager extends EventTarget {
    /**
     * Create a new CardManager instance.
     * @param {HTMLElement} container - The container element for cards.
     * @param {string} storageKey - localStorage key for persisting data.
     */
    constructor(container, storageKey) {
        super();
        this.container = container;
        this.storageKey = storageKey;
        /**
         * Array of items.
         * @type {Array<{id: string, name: string, url: string, icon: string}>}
         */
        this.items = [];
        this.draggedElement = null;
    }

    /** Initialize the manager: load items, render cards. */
    init() {
        this.loadItems();
        this.renderItems();
    }

    /**
     * Load items from localStorage.
     * On first load (no stored data), uses getDefaultItems().
     */
    loadItems() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.items = JSON.parse(stored);
            } else {
                this.items = this.getDefaultItems();
            }
        } catch (error) {
            console.error("Error loading items from localStorage:", error);
            this.items = this.getDefaultItems();
        }
    }

    /**
     * Get default items for first load.
     * Override in subclasses to provide default items.
     * @returns {Array} Array of default items.
     */
    getDefaultItems() {
        return [];
    }

    /** Save items to localStorage and dispatch update event. */
    saveItems() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.error("Error saving items to localStorage:", error);
        }
        this.dispatchEvent(new Event("itemsUpdated"));
    }

    /**
     * Focus and select the item name input in the given card.
     * @param {HTMLElement} card - The card element.
     */
    selectItemName(card) {
        const itemName = card?.querySelector?.(".site-name");
        if (!itemName) return;
        itemName.focus();
        itemName.select();
    }

    /**
     * Enable or disable editing mode for a card.
     * @param {HTMLElement} card - The card element.
     * @param {Object} item - The item data object.
     * @param {string} item.name - The item name.
     * @param {string} item.url - The item URL.
     * @param {boolean} enable - Whether to enable editing mode.
     */
    setCardEditing(card, item, enable) {
        card.classList.toggle("editing", enable);

        const nameInput = card.querySelector(".site-name");
        const urlInput = card.querySelector(".site-url");

        nameInput.readOnly = !enable;
        nameInput.value = item.name;
        urlInput.readOnly = !enable;
        urlInput.value = enable ? item.url : this.formatUrl(item.url);
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

    /**
     * Get placeholder item template for new items.
     * Override in subclasses to provide item template.
     * @returns {Object} Template object (without id).
     */
    getPlaceholderItem() {
        throw new Error("Subclass must implement getPlaceholderItem()");
    }

    /**
     * Add a new item with default values and start editing.
     * Uses getPlaceholderItem() to get the template.
     */
    addNewItem() {
        const item = {
            id: Date.now().toString(),
            ...this.getPlaceholderItem(),
        };

        this.items.push(item);
        this.saveItems();

        // Append the new card directly
        const card = this.createCard(item);
        this.container.appendChild(card);
        this.setCardEditing(card, item, true);
        this.selectItemName(card);
    }

    /**
     * Start editing an item.
     * @param {string} itemId - The ID of the item to edit.
     */
    startEditing(itemId) {
        const card = this.container.querySelector(`[data-id="${itemId}"]`);
        const item = this.items.find((s) => s.id === itemId);
        if (!card || !item) return;

        this.setCardEditing(card, item, true);
        this.selectItemName(card);
    }

    /**
     * Save edited item data.
     * @param {string} itemId - The ID of the item to save.
     */
    saveEdit(itemId) {
        const card = this.container.querySelector(`[data-id="${itemId}"]`);

        const nameInput = card.querySelector(".site-name");
        const urlInput = card.querySelector(".site-url");

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert("Name and URL are required.");
            return;
        }

        // Validate URL if needed (can be overridden by subclass)
        if (!this.validateUrl(url)) {
            // Subclass validateUrl should handle error messages
            return;
        }

        const itemIndex = this.items.findIndex((s) => s.id === itemId);
        if (itemIndex === -1) return;

        this.items[itemIndex].name = name;
        this.items[itemIndex].url = url;

        this.saveItems();

        // Update the card in place
        const item = this.items[itemIndex];
        this.setCardEditing(card, item, false);

        // Update card href if it's a link (for SiteManager)
        if (card.href) {
            card.href = url;
        }
    }

    /**
     * Validate URL format.
     * Can be overridden by subclasses for specific validation.
     * @param {string} url - The URL to validate.
     * @returns {boolean} Whether the URL is valid.
     */
    validateUrl(url) {
        return URL.canParse(url);
    }

    /**
     * Cancel editing and revert to original data.
     * @param {string} itemId - The ID of the item.
     */
    cancelEdit(itemId) {
        const item = this.items.find((s) => s.id === itemId);
        if (!item) return;

        const card = this.container.querySelector(`[data-id="${itemId}"]`);
        this.setCardEditing(card, item, false);
    }

    /**
     * Clear delete confirmation state.
     * @param {HTMLElement} card - The card element.
     */
    clearDeleteConfirmation(card) {
        const deleteBtn = card.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.classList.remove("delete-confirm");
            deleteBtn.innerHTML = "🗑";
            deleteBtn.setAttribute("title", "Delete");
        }

        // Clear timeout if exists
        if (card.deleteTimeoutId) {
            clearTimeout(card.deleteTimeoutId);
            card.deleteTimeoutId = null;
        }
    }

    /**
     * Delete an item with confirmation.
     * @param {string} itemId - The ID of the item to delete.
     * @returns {boolean} Whether deletion is allowed.
     */
    deleteItem(itemId) {
        const card = this.container.querySelector(`[data-id="${itemId}"]`);
        if (!card) return false;

        // Remove from DOM first
        card.remove();

        // Remove from data
        const index = this.items.findIndex((s) => s.id === itemId);
        if (index === -1) return false;

        this.items.splice(index, 1);
        this.saveItems();
        return true;
    }

    /** Render all items as cards (only used on initial load). */
    renderItems() {
        this.container.innerHTML = "";
        this.items.forEach((item) => {
            const card = this.createCard(item);
            this.container.appendChild(card);
        });
    }

    /**
     * Create a card element with all event listeners.
     * @param {Object} item - The item data object.
     * @param {string} item.id - The unique item ID.
     * @param {string} item.name - The item name.
     * @param {string} item.url - The item URL.
     * @param {string} item.icon - The item icon (emoji or URL).
     * @returns {HTMLElement} The created card element.
     */
    createCard(item) {
        const card = this.createCardElement(item);
        card.className = "card-item";
        card.dataset.id = item.id;

        // Event listeners
        card.addEventListener("click", (e) => {
            if (card.classList.contains("editing")) {
                e.preventDefault();
            }
        });

        card.addEventListener("keydown", (e) => {
            const isEditing = card.classList.contains("editing");
            this.clearDeleteConfirmation(card);
            if (isEditing) {
                if (e.key === "Escape") {
                    e.preventDefault();
                    this.cancelEdit(item.id);
                } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.saveEdit(item.id);
                }
            }
        });

        // Drag handle
        const dragHandle = this.createDragHandle();
        card.appendChild(dragHandle);

        // Icon
        const iconElement = this.createIconElement(item, card);
        card.appendChild(iconElement);

        // Info section
        const infoSection = this.createInfoSection(item);
        card.appendChild(infoSection);

        // Actions
        const actionsDiv = this.createActionsDiv(item, card);
        card.appendChild(actionsDiv);

        // Drag and drop event listeners
        card.addEventListener("dragover", (e) => this.handleDragOver(e));
        card.addEventListener("drop", (e) => this.handleDrop(e));
        card.addEventListener("dragenter", (e) => this.handleDragEnter(e));
        card.addEventListener("dragleave", (e) => this.handleDragLeave(e));

        return card;
    }

    /**
     * Create the base card element.
     * Can be overridden by subclasses to customize element type.
     * @param {Object} item - The item data.
     * @returns {HTMLElement} The card element.
     */
    createCardElement(item) {
        const card = document.createElement("div");
        return card;
    }

    /**
     * Create drag handle element.
     * @returns {HTMLElement} The drag handle.
     */
    createDragHandle() {
        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.innerHTML = "⋮⋮";
        dragHandle.setAttribute("title", "Drag to reorder");
        dragHandle.draggable = true;

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

        return dragHandle;
    }

    /**
     * Create icon element.
     * @param {Object} item - The item data.
     * @param {HTMLElement} card - The parent card element.
     * @returns {HTMLElement} The icon element.
     */
    createIconElement(item, card) {
        const iconElement = document.createElement("div");
        iconElement.className = "site-icon";

        if (URL.canParse(item.icon)) {
            const img = document.createElement("img");
            img.src = item.icon;
            img.alt = item.name;
            iconElement.appendChild(img);
        } else {
            iconElement.textContent = item.icon;
        }

        // Click to edit icon in edit mode
        iconElement.addEventListener("click", (e) => {
            const isEditing = card.classList.contains("editing");
            if (isEditing) {
                e.preventDefault();
                e.stopPropagation();

                const newIcon = prompt("Enter icon (emoji or URL):", item.icon);
                if (newIcon) {
                    const itemIndex = this.items.findIndex(
                        (s) => s.id === item.id,
                    );
                    if (itemIndex !== -1) {
                        this.items[itemIndex].icon = newIcon;
                        this.saveItems();

                        // Update icon display
                        if (URL.canParse(newIcon)) {
                            iconElement.innerHTML = "";
                            const img = document.createElement("img");
                            img.src = newIcon;
                            img.alt = item.name;
                            iconElement.appendChild(img);
                        } else {
                            iconElement.innerHTML = newIcon;
                        }
                    }
                }
            }
        });

        return iconElement;
    }

    /**
     * Create info section with name and URL inputs.
     * @param {Object} item - The item data.
     * @returns {HTMLElement} The info section.
     */
    createInfoSection(item) {
        const siteInfo = document.createElement("div");
        siteInfo.className = "site-info";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "site-name";
        nameInput.value = item.name;
        nameInput.readOnly = true;

        const urlInput = document.createElement("input");
        urlInput.className = "site-url";
        urlInput.value = this.formatUrl(item.url);
        urlInput.readOnly = true;
        urlInput.type = "text";

        siteInfo.appendChild(nameInput);
        siteInfo.appendChild(urlInput);

        return siteInfo;
    }

    /**
     * Create actions div with edit and delete buttons.
     * @param {Object} item - The item data.
     * @param {HTMLElement} card - The parent card element.
     * @returns {HTMLElement} The actions div.
     */
    createActionsDiv(item, card) {
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "card-actions";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = "✎";
        editBtn.setAttribute("title", "Edit");
        editBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isEditing = card.classList.contains("editing");
            if (isEditing) {
                this.saveEdit(item.id);
            } else {
                this.startEditing(item.id);
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
            if (deleteBtn.classList.contains("delete-confirm")) {
                this.deleteItem(item.id);
            } else {
                deleteBtn.classList.add("delete-confirm");
                deleteBtn.setAttribute("title", "Click again to confirm");

                // Set timeout to auto-cancel delete confirmation after 3 seconds
                const timeoutId = setTimeout(() => {
                    this.clearDeleteConfirmation(card);
                }, 3000);
                card.deleteTimeoutId = timeoutId;
            }
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        return actionsDiv;
    }

    /**
     * Format URL for display.
     * @param {string} url - The full URL.
     * @returns {string} The formatted URL.
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
        const dragHandle = e.target;
        const card = dragHandle.closest(".card-item");
        if (!card) return;

        card.classList.add("dragging");
        this.draggedElement = card;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", card.innerHTML);
    }

    /**
     * Handle drag end event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragEnd(e) {
        const cards = this.container.querySelectorAll(".card-item");
        cards.forEach((card) => {
            card.classList.remove("dragging", "drag-over");
        });
        this.draggedElement = null;
    }

    /**
     * Handle drag over event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    /**
     * Handle drag enter event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragEnter(e) {
        const card = e.currentTarget;
        if (card !== this.draggedElement) {
            card.classList.add("drag-over");
        }
    }

    /**
     * Handle drag leave event.
     * @param {DragEvent} e - The drag event.
     */
    handleDragLeave(e) {
        const card = e.currentTarget;
        if (!card.contains(e.relatedTarget)) {
            card.classList.remove("drag-over");
        }
    }

    /**
     * Handle drop event.
     * @param {DragEvent} e - The drag event.
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetCard = e.currentTarget;
        const draggedCard = this.draggedElement;

        if (!targetCard || !draggedCard || targetCard === draggedCard) return;

        const draggedIndex = this.items.findIndex(
            (s) => s.id === draggedCard.dataset.id,
        );
        const targetIndex = this.items.findIndex(
            (s) => s.id === targetCard.dataset.id,
        );

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Move the DOM element directly
        targetCard.before(draggedCard);

        // Update the items array to match DOM order
        const movedItem = this.items.splice(draggedIndex, 1)[0];
        const newTargetIndex =
            draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        this.items.splice(newTargetIndex, 0, movedItem);

        this.saveItems();
        targetCard.classList.remove("drag-over");
    }

    /**
     * Export items to a JSON array object (without IDs).
     * @returns {Array} Array of items without IDs.
     */
    exportToJSON() {
        return this.items.map(({ name, url, icon }) => ({ name, url, icon }));
    }

    /**
     * Import items from JSON array object, appending to existing items.
     * @param {Array} itemsData - Array of item objects to import.
     * @returns {number} The number of items successfully imported.
     */
    importFromJSON(itemsData) {
        let importedCount = 0;
        let id = Date.now();

        itemsData.forEach((itemData) => {
            if (!itemData.name || !itemData.url) {
                return; // Skip invalid entries
            }

            // Check for duplicates by URL
            const exists = this.items.some((s) => s.url === itemData.url);
            if (exists) {
                return; // Skip duplicates
            }

            this.items.push({
                id: (id++).toString(),
                name: itemData.name,
                url: itemData.url,
                icon: itemData.icon || "🌐",
            });
            importedCount++;
        });

        if (importedCount > 0) {
            this.saveItems();
            this.renderItems();
        }

        return importedCount;
    }
}

export { CardManager };
