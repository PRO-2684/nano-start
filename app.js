// nano-start - Browser start page with vanilla JavaScript
'use strict';

class NanoStart {
    constructor(container) {
        this.container = container;
        this.sites = [];
        this.draggedElement = null;
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
    selectSiteName(card) {
        const siteName = card?.querySelector?.('.site-name');
        if (!siteName) return;
        siteName.focus();
        siteName.select();
    }

    // Helper: Enable/disable inputs for editing
    setCardEditing(card, site, enable) {
        card.classList.toggle('editing', enable);

        const nameInput = card.querySelector('.site-name');
        const urlInput = card.querySelector('.site-url');

        nameInput.readOnly = !enable;
        urlInput.readOnly = !enable;
        urlInput.value = enable ? site.url : this.formatUrl(site.url);

        // Update button
        const editBtn = card.querySelector('.edit-btn');
        if (enable) {
            editBtn.innerHTML = '✓';
            editBtn.setAttribute('aria-label', `Save ${site.name}`);
            editBtn.setAttribute('title', 'Save');
        } else {
            editBtn.innerHTML = '✎';
            editBtn.setAttribute('aria-label', `Edit ${site.name}`);
            editBtn.setAttribute('title', 'Edit');
        }
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

        // Append the new card
        const card = this.createSiteCard(site, this.sites.length - 1);
        this.container.appendChild(card);
        this.setCardEditing(card, site, true);
        this.selectSiteName(card);
    }

    // Start editing a card
    startEditing(siteId) {
        const card = document.querySelector(`[data-id="${siteId}"]`);
        const site = this.sites.find(s => s.id === siteId);
        if (!card || !site) return;

        this.setCardEditing(card, site, true);
        this.selectSiteName(card);
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
        if (!URL.canParse(url)) {
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

        // Update card to non-editing state
        this.setCardEditing(oldCard, this.sites[siteIndex], false);
    }

    // Cancel editing
    cancelEdit(card) {
        const site = this.sites.find(s => s.id === card.dataset.id);
        if (site) {
            // Revert to non-editing state
            this.setCardEditing(card, site, false);
        }
    }

    // Delete a site
    deleteSite(id) {
        if (confirm('Are you sure you want to delete this site?')) {
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.remove();
            }

            const index = this.sites.findIndex(site => site.id === id);
            this.sites.splice(index, 1);
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
        const card = document.createElement('div');
        card.className = 'site-card';
        card.addEventListener('click', (e) => {
            const isEditing = card.classList.contains('editing');
            if (!isEditing) {
                // Don't navigate if clicking on buttons or drag handle
                if (!e.target.closest('button') && !e.target.closest('.drag-handle')) {
                    window.open(site.url, '_blank', 'noopener,noreferrer');
                }
            }
        });
        card.addEventListener('keydown', (e) => {
            const isEditing = card.classList.contains('editing');
            if (isEditing) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit(card);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveEdit(site.id);
                }
            }
        });
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

        const nameElement = document.createElement('input');
        nameElement.className = 'site-name';
        nameElement.type = 'text';
        nameElement.value = site.name;
        nameElement.toggleAttribute("readonly", true);

        const urlElement = document.createElement('input');
        urlElement.className = 'site-url';
        urlElement.type = 'url';
        urlElement.value = this.formatUrl(site.url);
        urlElement.toggleAttribute("readonly", true);

        // Card actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        // Edit/Save button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✎';
        editBtn.setAttribute('aria-label', `Edit ${site.name}`);
        editBtn.setAttribute('title', 'Edit');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (card.classList.contains('editing')) {
                this.saveEdit(site.id);
            } else {
                this.startEditing(site.id);
            }
        });

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
        e.stopPropagation();
        e.preventDefault();

        const dropOnCard = e.currentTarget;
        const draggedCard = this.draggedElement;
        if (draggedCard && draggedCard !== dropOnCard) {
            const draggedIndex = parseInt(draggedCard.dataset.index);
            const targetIndex = parseInt(dropOnCard.dataset.index);

            // Reorder the sites array
            const [removed] = this.sites.splice(draggedIndex, 1);
            this.sites.splice(targetIndex, 0, removed);
            this.saveSites();

            // Insert dragged card before dropOnCard (pushing others to the right)
            dropOnCard.before(draggedCard);
        }

        dropOnCard.classList.remove('drag-over');
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
