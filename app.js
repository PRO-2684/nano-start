// nano-start - Browser start page with vanilla JavaScript
'use strict';

class NanoStart {
    constructor(container) {
        this.container = container;
        this.sites = [];
        this.draggedElement = null;
        this.editingCardId = null;
        this.init();
    }

    init() {
        this.loadSites();
        this.setupEventListeners();
        this.renderSites();
        this.registerServiceWorker();
    }

    // Load sites from localStorage
    loadSites() {
        try {
            const stored = localStorage.getItem('nano-start-sites');
            if (stored) {
                this.sites = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading sites from localStorage:', error);
            this.sites = [];
        }
    }

    // Save sites to localStorage
    saveSites() {
        try {
            localStorage.setItem('nano-start-sites', JSON.stringify(this.sites));
        } catch (error) {
            console.error('Error saving sites to localStorage:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const addBtn = document.getElementById('add-site-btn');

        addBtn.addEventListener('click', () => {
            this.addNewSite();
        });
    }

    // Helper: Focus and select the site name in the card
    SelectSiteName(card) {
        const siteName = card?.querySelector?.('.site-name');
        if (!siteName) return;
        siteName.focus();
        siteName.select();
    }

    // Helper: Replace a card with a new version
    replaceCard(siteId, siteIndex) {
        const oldCard = document.querySelector(`[data-id="${siteId}"]`);
        if (!oldCard) return null;

        const newCard = this.createSiteCard(this.sites[siteIndex], siteIndex);
        oldCard.replaceWith(newCard);
        return newCard;
    }

    // Add a new site with default values and start editing
    addNewSite() {
        const site = {
            id: Date.now().toString(),
            name: 'New Site',
            url: 'https://example.org/'
        };
        this.sites.push(site);
        this.saveSites();

        // Set editing mode
        this.editingCardId = site.id;

        // Append the new card
        const card = this.createSiteCard(site, this.sites.length - 1);
        this.container.appendChild(card);
        this.SelectSiteName(card);
    }

    // Start editing a card
    startEditing(siteId) {
        const siteIndex = this.sites.findIndex(s => s.id === siteId);
        if (siteIndex === -1) return;

        this.editingCardId = siteId;
        const newCard = this.replaceCard(siteId, siteIndex);
        this.SelectSiteName(newCard);
    }

    // Save edited card
    saveEdit(siteId) {
        const oldCard = document.querySelector(`[data-id="${siteId}"]`);
        if (!oldCard) return;

        const nameInput = oldCard.querySelector('.site-name');
        const urlInput = oldCard.querySelector('.site-url');

        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            alert('Please fill in both name and URL fields.');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch (error) {
            alert('Please enter a valid URL (e.g., https://example.com)');
            return;
        }

        // Update site
        const siteIndex = this.sites.findIndex(s => s.id === siteId);
        if (siteIndex !== -1) {
            this.sites[siteIndex].name = name;
            this.sites[siteIndex].url = url;
        }

        this.saveSites();
        this.editingCardId = null;

        // Replace only the edited card
        this.replaceCard(siteId, siteIndex);
    }

    // Cancel editing
    cancelEdit() {
        if (!this.editingCardId) return;

        const siteIndex = this.sites.findIndex(s => s.id === this.editingCardId);
        const siteId = this.editingCardId;
        this.editingCardId = null;

        if (siteIndex !== -1) {
            // Replace with non-editing version
            this.replaceCard(siteId, siteIndex);
        }
    }

    // Delete a site
    deleteSite(id) {
        if (confirm('Are you sure you want to delete this site?')) {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.remove();
            }

            this.sites = this.sites.filter(site => site.id !== id);
            this.saveSites();

            // Update data-index attributes for remaining cards
            const cards = this.container.querySelectorAll('.site-card');
            cards.forEach((card, index) => {
                card.dataset.index = index;
            });
        }
    }

    // Render all sites
    renderSites() {
        this.container.innerHTML = '';

        this.sites.forEach((site, index) => {
            const card = this.createSiteCard(site, index);
            this.container.appendChild(card);
        });
    }

    // Create a site card element
    createSiteCard(site, index) {
        const isEditing = this.editingCardId === site.id;

        const card = document.createElement('div');
        card.className = 'site-card';
        if (isEditing) {
            card.classList.add('editing');
            // Add keyboard shortcuts for editing
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveEdit(site.id);
                }
            });
        } else {
            // Only make it a link if not editing
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on buttons
                if (!e.target.closest('button') && !e.target.closest('.drag-handle')) {
                    window.open(site.url, '_blank', 'noopener,noreferrer');
                }
            });
        }
        card.dataset.id = site.id;
        card.dataset.index = index;

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.setAttribute('aria-label', 'Drag to reorder');
        dragHandle.setAttribute('title', 'Drag to reorder');
        dragHandle.draggable = true;

        // Only allow dragging from the handle
        dragHandle.addEventListener('dragstart', (e) => {
            card.draggable = true;
            this.handleDragStart(e);
        });

        dragHandle.addEventListener('dragend', (e) => {
            card.draggable = false;
            this.handleDragEnd(e);
        });

        const nameElement = document.createElement(isEditing ? 'input' : 'div');
        nameElement.className = 'site-name';
        if (isEditing) {
            nameElement.type = 'text';
            nameElement.value = site.name;
        } else {
            nameElement.textContent = site.name;
        }

        const urlElement = document.createElement(isEditing ? 'input' : 'div');
        urlElement.className = 'site-url';
        if (isEditing) {
            urlElement.type = 'url';
            urlElement.value = site.url;
        } else {
            urlElement.textContent = this.formatUrl(site.url);
        }

        // Card actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        // Edit/Save button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        if (isEditing) {
            editBtn.innerHTML = '✓';
            editBtn.setAttribute('aria-label', `Save ${site.name}`);
            editBtn.setAttribute('title', 'Save');
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveEdit(site.id);
            });
        } else {
            editBtn.innerHTML = '✎';
            editBtn.setAttribute('aria-label', `Edit ${site.name}`);
            editBtn.setAttribute('title', 'Edit');
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.startEditing(site.id);
            });
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑';
        deleteBtn.setAttribute('aria-label', `Delete ${site.name}`);
        deleteBtn.setAttribute('title', 'Delete');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteSite(site.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Drag and drop event listeners (on card, not handle)
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('drop', (e) => this.handleDrop(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        card.appendChild(dragHandle);
        card.appendChild(actionsDiv);
        card.appendChild(nameElement);
        card.appendChild(urlElement);

        return card;
    }

    // Format URL for display
    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return url;
        }
    }

    // Drag and drop handlers
    handleDragStart(e) {
        // Find the parent card element
        const card = e.target.closest('.site-card');
        if (card) {
            this.draggedElement = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.innerHTML);
        }
    }

    handleDragEnd(e) {
        // Remove dragging class from the dragged element
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        // Remove drag-over class from all cards
        document.querySelectorAll('.site-card').forEach(card => {
            card.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();

        const dropTarget = e.currentTarget;

        if (this.draggedElement && this.draggedElement !== dropTarget) {
            const draggedIndex = parseInt(this.draggedElement.dataset.index);
            const targetIndex = parseInt(dropTarget.dataset.index);

            // Reorder the sites array
            const [removed] = this.sites.splice(draggedIndex, 1);
            this.sites.splice(targetIndex, 0, removed);

            this.saveSites();
            this.renderSites();
        }

        dropTarget.classList.remove('drag-over');
        return false;
    }

    // Register service worker for offline support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }
}

// Initialize the app when DOM is ready
function initApp() {
    const container = document.getElementById('sites-container');
    new NanoStart(container);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
