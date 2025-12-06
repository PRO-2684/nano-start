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
        const form = document.getElementById('add-site-form');
        const nameInput = document.getElementById('site-name');
        const urlInput = document.getElementById('site-url');

        addBtn.addEventListener('click', () => {
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                nameInput.focus();
            }
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            this.clearForm();
        });

        saveBtn.addEventListener('click', () => {
            this.addSite();
        });

        // Handle Enter key in form
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                urlInput.focus();
            }
        });

        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addSite();
            }
        });
    }

    // Clear form inputs
    clearForm() {
        document.getElementById('site-name').value = '';
        document.getElementById('site-url').value = '';
    }

    // Add a new site
    addSite() {
        const nameInput = document.getElementById('site-name');
        const urlInput = document.getElementById('site-url');
        
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

        const site = {
            id: Date.now().toString(),
            name,
            url
        };

        this.sites.push(site);
        this.saveSites();
        this.renderSites();
        this.clearForm();
        document.getElementById('add-site-form').classList.add('hidden');
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

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Delete site');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteSite(site.id);
        });

        // Drag and drop event listeners
        card.addEventListener('dragstart', (e) => this.handleDragStart(e));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('drop', (e) => this.handleDrop(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        card.appendChild(deleteBtn);
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
