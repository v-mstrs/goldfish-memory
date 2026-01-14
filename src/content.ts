import { getActiveConfig } from "./sites";
import { type Character } from "./db/schema";
import browser from "webextension-polyfill";
import { showAddCharacterModal } from "./modal";

let currentNovelId: number | null = null;
let isProcessing = false;
let lastUrl = location.href;

/**
 * Waits for the content container to appear and contain actual text.
 */
async function waitForContainer(selector: string, timeout = 10000): Promise<HTMLElement | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector) as HTMLElement;
        if (el?.textContent && el.textContent.trim().length > 200) return el;
        await new Promise(r => setTimeout(r, 500));
    }
    return document.querySelector(selector) as HTMLElement | null;
}

/**
 * Scans the page for character names and injects highlights/tooltips.
 */
async function processSiteContent(siteConfig: any) {
    if (isProcessing || !siteConfig) return;
    isProcessing = true;

    try {
        const storage = await browser.storage.local.get(['activeNovelId']);
        if (!storage.activeNovelId) {
            isProcessing = false;
            return;
        }

        currentNovelId = parseInt(storage.activeNovelId as string);

        // Fetch characters for the selected novel
        const characters = await browser.runtime.sendMessage({ 
            type: 'GET_CHARACTERS', 
            novelId: currentNovelId 
        }) as Character[];

        if (!characters.length) {
            isProcessing = false;
            return;
        }

        const container = await waitForContainer(siteConfig.contentSelector);
        if (!container) {
            isProcessing = false;
            return;
        }

        injectGoldfishStyles();

        // Build list of terms to search for
        const searchTerms = characters.flatMap(char => {
            const names = [char.name, ...(char.aliases ?? [])].map(n => n.trim()).filter(Boolean);
            return names.map(name => ({ name, desc: char.description, img: char.imageUrl }));
        });

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        const textNodes: Text[] = [];
        let currentNode: Node | null;
        while (currentNode = walker.nextNode()) textNodes.push(currentNode as Text);

        const HIGHLIGHT_LIMIT = 5;
        let totalMatches = 0;

        for (const term of searchTerms) {
            let count = 0;
            const escaped = term.name.replace(/[.*+?^${}()|[\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

            for (const node of textNodes) {
                if (count >= HIGHLIGHT_LIMIT) break; 

                const parent = node.parentElement;
                if (!parent || parent.classList.contains('goldfish-highlight') || 
                    ['SCRIPT', 'STYLE'].includes(parent.tagName)) continue;

                const text = node.nodeValue || "";
                if (regex.test(text)) {
                    const newHTML = text.replace(regex, (match) => {
                        if (count < HIGHLIGHT_LIMIT) {
                            count++;
                            totalMatches++;
                            const imgTag = term.img ? `<img src="${term.img}">` : "";
                            const tooltip = `<span class="goldfish-tooltip">${imgTag}<span class="goldfish-tooltip-text">${term.desc}</span></span>`;
                            return `<span class="goldfish-highlight">${match}${tooltip}</span>`;
                        }
                        return match;
                    });

                    if (newHTML !== text) {
                        const wrapper = document.createElement('span');
                        wrapper.innerHTML = newHTML;
                        node.replaceWith(...wrapper.childNodes);
                    }
                }
            }
        }
        if (totalMatches > 0) console.log(`[Goldfish] Applied ${totalMatches} highlights.`);
    } catch (error) {
        console.error("[Goldfish] Error processing page:", error);
    } finally {
        isProcessing = false;
    }
}

/**
 * Injects the necessary CSS for highlights and tooltips into the page.
 */
function injectGoldfishStyles() {
    const STYLE_ID = 'goldfish-style-tag';
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        .goldfish-highlight {
            position: relative !important;
            color: #6495ED !important; 
            display: inline !important;
            padding: 0 2px !important;
            border-radius: 3px !important;
            border-bottom: 1px dotted #6495ED !important;
            cursor: help !important;
            font-weight: bold !important;
        }
        .goldfish-tooltip {
            position: absolute !important;
            bottom: 125% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background-color: #333 !important;
            color: #fff !important;
            padding: 10px !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            width: max-content !important;
            max-width: 280px !important;
            z-index: 2147483647 !important;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.1s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4) !important;
            pointer-events: none !important;
        }
        .goldfish-highlight:hover .goldfish-tooltip {
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);
}

/**
 * Initializes highlighting for the current site.
 */
const init = async () => {
    const siteConfig = getActiveConfig();
    if (!siteConfig) return;

    if (document.readyState === "loading") {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    await processSiteContent(siteConfig);
}

// --- Event Listeners ---

// Listen for Context Menu "Add Character" command and popup "Rescan" command
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === "RESCAN_PAGE") {
        init();
        return;
    }
    if (message.type === "CONTEXT_MENU_ADD_CHARACTER") {
        if (!currentNovelId) {
            alert("Please select a novel in the Goldfish extension popup first.");
            return;
        }
        let rect: DOMRect | undefined;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            try { rect = selection.getRangeAt(0).getBoundingClientRect(); } catch (e) {}
        }
        showAddCharacterModal(message.text, currentNovelId, rect);
    }
});

// Watch for URL changes (SPA support)
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        init();
    }
}, 2000);

// Watch for storage changes (Novel selection)
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.activeNovelId) init();
});

// Start initial scan
init();
