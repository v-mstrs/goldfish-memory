# Goldfish Memory

A browser extension for web novel readers that highlights character names and shows tooltips with their info. Useful for tracking massive casts in long stories without needing a separate wiki.

Built with **[WXT](https://github.com/wxt-dev/wxt)**, **Node** and **TS** using [dixie](https://github.com/dexie/Dexie.js)

## Features

- **Highlighting**: Scans the page for stored character names and aliases.
- **Tooltips**: Shows character descriptions and images on hover.
- **Context Menu**: Add characters by selecting text and right-clicking.
- **Auto-Backups**: Saves your database as JSON to your Downloads folder (Daily/Weekly).
- **Dark UI**: Simple dark-themed popup and character creation modals.
- **JSON Import/Export**: Manual data migration support.

## Setup

### Requirements
- **Node.js**: v18+
- **npm**: v9+

### Installation
1. Clone the repo.
2. Install dependencies:
```bash
npm install
```

### Development
```bash
# Chrome (Default)
npm run dev

# Firefox (MV3)
npm run dev:firefox
```

### Build
```bash
# Chrome (MV3)
npm run build

# Firefox (MV3)
npm run build:firefox
```

## Loading the Extension

1. **Chrome / Edge**: 
   - Go to `chrome://extensions`.
   - Toggle **Developer mode**.
   - **Load unpacked** from `.output/chrome-mv3`.
2. **Firefox**:
   - Go to `about:debugging#/runtime/this-firefox`.
   - **Load Temporary Add-on...**.
   - Select `manifest.json` from `.output/firefox-mv3`.

## Supported Sites
- `wetriedtls.com`
- `revengernovel.com`
- `fenrirealm.com`
- `mavintranslations.com`
- `wuxiaworld.com`

*Add more in `src/sites.ts`.*

## Showcase

https://github.com/user-attachments/assets/3ede00bd-ad2d-40b8-92b3-bd6bd8a5f619
