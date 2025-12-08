// Site manager: Manages the list of sites, adding, editing, deleting, and rendering them

class SiteManager {
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

    // Helper: Check if icon is URL or text/emoji
    isIconUrl(icon) {
        if (!icon) return false;
        return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:');
    }

    // Helper: Enable/disable inputs for editing
    setCardEditing(card, site, enable) {
        card.classList.toggle('editing', enable);

        const nameInput = card.querySelector('.site-name');
        const urlInput = card.querySelector('.site-url');

        nameInput.readOnly = !enable;
        urlInput.readOnly = !enable;
        urlInput.value = enable ? site.url : this.formatUrl(site.url);
        urlInput.type = enable ? 'url' : 'text';

        // Update button
        const editBtn = card.querySelector('.edit-btn');
        if (enable) {
            editBtn.innerHTML = '✓';
            editBtn.setAttribute('title', 'Save');
        } else {
            editBtn.innerHTML = '✎';
            editBtn.setAttribute('title', 'Edit');
        }
    }

    // Add a new site with default values and start editing
    addNewSite() {
        const site = {
            id: Date.now().toString(),
            name: 'New Site',
            url: 'https://example.org/',
            icon: '🌐'
        };
        this.sites.push(site);
        this.saveSites();

        // Append the new card
        const card = this.createSiteCard(site);
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
        const card = document.querySelector(`[data-id="${siteId}"]`);
        if (!card) return;

        const nameInput = card.querySelector('.site-name');
        const urlInput = card.querySelector('.site-url');

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
            // Icon is updated separately via click handler
        }

        this.saveSites();

        // Update card
        card.href = url;
        this.setCardEditing(card, this.sites[siteIndex], false);
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
        }
    }

    // Render all sites
    renderSites() {
        this.container.innerHTML = '';
        this.sites.forEach((site) => {
            const card = this.createSiteCard(site);
            this.container.appendChild(card);
        });
    }

    // Create a site card element
    createSiteCard(site) {
        const card = document.createElement('a');
        card.href = site.url;
        card.className = 'site-card';
        card.draggable = false;
        card.addEventListener('click', (e) => {
            const isEditing = card.classList.contains('editing');
            if (isEditing) {
                e.preventDefault();
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

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.setAttribute('title', 'Drag to reorder');
        dragHandle.draggable = true;

        // Only allow dragging from the handle
        dragHandle.addEventListener('dragstart', (e) => {
            this.handleDragStart(e);
        });
        dragHandle.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });
        dragHandle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        // Icon element
        const iconElement = document.createElement('div');
        iconElement.className = 'site-icon';
        const icon = site.icon || '🌐';
        if (this.isIconUrl(icon)) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = site.name;
            iconElement.appendChild(img);
        } else {
            iconElement.textContent = icon;
        }

        // Click to edit icon in edit mode
        iconElement.addEventListener('click', (e) => {
            const isEditing = card.classList.contains('editing');
            if (isEditing) {
                e.preventDefault();
                e.stopPropagation();
                const newIcon = prompt('Enter emoji or image URL:', icon);
                if (newIcon !== null) {
                    // Update site data
                    const siteIndex = this.sites.findIndex(s => s.id === site.id);
                    if (siteIndex !== -1) {
                        this.sites[siteIndex].icon = newIcon.trim();
                        this.saveSites();
                    }

                    // Update icon display
                    iconElement.innerHTML = '';
                    if (this.isIconUrl(newIcon)) {
                        const img = document.createElement('img');
                        img.src = newIcon;
                        img.alt = site.name;
                        iconElement.appendChild(img);
                    } else {
                        iconElement.textContent = newIcon;
                    }
                }
            }
        });

        const nameInput = document.createElement('input');
        nameInput.className = 'site-name';
        nameInput.type = 'text';
        nameInput.value = site.name;
        nameInput.readonly = true;

        const urlInput = document.createElement('input');
        urlInput.className = 'site-url';
        urlInput.value = this.formatUrl(site.url);
        urlInput.readonly = true;
        urlInput.type = 'text';

        // Card actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'card-actions';

        // Edit/Save button
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✎';
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
        card.appendChild(iconElement);
        card.appendChild(nameInput);
        card.appendChild(urlInput);

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
        e.dataTransfer.dropEffect = 'move';
        e.preventDefault();
        return false;
    }

    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        // Only remove drag-over if we're actually leaving the card, not just entering a child
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();

        const targetCard = e.currentTarget;
        const draggedCard = this.draggedElement;
        if (draggedCard && draggedCard !== targetCard) {
            const draggedIndex = this.sites.findIndex(site => site.id === draggedCard.dataset.id);
            const targetIndex = this.sites.findIndex(site => site.id === targetCard.dataset.id);

            // Insert dragged card before dropOnCard (pushing others to the right)
            targetCard.before(draggedCard);

            // Reorder the sites array to match DOM\
            const [movedSite] = this.sites.splice(draggedIndex, 1);
            const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            this.sites.splice(newTargetIndex, 0, movedSite);
            this.saveSites();
        }

        targetCard.classList.remove('drag-over');
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
export { SiteManager };
