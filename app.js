// nano-start - Browser start page with vanilla JavaScript
'use strict';

class NanoStart {
    constructor() {
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
        const saveBtn = document.getElementById('save-site-btn');
        const cancelBtn = document.getElementById('cancel-site-btn');
        const modal = document.getElementById('site-form-modal');
        const nameInput = document.getElementById('site-name');
        const urlInput = document.getElementById('site-url');

        addBtn.addEventListener('click', () => {
            this.openModal('add');
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });

        saveBtn.addEventListener('click', () => {
            this.saveSite();
        });

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Handle Enter key in form
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                urlInput.focus();
            }
        });

        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveSite();
            }
        });

        // Handle Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Open modal for add or edit
    openModal(mode, site = null) {
        const modal = document.getElementById('site-form-modal');
        const formTitle = document.getElementById('form-title');
        const nameInput = document.getElementById('site-name');
        const urlInput = document.getElementById('site-url');
        const siteIdInput = document.getElementById('site-id');

        if (mode === 'edit' && site) {
            formTitle.textContent = 'Edit Website';
            nameInput.value = site.name;
            urlInput.value = site.url;
            siteIdInput.value = site.id;
        } else {
            formTitle.textContent = 'Add Website';
            nameInput.value = '';
            urlInput.value = '';
            siteIdInput.value = '';
        }

        modal.classList.remove('hidden');
        nameInput.focus();
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('site-form-modal');
        modal.classList.add('hidden');
    }

    // Save site (add or update)
    saveSite() {
        const nameInput = document.getElementById('site-name');
        const urlInput = document.getElementById('site-url');
        const siteIdInput = document.getElementById('site-id');
        
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        const siteId = siteIdInput.value;

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

        if (siteId) {
            // Update existing site
            const siteIndex = this.sites.findIndex(s => s.id === siteId);
            if (siteIndex !== -1) {
                this.sites[siteIndex].name = name;
                this.sites[siteIndex].url = url;
            }
        } else {
            // Add new site
            const site = {
                id: Date.now().toString(),
                name,
                url
            };
            this.sites.push(site);
        }

        this.saveSites();
        this.renderSites();
        this.closeModal();
    }

    // Delete a site
    deleteSite(id) {
        if (confirm('Are you sure you want to delete this site?')) {
            this.sites = this.sites.filter(site => site.id !== id);
            this.saveSites();
            this.renderSites();
        }
    }

    // Render all sites
    renderSites() {
        const container = document.getElementById('sites-container');
        
        if (this.sites.length === 0) {
            container.innerHTML = '<div class="empty-state">No sites yet. Click the + button to add your first site!</div>';
            return;
        }

        container.innerHTML = '';
        
        this.sites.forEach((site, index) => {
            const card = this.createSiteCard(site, index);
            container.appendChild(card);
        });
    }

    // Create a site card element
    createSiteCard(site, index) {
        const card = document.createElement('a');
        card.className = 'site-card';
        card.href = site.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.draggable = true;
        card.dataset.id = site.id;
        card.dataset.index = index;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'site-name';
        nameDiv.textContent = site.name;

        const urlDiv = document.createElement('div');
        urlDiv.className = 'site-url';
        urlDiv.textContent = this.formatUrl(site.url);

        // Card actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✎';
        editBtn.setAttribute('aria-label', 'Edit site');
        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openModal('edit', site);
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Delete site');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteSite(site.id);
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Drag and drop event listeners
        card.addEventListener('dragstart', (e) => this.handleDragStart(e));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('drop', (e) => this.handleDrop(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        card.appendChild(actionsDiv);
        card.appendChild(nameDiv);
        card.appendChild(urlDiv);

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
        this.draggedElement = e.currentTarget;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NanoStart();
    });
} else {
    new NanoStart();
}
