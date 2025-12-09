// SearchManager: Handles search input, filtering sites, and keyboard navigation

class SearchManager {
    constructor(inputElement, resultsElement, siteManager) {
        this.input = inputElement;
        this.resultsContainer = resultsElement;
        this.getSites = () => siteManager.sites; // Function to get current sites array
        this.highlightedIndex = 0;
        this.results = [];
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
                this.clear();
            }
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    handleSearch(query) {
        query = query.trim();

        if (!query) {
            this.hideResults();
            this.dispatchSearchEvent('');
            return;
        }

        this.results = this.filterSites(query);
        this.renderResults(query);
        this.dispatchSearchEvent(query);
    }

    filterSites(query) {
        const sites = this.getSites();
        const lowerQuery = query.toLowerCase();

        return sites.filter(site =>
            site.name.toLowerCase().includes(lowerQuery) ||
            site.url.toLowerCase().includes(lowerQuery)
        );
    }

    renderResults(query) {
        this.resultsContainer.innerHTML = '';
        this.highlightedIndex = 0;

        // Google search option (always first)
        const googleItem = this.createResultItem({
            name: `Search Google for "${query}"`,
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            icon: '🔍',
            isGoogle: true
        }, 0);
        this.resultsContainer.appendChild(googleItem);

        // Filtered sites
        this.results.forEach((site, index) => {
            const item = this.createResultItem(site, index + 1);
            this.resultsContainer.appendChild(item);
        });

        this.resultsContainer.hidden = false;
        this.updateHighlight();
    }

    createResultItem(data, index) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.index = index;

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.className = 'result-icon';

        if (data.isGoogle || !data.icon) {
            iconDiv.textContent = data.icon || data.isGoogle ? '🔍' : '🌐';
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
        urlDiv.textContent = data.isGoogle ? 'Google Search' : this.formatUrl(data.url);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(urlDiv);

        item.appendChild(iconDiv);
        item.appendChild(infoDiv);

        // Click handler
        item.addEventListener('click', () => {
            this.openResult(data.url);
        });

        // Hover handler
        item.addEventListener('mouseenter', () => {
            this.highlightedIndex = index;
            this.updateHighlight();
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
        if (this.results.length === 0 && this.resultsContainer.hidden) return;

        const maxIndex = this.results.length; // +1 for Google, but 0-indexed
        this.highlightedIndex = (this.highlightedIndex + 1) % (maxIndex + 1);
        this.updateHighlight();
    }

    highlightPrevious() {
        if (this.results.length === 0 && this.resultsContainer.hidden) return;

        const maxIndex = this.results.length;
        this.highlightedIndex = (this.highlightedIndex - 1 + maxIndex + 1) % (maxIndex + 1);
        this.updateHighlight();
    }

    updateHighlight() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        items.forEach((item, index) => {
            if (index === this.highlightedIndex) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }

    openHighlighted() {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        const highlightedItem = items[this.highlightedIndex];

        if (highlightedItem) {
            if (this.highlightedIndex === 0) {
                // Google search
                const query = this.input.value.trim();
                this.openResult(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
            } else {
                // Site result
                const site = this.results[this.highlightedIndex - 1];
                if (site) {
                    this.openResult(site.url);
                }
            }
        }
    }

    openResult(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        this.clear();
    }

    hideResults() {
        this.resultsContainer.hidden = true;
    }

    clear() {
        this.input.value = '';
        this.hideResults();
        this.dispatchSearchEvent('');
    }

    dispatchSearchEvent(query) {
        // Dispatch custom event so SiteManager can hide/show cards
        const event = new CustomEvent('search', { detail: { query } });
        document.dispatchEvent(event);
    }
}

export { SearchManager };
