import { getActiveConfig } from "./sites";
import { type DraftState } from "./types";
import { type Character } from "./db/schema";
import browser from "webextension-polyfill";

console.log("CONTENT SCRIPT LOADED");

async function processSiteContent(siteConfig: any) {
    // 1. Check storage - MAKE SURE THIS KEY MATCHES YOUR POPUP
    const storage = await browser.storage.local.get('draft');
    const draft = storage.draft as DraftState;

    console.log(`draft selectedNovel is: ${draft.selectedNovel}`)

    if (!draft?.selectedNovel) {
        console.log("[Goldfish] No novel selected in storage 'draft'");
        return;
    }

    // 2. Get characters
    // Content script cannot access IndexedDB directly (wrong origin), so we ask the background script
    const characters = await browser.runtime.sendMessage({ 
        type: 'GET_CHARACTERS', 
        novelId: parseInt(draft.selectedNovel) 
    }) as Character[];
    console.log("Characters found:", characters.length)
    const container = document.querySelector(siteConfig.contentSelector) as HTMLElement;

    if (!container) {
        console.log("[Goldfish] Container not found:", siteConfig.contentSelector);
        return;
    }

    injectGoldfishStyles();

    // 3. Prepare search terms (Aliases included)
    const searchTerms: { name: string, desc: string, img?: string }[] = [];
    characters.forEach(char => {
        const names = [char.name, ...(char.aliases || [])];
        names.forEach(n => {
            if (n.trim()) {
                searchTerms.push({
                    name: n.trim(),
                    desc: char.description,
                    img: char.imageUrl
                });
            }
        });
    });

    // Sort longest first
    searchTerms.sort((a, b) => b.name.length - a.name.length);

    let html = container.innerHTML;

    searchTerms.forEach(({ name, desc, img }) => {
        // ESCAPE the name so special chars don't break regex
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // THE FIX: The second half of this regex prevents highlighting 
        // if the word is already inside a goldfish span/tooltip.
        const regex = new RegExp(`\\b(${escaped})\\b(?![^<]*>)(?![^<]*class="goldfish-)`, 'gi');

        if (regex.test(html)) {
            const imgTag = (img && img.trim() !== "")
                ? `<img src="${img}" alt="${name}">`
                : "";

            const tooltipHtml = `
                <span class="goldfish-tooltip">
                    ${imgTag}
                    <span class="goldfish-tooltip-text">${desc}</span>
                </span>
            `.replace(/\s+/g, ' ').trim();

            // Replace only if not already wrapped
            html = html.replace(regex, `<span class="goldfish-highlight">$1${tooltipHtml}</span>`);
        }
    });

    container.innerHTML = html;
    console.log("[Goldfish] Highlighting complete.");
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

// Call it at the start of your content script logic
injectGoldfishStyles();

const init = async () => {
    const siteConfig = getActiveConfig();

    if (!siteConfig) {
        console.log("SITE NOT IN SITES.TS")
        return;
    }

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

init()