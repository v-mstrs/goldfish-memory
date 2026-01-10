import browser from "webextension-polyfill";
import { MATCH_PATTERNS } from "./sites";

const MENU_ID = "add-character";
const menusApi = browser.menus || browser.contextMenus;

/**
 * Initializes the context menu for character creation.
 * Scoped only to supported novel sites.
 */
function initContextMenu() {
    if (!menusApi) return;

    browser.runtime.onInstalled.addListener(() => {
        menusApi.removeAll().then(() => {
            menusApi.create({
                id: MENU_ID,
                title: "Add Character",
                contexts: ["selection"],
                documentUrlPatterns: MATCH_PATTERNS
            });
        }).catch(err => console.error("[Goldfish] Context menu setup failed:", err));
    });

    menusApi.onClicked.addListener((info, tab) => {
        if (info.menuItemId === MENU_ID && tab?.id) {
            browser.tabs.sendMessage(tab.id, {
                type: "CONTEXT_MENU_ADD_CHARACTER",
                text: info.selectionText
            }).catch(() => {
                /* Ignore errors if content script isn't ready */
            });
        }
    });
}

initContextMenu();
