# Settings Feature Documentation

## Overview

The settings feature provides a centralized location for users to configure their Nano Start experience. It's accessible through a gear icon (⚙️) in the bottom-right button group and displays using the native HTML `<dialog>` element as a modal overlay.

## User Interface

### Opening Settings

- Click the **⚙️** button in the bottom-right corner
- The settings modal will open with a semi-transparent overlay

### Closing Settings

- Click the **✕** button in the top-right of the modal
- Click outside the modal (on the overlay)
- Press the **Escape** key

## Settings Sections

### 🔍 Search Engine

Configure your preferred search engines for the search bar. Search engine URLs must contain the `{query}` placeholder, which will be replaced with the user's URL-encoded search query.

**Default Search Engines:**
- **Google**: `https://www.google.com/search?q={query}`
- **Bing**: `https://www.bing.com/search?q={query}`
- **DuckDuckGo**: `https://duckduckgo.com/?q={query}`

**Custom Search Engines:**
1. Click **➕ Add Custom Search Engine**
2. Enter the search engine name (e.g., "My Search")
3. Enter the search URL with `{query}` as a placeholder
   - Example: `https://example.com/search?q={query}`
4. Select an icon (emoji or URL to an image)
5. The custom engine will appear in the list
6. Order the engines by dragging them, and they will appear in that order in the search results
7. Search engines can be deleted by clicking the 🗑 button twice (once to show confirmation, once to delete)

### 💾 Backup

Import and export your pinned sites and search engine settings.

**Export Sites:**
- Click **📤 Export Sites**
- Downloads a JSON file named `nano-start-sites-YYYY-MM-DD.json`
- Contains all your pinned sites and search engines with their names, URLs, and icons

**Import Sites:**
- Click **📥 Import Sites**
- Select a previously exported JSON file
- Sites and engines will be added to your existing collection (not replaced)
- Duplicate checking by URL to avoid importing the same site twice

You can configure whether to include pinned sites, search engines, or both during export/import by checking/unchecking the respective checkboxes.

### 🔧 Advanced

Advanced maintenance and troubleshooting options.

- **Clear Icon Cache**: Clears all cached site icons from the service worker, which will be re-downloaded from network when needed. Useful when:
  - A website has updated its favicon
  - Icons are not loading correctly
  - You want to refresh icon data
