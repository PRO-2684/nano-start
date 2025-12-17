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

Configure your preferred default search engine for the search bar.

**Built-in Search Engines:**
- **Google** 🔍 - `https://www.google.com/search?q={query}`
- **DuckDuckGo** 🦆 - `https://duckduckgo.com/?q={query}`
- **Bing** 🔵 - `https://www.bing.com/search?q={query}`
- **Brave Search** 🦁 - `https://search.brave.com/search?q={query}`
- **Ecosia** 🌱 - `https://www.ecosia.org/search?q={query}`

**Custom Search Engines:**
1. Click **➕ Add Custom Search Engine**
2. Enter the search engine name (e.g., "My Search")
3. Enter the search URL with `{query}` as a placeholder
   - Example: `https://example.com/search?q={query}`
4. Enter an icon (emoji or text character)
5. The custom engine will appear in the list
6. Select the radio button to make it your default
7. Custom engines can be deleted by clicking the 🗑 button

**How it works:**
- When you type in the search bar, the last result will use your configured search engine
- Example: If DuckDuckGo is selected, you'll see "Search DuckDuckGo for 'your query'"

### 💾 Backup

Import and export your pinned sites for backup or transfer.

**Export Sites:**
- Click **📤 Export Sites**
- Downloads a JSON file named `nano-start-sites-YYYY-MM-DD.json`
- Contains all your pinned sites with their names, URLs, and icons

**Import Sites:**
- Click **📥 Import Sites**
- Select a previously exported JSON file
- Sites will be added to your existing collection (not replaced)
- Duplicate checking by URL to avoid importing the same site twice

### 🔧 Advanced

Advanced maintenance and troubleshooting options.

**Clear Icon Cache:**
- Click **🗑️ Clear Icon Cache**
- Confirms before clearing
- Clears all cached site icons from the service worker
- Useful when:
  - A website has updated its favicon
  - Icons are not loading correctly
  - You want to refresh icon data
- Icons will be re-downloaded when sites are next displayed

## Technical Details

### Data Storage

Settings are stored in the browser's `localStorage` under the key `nano-start-settings`.

**Settings Structure:**
```json
{
  "searchEngines": [
    {
      "id": "google",
      "name": "Google",
      "url": "https://www.google.com/search?q={query}",
      "icon": "🔍",
      "builtin": true
    },
    {
      "id": "custom-1234567890",
      "name": "My Search",
      "url": "https://example.com/search?q={query}",
      "icon": "🔎",
      "builtin": false
    }
  ],
  "defaultSearchEngine": "google"
}
```

### Search Engine URL Format

Search engine URLs must contain the `{query}` placeholder, which will be replaced with the user's search query (URL-encoded).

**Examples:**
- Google: `https://www.google.com/search?q={query}`
- DuckDuckGo: `https://duckduckgo.com/?q={query}`
- Wikipedia: `https://en.wikipedia.org/wiki/Special:Search?search={query}`
- Custom: `https://mysite.com/search?term={query}&lang=en`

### Component Architecture

**SettingsManager (`components/settings.js`):**
- Extends `EventTarget` for reactive updates
- Manages all settings-related functionality
- Uses native `<dialog>` API with `showModal()` and `close()` methods
- Renders search engine list
- Manages import/export/cache operations
- Emits `settingsUpdated` event when settings change

**Integration:**
- `SearchManager` uses `SettingsManager.getDefaultSearchEngine()` and `getSearchUrl(query)`
- Import/export operations delegate to `SiteManager`
- Cache clearing communicates with service worker

### Keyboard Shortcuts

- **Escape** - Close settings dialog (native browser behavior)
- **Tab** - Navigate between form elements
- **Enter** - Submit forms (when applicable)
- **Space** - Toggle radio buttons

## Styling

The settings dialog uses:
- Native `<dialog>` element with built-in modal behavior
- Native `::backdrop` pseudo-element for backdrop styling
- CSS transitions with `@starting-style` for smooth animations
- `transition-behavior: allow-discrete` for display/overlay transitions
- Backdrop blur effect using `backdrop-filter`
- Responsive grid layout for search engine items
- Mobile-optimized layout (stacked on small screens)

## Future Enhancements

Potential additions to settings:

- **Theme Section:**
  - Light/Dark/Auto mode selector
  - Custom color schemes
  - Background image support

- **Search Engine Enhancements:**
  - Multiple search engines in search results
  - Search engine shortcuts (e.g., `!g query` for Google)
  - Favicon fetching for custom engines

- **Site Display Options:**
  - Grid vs list view
  - Card size preferences
  - Sort order options

- **Privacy & Data:**
  - Clear all data option
  - Sync settings across devices (optional)
  - Export/import settings separately from sites

## Browser Compatibility

Settings feature requires:
- ES6 Modules support
- localStorage
- Native `<dialog>` element with `showModal()` API
- CSS nesting
- `::backdrop` pseudo-element
- `@starting-style` (optional, degrades gracefully)
- `transition-behavior: allow-discrete` (optional, degrades gracefully)
- Service Worker API (for cache clearing)

The `<dialog>` element provides:
- Native modal behavior with focus trapping
- Automatic Escape key handling
- Built-in accessibility features (ARIA roles)
- Top layer rendering (appears above all other content)

Tested on modern versions of Chrome, Firefox, Edge, and Safari.
