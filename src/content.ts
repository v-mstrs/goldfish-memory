import { getActiveConfig } from "./sites";
import { getCharactersByNovel } from "./db/crud";
import { type DraftState } from "./types";
import browser from "webextension-polyfill";

console.log("CONTENT SCRIPT LOADED");

async function processSiteContent() {
    const storage = await browser.storage.local.get('draft');
    const draft = storage.draft as DraftState;
    
    if (!draft?.selectedNovel) {
        console.log("No novel selected in popup.");
        return;
    }

    const novelId = parseInt(draft.selectedNovel);
    
    if (isNaN(novelId)) {
        console.error("Invalid novel ID in storage");
        return;
    }

    console.log(`Loading characters for novel ID: ${novelId}`);

    // Note: Direct DB access from content script accesses the PAGE'S IndexedDB, not the extension's.
    // This might return empty results unless the DB is shared or messaging is used.
    const characters = await getCharactersByNovel(novelId);
    console.log("Retrieved characters:", characters);
    
    return;
}

const init = async () => {
    const config = getActiveConfig();

    if (!config) {
        console.log("SITE NOT IN SITES.TS")
        return;
    }

    console.log(`[Goldfish] Scraper starting for: ${config.hostname}`);

    await processSiteContent();
}

init()