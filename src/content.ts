import { getActiveConfig } from "./sites";
import { type DraftState } from "./types";
import { type Character } from "./db/schema";
import browser from "webextension-polyfill";
import { showAddCharacterModal } from "./modal";

console.log("CONTENT SCRIPT LOADED");

let currentNovelId: number | null = null;

async function processSiteContent(siteConfig: any) {
    const storage = await browser.storage.local.get('draft');
    const draft = storage.draft as DraftState;

    if (!draft?.selectedNovel) {
        console.log("[Goldfish] No selected novel");
        return;
    }

    currentNovelId = parseInt(draft.selectedNovel);

    const characters = await browser.runtime.sendMessage({ 
        type: 'GET_CHARACTERS', 
        novelId: currentNovelId 
    }) as Character[];

    const container = document.querySelector(siteConfig.contentSelector) as HTMLElement;

    if (!container) {
        console.log(`[Goldfish] no container ${container}`);
        return;
    }

    injectGoldfishStyles();

    const searchTerms = [];
    for (const char of characters) {
        let names = [char.name, ...(char.aliases ?? [])]; // [name1, name2...]
        for (const n of names) {
            const clean = n.trim();
            if (clean) searchTerms.push({ name: clean, desc: char.description, img: char.imageUrl });
        }
    }

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null;
    const textNodes: Text[] = [];

    // We collect them into a list first so we don't get lost while modifying the DOM
    while (currentNode = walker.nextNode()) {
        textNodes.push(currentNode as Text);
    }

    const HIGHLIGHT_LIMIT = 5;

    // For every character name, search the text nodes
    for (const term of searchTerms) {
        let count = 0;
        const escaped = term.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');

        for (const node of textNodes) {
            if (count >= HIGHLIGHT_LIMIT) // Stop if we hit 5 for this name
                break; 

            const parent = node.parentElement;
            // Safety: Don't highlight if we already did or if it's a script/style
            if (!parent || parent.classList.contains('goldfish-highlight') || 
                parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') continue;

            const text = node.nodeValue || "";
            if (regex.test(text)) {
                // Re-run match to get the specific text
                const newHTML = text.replace(regex, (match) => {
                    if (count < HIGHLIGHT_LIMIT) {
                        count++;
                        let imgTag = term.img ? `<img src="${term.img}">` : "";
                        const tooltip = `<span class="goldfish-tooltip">${imgTag}<span class="goldfish-tooltip-text">${term.desc}</span></span>`;
                        return `<span class="goldfish-highlight">${match}${tooltip}</span>`;
                    }
                    return match;
                });

                // If we actually changed something, update the DOM
                if (newHTML !== text) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = newHTML;
                    node.replaceWith(...wrapper.childNodes);
                }
            }
        }
    }
    console.log("[Goldfish] TreeWalker Highlighting complete.");
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
            z-index: 2147483647 !important; /* Max z-index */
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

    // Append to head, or body if head isn't ready
    (document.head || document.documentElement).appendChild(style);
    console.log("[Goldfish] Styles injected into DOM");
}

const init = async () => {
    const siteConfig = getActiveConfig();

    // Wait for DOM to be ready just to be sure.
    if (document.readyState === "loading") {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }

    // Add a small delay to ensure containers are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    await processSiteContent(siteConfig);
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === "CONTEXT_MENU_ADD_CHARACTER") {
        console.log("%c[Goldfish] Character to add:", "color: #6495ED; font-weight: bold;", message.text);
        if (currentNovelId) {
            // Try to get selection coordinates
            let rect: DOMRect | undefined;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                // We assume the user just clicked right click -> Add Character, 
                // so the selection should still be the one they clicked.
                // However, sometimes context menu click might change selection? 
                // Usually it doesn't unless they left click.
                try {
                    rect = selection.getRangeAt(0).getBoundingClientRect();
                } catch (e) {
                    console.log("Could not get selection rect", e);
                }
            }

            showAddCharacterModal(message.text, currentNovelId, rect);
        } else {
            console.warn("[Goldfish] No novel selected, cannot add character.");
            alert("Please select a novel in the Goldfish extension popup first.");
        }
    }
});

init()
