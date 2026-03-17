# Goldfish Memory

A browser extension for web novel readers that highlights character names and shows tooltips with their info. Useful for tracking massive casts in long stories without needing a separate wiki.

Built with **WXT**, **Node** and **TS**, configured to be used with small local backend api something https://github.com/v-mstrs/murim-rot/.

## Features

- **Highlighting**: Scans the page for stored character names and aliases.
- **Tooltips**: Shows character descriptions and images on hover.
- **Context Menu**: Add characters by selecting text and right-clicking.
- **Dark UI**: Simple dark-themed popup and character creation modals.
- **External API Mode**: Uses a backend service (for example, a local Raspberry Pi API).

## API Backend

This branch expects a backend API instead of local Dexie storage.

- Default base URL: `http://127.0.0.1:8000`
- API client location: `src/services/api.ts`
- Set a custom URL at runtime via the extension options page or storage key: `apiBaseUrl`

## Privacy

- Privacy policy: `PRIVACY.md`

Goldfish Memory stores local UI settings in extension storage and can send character data to a user-configured backend API. Selected page text is only sent when the user explicitly uses the add-character flow from selected text.

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
npm run dev:ff
```

### Build
```bash
# Chrome (MV3)
npm run build

# Firefox (MV3)
npm run build:ff
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
