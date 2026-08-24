import { browser } from 'wxt/browser';
import { getActiveConfig, MATCH_PATTERNS, type SiteConfig } from "../sites";
import { type Character } from "../services/api";
import { showAddCharacterModal } from "../modal";
import { isRuntimeMessage } from "../types/messages";

interface HighlightDisplaySettings {
    fontSizePx: number;
    fontWeight: "400" | "600" | "700";
    fontStyle: "normal" | "italic";
    underlineStyle: "none" | "solid" | "dashed" | "dotted" | "wavy";
    highlightLimitPerChar: number;
}

const DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR = 5;
const DEFAULT_HIGHLIGHT_FONT_SIZE_PX = 16;

const DEFAULT_DISPLAY_SETTINGS: HighlightDisplaySettings = {
    fontSizePx: DEFAULT_HIGHLIGHT_FONT_SIZE_PX,
    fontWeight: "700",
    underlineStyle: "wavy",
    fontStyle: "normal",
    highlightLimitPerChar: DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR,
};

export default defineContentScript({
    matches: MATCH_PATTERNS as unknown as string[],
    main() {
        console.log("[Goldfish] Content script loaded:", window.location.href);
        /**
         * GoldfishHighlighter handles the scanning and highlighting of character names
         * on supported web novel sites.
         */
        class GoldfishHighlighter {
            private currentNovelSlug: string | null = null;
            private isProcessing = false;
            private pendingRescan = false;
            private rescanTimeout: ReturnType<typeof setTimeout> | null = null;
            private contentObserver: MutationObserver | null = null;
            private lastUrl = location.href;
            private displaySettings: HighlightDisplaySettings = DEFAULT_DISPLAY_SETTINGS;

            constructor() {
                this.setupListeners();
                this.init();
            }

            /**
             * Entry point for site processing.
             */
            private async init() {
                const config = getActiveConfig();
                if (!config) {
                    console.warn("[Goldfish] No site config matched for:", window.location.hostname);
                    return;
                }

                if (document.readyState === "loading") {
                    await new Promise<void>((resolve) => document.addEventListener("DOMContentLoaded", () => resolve(), { once: true }));
                }
                await this.process(config);
            }

            /**
             * Sets up event listeners for messages and URL changes.
             */
            private setupListeners() {
                browser.runtime.onMessage.addListener((message: unknown) => {
                    if (!isRuntimeMessage(message)) return;

                    if (message.type === "RESCAN_PAGE") {
                        this.init();
                        return;
                    }
                    if (message.type === "CONTEXT_MENU_ADD_CHARACTER") {
                        this.handleAddCharacter(message.text);
                    }
                });

                // Keep character tooltips next to the pointer instead of anchoring
                // them to the highlighted text (which may wrap across lines).
                const positionTooltip = this.handleTooltipPositioning.bind(this);
                document.addEventListener('mouseover', positionTooltip);
                document.addEventListener('mousemove', positionTooltip);

                // SPA support: watch for URL changes
                setInterval(() => {
                    if (location.href !== this.lastUrl) {
                        this.lastUrl = location.href;
                        this.init();
                    }
                }, 2000);

                // Watch for novel selection changes
                browser.storage.onChanged.addListener((changes, area) => {
                    if (area === 'local' && (changes.activeNovelSlug || changes.highlightDisplaySettings)) {
                        this.init();
                    }
                });
            }

            /**
             * Rescan when a supported site renders or replaces chapter content after
             * the initial page load. The debounce lets framework updates settle first.
             */
            private observeContent(config: SiteConfig) {
                this.contentObserver?.disconnect();

                const root = document.documentElement;
                if (!root) return;

                this.contentObserver = new MutationObserver((mutations) => {
                    if (!this.hasRelevantContentMutation(mutations, config.contentSelector)) return;
                    this.scheduleRescan();
                });

                this.contentObserver.observe(root, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
            }

            private hasRelevantContentMutation(mutations: MutationRecord[], selector: string): boolean {
                const container = document.querySelector(selector);

                const containsContent = (node: Node) => {
                    if (!(node instanceof Element)) return false;
                    return node.matches(selector) || Boolean(node.querySelector(selector));
                };

                return mutations.some((mutation) => {
                    if (container && (mutation.target === container || container.contains(mutation.target))) {
                        return true;
                    }

                    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) =>
                        containsContent(node) || Boolean(container && (node === container || container.contains(node)))
                    );
                });
            }

            private scheduleRescan(delay = 400) {
                if (this.rescanTimeout) clearTimeout(this.rescanTimeout);
                this.rescanTimeout = setTimeout(() => {
                    this.rescanTimeout = null;
                    void this.init();
                }, delay);
            }

            private async handleAddCharacter(text: string) {
                if (!this.currentNovelSlug) {
                    alert("Please select a novel in the Goldfish extension popup first.");
                    return;
                }
                let rect: DOMRect | undefined;
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    try { rect = selection.getRangeAt(0).getBoundingClientRect(); } catch (e) {}
                }
                showAddCharacterModal(text, this.currentNovelSlug, rect);
            }

            private handleTooltipPositioning(e: MouseEvent) {
                const target = e.target as HTMLElement;
                if (!target.classList?.contains('goldfish-highlight')) return;

                const tooltip = target.querySelector('.goldfish-tooltip') as HTMLElement;
                if (!tooltip) return;

                const deferredImage = tooltip.querySelector('img[data-src]') as HTMLImageElement | null;
                if (deferredImage?.dataset.src) {
                    const imageUrl = deferredImage.dataset.src;
                    delete deferredImage.dataset.src;
                    deferredImage.addEventListener('load', () => this.handleTooltipPositioning(e), { once: true });
                    deferredImage.src = imageUrl;
                }

                const tooltipHeight = tooltip.offsetHeight || 200;
                const tooltipWidth = tooltip.offsetWidth || 280;
                const edgePadding = 12;
                const cursorGap = 14;
                const maxLeft = Math.max(edgePadding, window.innerWidth - tooltipWidth - edgePadding);
                const left = Math.min(
                    Math.max(e.clientX - tooltipWidth / 2, edgePadding),
                    maxLeft,
                );
                const top = e.clientY - tooltipHeight - cursorGap >= edgePadding
                    ? e.clientY - tooltipHeight - cursorGap
                    : Math.min(
                        e.clientY + cursorGap,
                        Math.max(edgePadding, window.innerHeight - tooltipHeight - edgePadding),
                    );

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
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
            private async process(config: SiteConfig) {
                if (this.isProcessing) {
                    this.pendingRescan = true;
                    return;
                }

                if (this.rescanTimeout) {
                    clearTimeout(this.rescanTimeout);
                    this.rescanTimeout = null;
                }

                this.isProcessing = true;
                // Goldfish replaces text nodes while highlighting. Pausing the observer
                // prevents those internal edits from scheduling an endless rescan loop.
                this.contentObserver?.disconnect();

                try {
                    const container = await this.waitForContainer(config.contentSelector);
                    if (!container) return;

                    this.clearHighlights(container);

                    const data = await browser.storage.local.get('activeNovelSlug');
                    const activeNovelSlug = data.activeNovelSlug as string;
                    if (!activeNovelSlug) return;
                    this.displaySettings = await this.getDisplaySettings();

                    this.currentNovelSlug = activeNovelSlug;
                    const characters = await browser.runtime.sendMessage({
                        type: 'GET_CHARACTERS',
                        novelSlug: this.currentNovelSlug
                    }) as Character[];

                    if (!characters || characters.length === 0) return;

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
                            searchTerms.push(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
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

                    const matchCounts = new Map<string, number>();
                    let totalApplied = 0;

                    for (const textNode of nodes) {
                        const text = textNode.nodeValue || "";
                        let nodeApplied = 0;
                        regex.lastIndex = 0;
                        if (!regex.test(text)) continue;

                        regex.lastIndex = 0; // Reset after test()
                        const fragments: (Node | string)[] = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = regex.exec(text)) !== null) {
                            const matchedName = match[0].toLowerCase();
                            const char = nameToChar.get(matchedName);
                            const matchKey = char?.name?.toLowerCase() || "";
                            
                            if (!char || (matchCounts.get(matchKey) || 0) >= this.displaySettings.highlightLimitPerChar) {
                                fragments.push(text.substring(lastIndex, regex.lastIndex));
                                lastIndex = regex.lastIndex;
                                continue;
                            }

                            // Text before the match
                            fragments.push(text.substring(lastIndex, match.index));

                            // The highlight itself
                            fragments.push(this.createHighlightNode(match[0], char));

                            matchCounts.set(matchKey, (matchCounts.get(matchKey) || 0) + 1);
                            nodeApplied++;
                            totalApplied++;
                            lastIndex = regex.lastIndex;
                        }

                        if (nodeApplied > 0) {
                            fragments.push(text.substring(lastIndex));
                            textNode.replaceWith(...fragments.map(f => typeof f === 'string' ? document.createTextNode(f) : f));
                        }
                    }

                    if (totalApplied > 0) console.log(`[Goldfish] Applied ${totalApplied} highlights.`);

                } catch (error) {
                    console.error("[Goldfish] Content processing failed:", error);
                } finally {
                    this.isProcessing = false;
                    this.observeContent(config);

                    if (this.pendingRescan) {
                        this.pendingRescan = false;
                        this.scheduleRescan(0);
                    }
                }
            }

            private clearHighlights(container: HTMLElement) {
                const highlights = Array.from(container.querySelectorAll('.goldfish-highlight'));
                if (highlights.length === 0) return;

                const parents = new Set<Node>();

                for (const highlight of highlights) {
                    const labelNode = Array.from(highlight.childNodes).find(
                        (node) => node.nodeType === Node.TEXT_NODE
                    );
                    const label = labelNode?.textContent || "";

                    parents.add(highlight.parentNode as Node);
                    highlight.replaceWith(document.createTextNode(label));
                }

                for (const parent of parents) {
                    parent.normalize();
                }
            }

            private createHighlightNode(text: string, char: Character): HTMLElement {
                const span = document.createElement('span');
                span.className = 'goldfish-highlight';
                span.textContent = text;
                span.style.fontSize = `${this.displaySettings.fontSizePx}px`;
                span.style.fontWeight = this.displaySettings.fontWeight;
                span.style.fontStyle = this.displaySettings.fontStyle;

                const color = char.highlightColor || "#c5daff";
                const showUnderline = this.displaySettings.underlineStyle !== "none";

                span.style.color = color;
                span.style.textDecoration = showUnderline
                    ? `${color} ${this.displaySettings.underlineStyle} underline`
                    : "none";
                span.style.textDecorationColor = color;
                span.style.backgroundColor = "transparent";
                span.style.boxShadow = "none";

                const tooltip = document.createElement('span');
                tooltip.className = 'goldfish-tooltip';

                if (char.imageUrl) {
                    const img = document.createElement('img');
                    img.dataset.src = char.imageUrl;
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    tooltip.appendChild(img);
                }

                const desc = document.createElement('span');
                desc.className = 'goldfish-tooltip-text';
                desc.textContent = char.description;
                tooltip.appendChild(desc);

                span.appendChild(tooltip);
                return span;
            }

            private async getDisplaySettings(): Promise<HighlightDisplaySettings> {
                const { highlightDisplaySettings } = await browser.storage.local.get("highlightDisplaySettings");
                const raw = highlightDisplaySettings as Partial<HighlightDisplaySettings> | undefined;

                return {
                    fontSizePx: this.normalizeFontSize(raw?.fontSizePx),
                    fontWeight: raw?.fontWeight || DEFAULT_DISPLAY_SETTINGS.fontWeight,
                    fontStyle: raw?.fontStyle || DEFAULT_DISPLAY_SETTINGS.fontStyle,
                    underlineStyle: raw?.underlineStyle || DEFAULT_DISPLAY_SETTINGS.underlineStyle,
                    highlightLimitPerChar: this.normalizeHighlightLimit(raw?.highlightLimitPerChar),
                };
            }

            private normalizeFontSize(value: unknown): number {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    return DEFAULT_HIGHLIGHT_FONT_SIZE_PX;
                }

                const normalized = Math.floor(value);
                return normalized >= 10 && normalized <= 36 ? normalized : DEFAULT_HIGHLIGHT_FONT_SIZE_PX;
            }

            private normalizeHighlightLimit(value: unknown): number {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    return DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR;
                }

                const normalized = Math.floor(value);
                return normalized > 0 ? normalized : DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR;
            }

            private injectStyles() {
                const STYLE_ID = 'goldfish-style-tag';
                if (document.getElementById(STYLE_ID)) return;

                const style = document.createElement('style');
                style.id = STYLE_ID;
                style.textContent = `
                    .goldfish-highlight {
                        position: relative !important;
                        display: inline !important;
                        padding: 0 2px !important;
                        border-radius: 3px !important;
                        cursor: help !important;
                    }
                    .goldfish-tooltip {
                        position: fixed !important;
                        top: 0;
                        bottom: auto !important;
                        left: 0;
                        right: auto !important;
                        transform: none !important;
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
                        transform: none !important;
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
    }
});
