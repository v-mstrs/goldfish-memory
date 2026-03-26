import { defineConfig } from 'wxt';
import { API_HOST_PERMISSIONS, SITE_HOST_PERMISSIONS } from './src/sites';

const firefoxBrowserSettings = {
    gecko: {
        id: 'goldfish-memory@randomas.local',
        strict_min_version: '128.0',
        data_collection_permissions: {
            required: ['websiteContent'],
        },
    },
    gecko_android: {
        strict_min_version: '142.0',
    },
} as any;

export default defineConfig({
    srcDir: 'src',
    manifest: {
        name: 'Goldfish Memory',
        version: '1.0.0',
        icons: {
            48: '/goldfish-white.png',
            128: '/goldfish-white.png',
        },
        description: 'A browser extension that helps you remember characters in web novels.',
        permissions: [
            'storage',
            'contextMenus'
        ],
        host_permissions: [...API_HOST_PERMISSIONS, ...SITE_HOST_PERMISSIONS],
        content_security_policy: {
            extension_pages: "script-src 'self'; object-src 'self';"
        },
        browser_specific_settings: firefoxBrowserSettings,
        action: {
            default_title: 'Goldfish Memory',
            default_popup: 'popup.html',
            default_icon: {
                48: '/goldfish-white.png',
                128: '/goldfish-white.png',
            }
        }
    },
});
