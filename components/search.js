// SearchManager: Handles search input, filtering sites, and keyboard navigation

class SearchManager {
    constructor(inputElement, resultsElement, siteManager) {
        this.input = inputElement;
        this.resultsContainer = resultsElement;
        this.siteManager = siteManager;
        this.highlightedIndex = 0;
        this.debounceTimer = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Input change with debounce
        this.input.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 150);
        });

        // Keyboard navigation
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.highlightNext();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.highlightPrevious();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.openHighlighted();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (this.input.value.trim() === '') {
                    // Blur input if empty
                    this.input.blur();
                } else {
                    // Otherwise clear input
                    this.clear();
                }
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });

        // Enter to focus input
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && document.activeElement !== this.input) {
                this.input.focus();
                e.preventDefault();
            }
        });
    }

    handleSearch(query) {
        query = query.trim();

        if (!query) {
            this.hideResults();
            return;
        }

        const results = this.filterSites(query);
        this.renderResults(query, results);
    }

    filterSites(query) {
        const sites = this.siteManager.sites;
        const lowerQuery = query.toLowerCase();

        return sites.filter(site =>
            site.name.toLowerCase().includes(lowerQuery) ||
            site.url.toLowerCase().includes(lowerQuery)
        );
    }

    renderResults(query, results) {
        this.resultsContainer.innerHTML = '';
        this.highlightedIndex = 0;

        // Google search option (always last)
        const googleResult = {
            name: `Search Google for "${query}"`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            icon: '🔍'
        };

        const allResults = [...results, googleResult];

        allResults.forEach((result, index) => {
            const item = this.createResultItem(result, index);
            this.resultsContainer.appendChild(item);
        });

        this.resultsContainer.hidden = false;
        this.updateHighlight();
    }

    createResultItem(data, index) {
        const item = document.createElement('a');
        item.className = 'search-result-item';
        item.href = data.url;
        item.rel = 'noopener noreferrer';
        item.dataset.index = index;

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'result-icon';

        if (!data.icon) {
            iconDiv.textContent = '🌐';
        } else if (this.isIconUrl(data.icon)) {
            const img = document.createElement('img');
            img.src = data.icon;
            img.alt = data.name;
            iconDiv.appendChild(img);
        } else {
            iconDiv.textContent = data.icon;
        }

        // Info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'result-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'result-name';
        nameDiv.textContent = data.name;

        const urlDiv = document.createElement('div');
        urlDiv.className = 'result-url';
        urlDiv.textContent = this.formatUrl(data.url);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(urlDiv);

        item.appendChild(iconDiv);
        item.appendChild(infoDiv);

        // Click handler to clear search
        item.addEventListener('click', () => {
            this.clear();
        });

        return item;
    }

    isIconUrl(icon) {
        if (!icon) return false;
        return URL.canParse(icon);
    }

    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return url;
        }
    }

    highlightNext() {
        if (this.resultsContainer.hidden) return;

        const itemCount = this.resultsContainer.childElementCount;
        this.highlightedIndex = (this.highlightedIndex + 1) % itemCount;
        this.updateHighlight();
    }

    highlightPrevious() {
        if (this.resultsContainer.hidden) return;

        const itemCount = this.resultsContainer.childElementCount;
        this.highlightedIndex = (this.highlightedIndex - 1 + itemCount) % itemCount;
        this.updateHighlight();
    }

    updateHighlight() {
        const items = this.resultsContainer.children;
        for (let i = 0; i < items.length; i++) {
            items[i].classList.toggle('highlighted', i === this.highlightedIndex);
        }
    }

    openHighlighted() {
        const items = this.resultsContainer.children;
        const highlightedItem = items[this.highlightedIndex];

        if (highlightedItem) {
            highlightedItem.click();
        }
    }

    hideResults() {
        this.resultsContainer.hidden = true;
    }

    clear() {
        this.input.value = '';
        this.hideResults();
    }
}

export { SearchManager };
