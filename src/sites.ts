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
    }

] as const;

export const GENERIC_SITE = {
    hostname: "generic",
    contentSelector: "article, .chapter-content, #chapter-content, .reader-content, #reader-content, .entry-content, main"
};

const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase();

export const API_HOST_PERMISSIONS = [
    'http://127.0.0.1/*',
    'http://localhost/*',
    'http://*.local/*'
] as const;

export const SITE_HOST_PERMISSIONS = SITES.map(
    (site) => `*://*.${normalizeHostname(site.hostname)}/*`
);

// Add all URLs to match patterns so it works everywhere if permissions allow
export const MATCH_PATTERNS = ["<all_urls>"];

export const getActiveConfig = () => {
    const matched = SITES.find((s) => window.location.hostname.includes(normalizeHostname(s.hostname)));
    return matched || GENERIC_SITE;
};
