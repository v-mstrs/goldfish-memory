export const SITES = [
    {
        hostname: "wetriedtls.com",
        contentSelector: "#reader-container"
    },
    {
        hostname: "revengernovel.com",
        contentSelector: "#chapterContent"
    },
    {
        hostname: "fenrirealm.com",
        contentSelector: ".content-area"
    },
    {
        hostname: "mavintranslations.com",
        contentSelector: "body"
    },
    {
        hostname: "wuxiaworld.com",
        contentSelector: "div.chapter-content"
    },
    {
        hostname: "utoon.net",
        contentSelector: "div.reading-content"
    },
    {
        hostname: "freewebnovel.com",
        contentSelector: "div.txt"
    },
    {
        hostname: "skydemonorder.com",
        contentSelector: "div#chapter-body"
    }

] as const;

export type SiteConfig = (typeof SITES)[number];

const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase();

export const API_HOST_PERMISSIONS = [
    'http://127.0.0.1/*',
    'http://localhost/*',
    'http://*.local/*'
] as const;

export const SITE_HOST_PERMISSIONS = SITES.map(
    (site) => `*://*.${normalizeHostname(site.hostname)}/*`
);

export const MATCH_PATTERNS = SITE_HOST_PERMISSIONS;

export const getActiveConfig = () => {
    const currentHostname = normalizeHostname(window.location.hostname);
    return SITES.find((site) => {
        const configuredHostname = normalizeHostname(site.hostname);
        return currentHostname === configuredHostname || currentHostname.endsWith(`.${configuredHostname}`);
    });
};
