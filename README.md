# nano-start

A minimal yet hackable browser start page.

## Features

- 🚀 **Vanilla JavaScript**: Pure JavaScript, HTML & CSS without bundlers or frameworks
- 📌 **Pin & Reorder**: Add your favorite websites and reorder them with drag & drop
- 💾 **localStorage**: All preferences are saved locally in your browser
- 🎨 **Adaptive Theme**: Automatic light and dark theme using cutting-edge CSS features
- 📱 **Offline First**: Service worker enables offline-first access
- ⚡ **Fast & Lightweight**: No dependencies, minimal footprint

## Usage

### Quick Start

1. Visit [Nano Start](https://nano-start.pages.dev/) in your browser
2. Set it as your browser's start page
3. You can also use extensions like [New Tab Redirect](https://chromewebstore.google.com/detail/new-tab-redirect/icpgjfneehieebagbmdbhnlpiopdcmna) to set it as your browser's new tab page

### Pinned Websites

#### Adding Sites

1. Click the **+** button
2. Edit the website name, URL and icon
    - Click on the icon to edit; You can provide text, emoji or urls
3. Click the **✓** button or press `Enter`

#### Editing Sites

1. Hover over the site card and press the **✎** button
2. Edit the website name, URL and icon
    - Click on the icon to edit; You can provide text, emoji or urls
3. Click the **✓** button or press `Enter`

#### Deleting Sites

1. Hover over the site card and press the **🗑** button
2. Press the **🗑** button again to confirm, or press `Esc` if you regretted

#### Ordering Sites

1. Hover over the site card and hold the **⋮⋮** button
2. Drag around and drop on your preferred location
3. The dragged site will be moved before the destination card

### Search Bar

- The search bar will be focused by default on page load
- You can type words to search pinned websites, or search Google using your query
- To navigate through the list, you can use `↑`, `↓`, `Home`, `End`
- To activate an item, you can click it, or press `Enter` if its highlighted
- You can press `Esc` to clear the input and quit search

### Other

You can see more options when hovering over the add button **+**:

- **🗑️**: Clears icon cache, useful if your pinned sites updated their favicons
- **📤**: Exports pinned sites as a JSON file
- **📥**: Imports pinned sites from a JSON file (appends to the list)

### Advanced Customization

TBD

## Browser Compatibility

Works on most modern browsers. Backwards compatibility is not guaranteed.

## License

See [LICENSE](LICENSE) file for details.
