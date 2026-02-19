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
            'alarms',
            'contextMenus',
            'downloads'
        ],
        host_permissions: [
            '*://*.wetriedtls.com/*',
            '*://*.revengernovel.com/*',
            '*://*.fenrirealm.com/*',
            '*://*.mavintranslations.com/*',
            '*://*.wuxiaworld.com/*',
            'http://*/*',
            'https://*/*'
        ],
        action: {
            default_title: 'Goldfish Memory',
            default_popup: 'popup.html'
        }
    },
});
