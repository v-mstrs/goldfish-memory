import { getActiveConfig } from "./sites";
import { type Character } from "./db/schema";
import browser from "webextension-polyfill";
import { showAddCharacterModal } from "./modal";

console.log("CONTENT SCRIPT LOADED");

let currentNovelId: number | null = null;
let isProcessing = false;
let lastUrl = location.href;

async function waitForContainer(selector: string, timeout = 10000): Promise<HTMLElement | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const el = document.querySelector(selector) as HTMLElement;
        // Novel sites often load content dynamically; wait for substantial text
        if (el && el.textContent && el.textContent.trim().length > 200) {
            return el;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    return document.querySelector(selector) as HTMLElement | null;
}

async function processSiteContent(siteConfig: any) {
    if (isProcessing) return;
    if (!siteConfig) return;
    
    isProcessing = true;
    console.log("[Goldfish] Checking for characters to highlight...");

    try {
        const storage = await browser.storage.local.get(['activeNovelId']);
        const activeNovelId = storage.activeNovelId as string;

        if (!activeNovelId) {
            console.log("[Goldfish] No novel selected in extension.");
            isProcessing = false;
            return;
        }

        currentNovelId = parseInt(activeNovelId);

        // Verify background script is responsive
        try {
            await browser.runtime.sendMessage({ type: 'PING' });
        } catch (e) {
            console.warn("[Goldfish] Background script not responding. Attempting to proceed anyway...");
        }

        const characters = await browser.runtime.sendMessage({ 
            type: 'GET_CHARACTERS', 
            novelId: currentNovelId 
        }) as Character[];

        console.log(`[Goldfish] Fetched ${characters.length} characters.`);

        const container = await waitForContainer(siteConfig.contentSelector);

        if (!container) {
            console.log(`[Goldfish] Content container not found: ${siteConfig.contentSelector}`);
            isProcessing = false;
            return;
        }

        injectGoldfishStyles();

        const searchTerms = [];
        for (const char of characters) {
            let names = [char.name, ...(char.aliases ?? [])];
            for (const n of names) {
                const clean = n.trim();
                if (clean) searchTerms.push({ name: clean, desc: char.description, img: char.imageUrl });
            }
        }

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        let currentNode: Node | null;
        const textNodes: Text[] = [];

        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode as Text);
        }

        const HIGHLIGHT_LIMIT = 5;
        let totalMatches = 0;

        for (const term of searchTerms) {
            let count = 0;
            const escaped = term.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

            for (const node of textNodes) {
                if (count >= HIGHLIGHT_LIMIT) break; 

                const parent = node.parentElement;
                if (!parent || parent.classList.contains('goldfish-highlight') || 
                    parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;

                const text = node.nodeValue || "";
                if (regex.test(text)) {
                    const newHTML = text.replace(regex, (match) => {
                        if (count < HIGHLIGHT_LIMIT) {
                            count++;
                            totalMatches++;
                            let imgTag = term.img ? `<img src="${term.img}">` : "";
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
        console.log(`[Goldfish] Highlighting complete. Total matches: ${totalMatches}`);
    } catch (error) {
        console.error("[Goldfish] Critical error in highlighter:", error);
    } finally {
        isProcessing = false;
    }
}

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
    console.log("[Goldfish] Styles injected");
}

const init = async () => {
    const siteConfig = getActiveConfig();
    if (!siteConfig) return;

    if (document.readyState === "loading") {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    await processSiteContent(siteConfig);
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === "CONTEXT_MENU_ADD_CHARACTER") {
        console.log("%c[Goldfish] Character to add:", "color: #6495ED; font-weight: bold;", message.text);
        if (currentNovelId) {
            let rect: DOMRect | undefined;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                try {
                    rect = selection.getRangeAt(0).getBoundingClientRect();
                } catch (e) {}
            }
            showAddCharacterModal(message.text, currentNovelId, rect);
        } else {
            alert("Please select a novel in the Goldfish extension popup first.");
        }
    }
});

// Watch for URL changes (for SPAs like wetriedtls.com)
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("[Goldfish] Navigation detected, re-initializing...");
        init();
    }
}, 2000);

// Watch for storage changes (e.g. user selects a different novel in the popup)
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.activeNovelId) {
        console.log("[Goldfish] Novel changed, refreshing highlights...");
        init();
    }
});

init()