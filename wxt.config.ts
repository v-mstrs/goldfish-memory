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
    publicDir: 'src/public',
    hooks: {
        'build:manifestGenerated': (wxt, manifest) => {
            if (wxt.config.browser !== 'firefox' || wxt.config.manifestVersion !== 3) return;

            const contentSecurityPolicy = manifest.content_security_policy;
            if (typeof contentSecurityPolicy === 'object' && contentSecurityPolicy !== null) {
                delete contentSecurityPolicy.sandbox;
            }
        },
    },
    manifest: {
        name: 'Goldfish Memory',
        version: '1.0.0',
        icons: {
            16: 'goldfish-icon.png',
            32: 'goldfish-icon.png',
            48: 'goldfish-icon.png',
            96: 'goldfish-icon.png',
            128: 'goldfish-icon.png',
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
                16: 'goldfish-icon.png',
                32: 'goldfish-icon.png',
                48: 'goldfish-icon.png',
                96: 'goldfish-icon.png',
            },
        }
    },
});
