import { defineConfig } from 'wxt';

export default defineConfig({
    srcDir: 'src',
    manifest: {
        name: 'Goldfish Memory',
        version: '1.0.0',
        icons: {
            48: 'goldfish-white.png',
            128: 'goldfish-white.png',
        },
        description: 'A browser extension that helps you remember characters in web novels.',
        permissions: [
            'storage',
            'contextMenus'
        ],
        host_permissions: [
            'http://127.0.0.1/*',
            'http://localhost/*',
            '*://*.wetriedtls.com/*',
            '*://*.revengernovel.com/*',
            '*://*.fenrirealm.com/*',
            '*://*.mavintranslations.com/*',
            '*://*.wuxiaworld.com/*',
            '*://*.utoon.net/*'
        ],
        action: {
            default_title: 'Goldfish Memory',
            default_popup: 'popup.html'
        }
    },
});
