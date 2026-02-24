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
    }

] as const;

const normalizeHostname = (hostname: string) => hostname.trim().toLowerCase();

export const MATCH_PATTERNS = SITES.map((s) => `*://*.${normalizeHostname(s.hostname)}/*`);

export const getActiveConfig = () =>
    SITES.find((s) => window.location.hostname.includes(normalizeHostname(s.hostname)));
