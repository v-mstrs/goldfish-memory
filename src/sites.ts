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
  {
    hostname: 'webnoveltranslations.com',
    contentSelector: ('#novel-chapter-container')
  }
] as const;

export const MATCH_PATTERNS = SITES.map(s => `https://${s.hostname}/*`);

export const getActiveConfig = () =>
  SITES.find(s => window.location.hostname.includes(s.hostname));
