
import { MATCH_PATTERNS } from "./sites";
import { aiService } from "./services/ai";
import { apiService, type Character } from "./services/api";

const ADD_CHAR_ID = "add-character";
const SCAN_AI_SAVE_ID = "scan-ai-save";
const DEFAULT_HIGHLIGHT_COLOR = "none";

const menusApi = browser.menus || browser.contextMenus;

function initContextMenu() {
    if (!menusApi) return;

    const registerMenu = async () => {
        try {
            await menusApi.removeAll();
            
            menusApi.create({
                id: ADD_CHAR_ID,
                title: 'Add Character',
                contexts: ["selection"],
                documentUrlPatterns: MATCH_PATTERNS
            });

            menusApi.create({
                id: SCAN_AI_SAVE_ID,
                title: 'Scan & Save with AI',
                contexts: ["page"],
                documentUrlPatterns: MATCH_PATTERNS
            });
        } catch {
            // Ignore setup errors
        }
    };

    void registerMenu();
    browser.runtime.onInstalled.addListener(() => { void registerMenu(); });
    browser.runtime.onStartup?.addListener(() => { void registerMenu(); });

    menusApi.onClicked.addListener(async (info, tab) => {
        if (!tab?.id) return;

        if (info.menuItemId === ADD_CHAR_ID) {
            browser.tabs.sendMessage(tab.id, {
                type: "CONTEXT_MENU_ADD_CHARACTER",
                text: info.selectionText
            }).catch(() => {});
        } else if (info.menuItemId === SCAN_AI_SAVE_ID) {
            void handleAiScan(tab.id, false);
        }
    });
}

async function handleAiScan(tabId: number, isPreview = false) {
    const showAlert = (text: string) => {
        browser.tabs.sendMessage(tabId, { type: "SHOW_ALERT", text }).catch(() => {
            console.error("[Goldfish AI] Alert failed:", text);
        });
    };

    const showLoading = (text: string) => {
        browser.tabs.sendMessage(tabId, { type: "SHOW_LOADING", text }).catch(() => {});
    };

    const hideLoading = () => {
        browser.tabs.sendMessage(tabId, { type: "HIDE_LOADING" }).catch(() => {});
    };

    try {
        const { activeNovelSlug, geminiApiKey } = await browser.storage.local.get(["activeNovelSlug", "geminiApiKey"]);
        
        if (!activeNovelSlug) {
            showAlert("Please select a novel in the Goldfish extension popup first.");
            return;
        }

        if (!geminiApiKey) {
            showAlert("Gemini API Key is missing. Please add it in the extension settings.");
            return;
        }

        console.log(`[Goldfish AI] Starting scan (Preview: ${isPreview}) for novel: ${activeNovelSlug}`);
        showLoading("Extracting page content...");

        // 1. Get chapter text
        console.log("[Goldfish AI] Step 1: Requesting text from content script...");
        let response;
        try {
            response = await browser.tabs.sendMessage(tabId, { type: "GET_CHAPTER_TEXT" });
        } catch (e) {
            hideLoading();
            throw new Error("Content script not responding. Please refresh the page.");
        }

        if (!response || typeof response.text !== "string") {
            hideLoading();
            throw new Error("Invalid response from content script.");
        }

        const chapterText = response.text.trim();
        if (!chapterText) {
            hideLoading();
            throw new Error("No text found on page. Layout might be unsupported.");
        }
        console.log(`[Goldfish AI] Text received. Length: ${chapterText.length}`);

        // 2. Fetch context
        showLoading("Gathering character context...");
        console.log("[Goldfish AI] Step 2: Fetching character context from backend...");
        const existingChars = await apiService.getCharactersByNovelSlug(activeNovelSlug);
        console.log(`[Goldfish AI] Context received. Characters: ${existingChars.length}`);

        // 3. Call AI
        showLoading("AI is analyzing the chapter...");
        console.log("[Goldfish AI] Step 3: Calling AI Service...");
        const extractions = await aiService.extractCharacters(chapterText, existingChars);
        console.log(`[Goldfish AI] AI returned ${extractions.length} extractions.`);
        
        // Log to page console for user inspection using the new message type
        browser.tabs.sendMessage(tabId, {
            type: "LOG_DATA",
            label: "Raw AI Extractions",
            data: extractions,
            useTable: true
        }).catch(() => {});

        if (extractions.length === 0) {
            hideLoading();
            showAlert("AI scanned the chapter but found no relevant character updates.");
            return;
        }

        // 4. Show structured results
        console.log("[Goldfish AI] Step 4: Sending results to modal...");
        await browser.tabs.sendMessage(tabId, {
            type: "SHOW_SCAN_RESULTS",
            extractions,
            isPreview,
            novelSlug: activeNovelSlug
        });
        console.log("[Goldfish AI] Scan complete.");

    } catch (error) {
        hideLoading();
        console.error("[Goldfish AI] ERROR during scan lifecycle:", error);
        showAlert(`AI Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

initContextMenu();
