# nano-start

A minimal yet hackable browser start page.

## Features

- 🚀 **Vanilla JavaScript**: Pure JavaScript, HTML & CSS without bundlers or frameworks
- 📌 **Pin & Reorder**: Add your favorite websites and reorder them with drag & drop
- 💾 **localStorage**: All preferences are saved locally in your browser
- 🎨 **Adaptive Theme**: Automatic light and dark theme using CSS `prefers-color-scheme`
- 📱 **Offline Support**: Service worker enables offline access
- ⚡ **Fast & Lightweight**: No dependencies, minimal footprint

## Usage

### Quick Start

1. Clone or download this repository
2. Open `index.html` in your browser
3. Set it as your browser's start page

### Adding Sites

1. Click the **+** button
2. Enter the website name and URL
3. Click **Add**

### Managing Sites

- **Reorder**: Drag and drop cards to reorder them
- **Delete**: Hover over a card and click the **×** button in the top-right corner
- **Visit**: Click on any card to open the website

## Browser Compatibility

Works on all modern browsers that support:

- CSS Custom Properties
- CSS `prefers-color-scheme`
- Service Workers
- localStorage
- Drag and Drop API

## Customization

The code is intentionally simple and hackable. You can easily customize:

- **Colors**: Edit CSS variables in `style.css`
- **Layout**: Modify the grid layout in `.sites-container`
- **Functionality**: Extend `app.js` with additional features

## License

See [LICENSE](LICENSE) file for details.
