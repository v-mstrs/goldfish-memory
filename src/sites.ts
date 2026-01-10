export const SITES = [
  {
    hostname: 'wetriedtls.com',
    contentSelector: '#reader-container'
  },
  {
    hostname: 'revengernovel.com',
    contentSelector: '#chapterContent' // selectors: ["#chapterContent", "chapter-content"]
  },
  {
    hostname: 'fenrirealm.com',
    contentSelector: ('.content-area')
  },
] as const;

export const MATCH_PATTERNS = SITES.map(s => `*://*.${s.hostname}/*`);

export const getActiveConfig = () =>
  SITES.find(s => window.location.hostname.includes(s.hostname));
