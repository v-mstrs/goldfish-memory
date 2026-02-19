import { getActiveConfig } from "./sites";
import { type Character } from "./services/database";
import browser from "webextension-polyfill";
import { showAddCharacterModal } from "./modal";

/**
 * GoldfishHighlighter handles the scanning and highlighting of character names
 * on supported web novel sites.
 */
class GoldfishHighlighter {
    private currentNovelId: number | null = null;
    private isProcessing = false;
    private lastUrl = location.href;
    private readonly HIGHLIGHT_LIMIT_PER_CHAR = 5;

    constructor() {
        this.setupListeners();
        this.init();
    }

    /**
     * Entry point for site processing.
     */
    private async init() {
        const config = getActiveConfig();
        if (!config) return;

        if (document.readyState === "loading") {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        await this.process(config);
    }

    /**
     * Sets up event listeners for messages and URL changes.
     */
    private setupListeners() {
        browser.runtime.onMessage.addListener((message: any) => {
            if (message.type === "RESCAN_PAGE") {
                this.init();
                return;
            }
            if (message.type === "CONTEXT_MENU_ADD_CHARACTER") {
                this.handleAddCharacter(message.text);
            }
        });

        // Smart tooltip positioning
        document.addEventListener('mouseover', this.handleTooltipPositioning.bind(this));

        // SPA support: watch for URL changes
        setInterval(() => {
            if (location.href !== this.lastUrl) {
                this.lastUrl = location.href;
                this.init();
            }
        }, 2000);

        // Watch for novel selection changes
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'local' && changes.activeNovelId) {
                this.init();
            }
        });
    }

    private async handleAddCharacter(text: string) {
        if (!this.currentNovelId) {
            alert("Please select a novel in the Goldfish extension popup first.");
            return;
        }
        let rect: DOMRect | undefined;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            try { rect = selection.getRangeAt(0).getBoundingClientRect(); } catch (e) {}
        }
        showAddCharacterModal(text, this.currentNovelId, rect);
    }

    private handleTooltipPositioning(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.classList?.contains('goldfish-highlight')) return;

        const tooltip = target.querySelector('.goldfish-tooltip') as HTMLElement;
        if (!tooltip) return;

        const rect = target.getBoundingClientRect();
        tooltip.classList.remove('bottom');

        const tooltipHeight = tooltip.offsetHeight || 200;
        if (rect.top - tooltipHeight < 20) {
            tooltip.classList.add('bottom');
        }
    }

    /**
     * Robust wait for content container to be populated.
     */
    private async waitForContainer(selector: string, timeout = 10000): Promise<HTMLElement | null> {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector) as HTMLElement;
            if (el?.textContent && el.textContent.trim().length > 200) return el;
            await new Promise(r => setTimeout(r, 500));
        }
        return document.querySelector(selector) as HTMLElement | null;
    }

    /**
     * Core highlighting logic. Uses a single regex pass for performance.
     */
    private async process(config: any) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const data = await browser.storage.local.get('activeNovelId');
            const activeNovelId = data.activeNovelId as string;
            if (!activeNovelId) return;

            this.currentNovelId = parseInt(activeNovelId);
            const characters = await browser.runtime.sendMessage({
                type: 'GET_CHARACTERS',
                novelId: this.currentNovelId
            }) as Character[];

            if (!characters || characters.length === 0) return;

            const container = await this.waitForContainer(config.contentSelector);
            if (!container) return;

            this.injectStyles();

            // Prepare lookup maps and combined regex
            const nameToChar = new Map<string, Character>();
            const searchTerms: string[] = [];

            for (const char of characters) {
                const variants = [char.name, ...(char.aliases || [])]
                    .map(n => n.trim())
                    .filter(Boolean);
                
                for (const v of variants) {
                    nameToChar.set(v.toLowerCase(), char);
                    searchTerms.push(v.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
                }
            }

            // Match longer names first to avoid partial matches (e.g., "John Smith" before "John")
            searchTerms.sort((a, b) => b.length - a.length);
            const regex = new RegExp(`\\b(${searchTerms.join('|')})\\b`, 'gi');

            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent || 
                        parent.classList.contains('goldfish-highlight') ||
                        ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const nodes: Text[] = [];
            let node;
            while (node = walker.nextNode()) nodes.push(node as Text);

            const matchCounts = new Map<number, number>();
            let totalApplied = 0;

            for (const textNode of nodes) {
                const text = textNode.nodeValue || "";
                if (!regex.test(text)) continue;

                regex.lastIndex = 0; // Reset after test()
                const fragments: (Node | string)[] = [];
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(text)) !== null) {
                    const matchedName = match[0].toLowerCase();
                    const char = nameToChar.get(matchedName);
                    
                    if (!char || (matchCounts.get(char.id!) || 0) >= this.HIGHLIGHT_LIMIT_PER_CHAR) {
                        fragments.push(text.substring(lastIndex, regex.lastIndex));
                        lastIndex = regex.lastIndex;
                        continue;
                    }

                    // Text before the match
                    fragments.push(text.substring(lastIndex, match.index));

                    // The highlight itself
                    fragments.push(this.createHighlightNode(match[0], char));

                    matchCounts.set(char.id!, (matchCounts.get(char.id!) || 0) + 1);
                    totalApplied++;
                    lastIndex = regex.lastIndex;
                }

                if (totalApplied > 0) {
                    fragments.push(text.substring(lastIndex));
                    textNode.replaceWith(...fragments.map(f => typeof f === 'string' ? document.createTextNode(f) : f));
                }
            }

            if (totalApplied > 0) console.log(`[Goldfish] Applied ${totalApplied} highlights.`);

        } catch (error) {
            console.error("[Goldfish] Content processing failed:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    private createHighlightNode(text: string, char: Character): HTMLElement {
        const span = document.createElement('span');
        span.className = 'goldfish-highlight';
        span.textContent = text;

        const tooltip = document.createElement('span');
        tooltip.className = 'goldfish-tooltip';

        if (char.imageUrl) {
            const img = document.createElement('img');
            img.src = char.imageUrl;
            tooltip.appendChild(img);
        }

        const desc = document.createElement('span');
        desc.className = 'goldfish-tooltip-text';
        desc.textContent = char.description;
        tooltip.appendChild(desc);

        span.appendChild(tooltip);
        return span;
    }

    private injectStyles() {
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
                background-color: rgba(20, 20, 23, 0.95) !important;
                color: #f0f0f0 !important;
                padding: 12px !important;
                border-radius: 8px !important;
                font-size: 14px !important;
                font-family: sans-serif !important;
                line-height: 1.4 !important;
                width: max-content !important;
                max-width: 280px !important;
                z-index: 2147483647 !important;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s ease, transform 0.2s ease !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.5) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                pointer-events: none !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                backdrop-filter: blur(4px) !important;
            }
            .goldfish-highlight:hover .goldfish-tooltip {
                visibility: visible !important;
                opacity: 1 !important;
                transform: translateX(-50%) translateY(-5px) !important;
            }
            .goldfish-tooltip.bottom {
                bottom: auto !important;
                top: 125% !important;
            }
            .goldfish-tooltip img {
                max-width: 150px !important;
                max-height: 150px !important;
                width: auto !important;
                display: block !important;
                margin-bottom: 10px !important;
                border-radius: 4px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
            }
            .goldfish-tooltip-text {
                display: block !important;
                text-align: center !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }
}

// Instantiate the highlighter
new GoldfishHighlighter();