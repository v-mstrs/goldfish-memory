import browser from "webextension-polyfill";
import { MATCH_PATTERNS } from "./sites";

console.log("Context menu script loading...");

// Polyfill/Firefox compatibility: prefer 'menus', fallback to 'contextMenus'
const menusApi = browser.menus || browser.contextMenus;

try {
    if (menusApi) {
        console.log("Using menus API:", menusApi === browser.menus ? "browser.menus" : "browser.contextMenus");
        
        browser.runtime.onInstalled.addListener(() => {
            console.log("Installing context menu...");
            menusApi.removeAll().then(() => {
                menusApi.create({
                    id: "add-character",
                    title: "Add Character",
                    contexts: ["selection"],
                    documentUrlPatterns: MATCH_PATTERNS,
                    icons: {
                        "16": "/assets/goldfish-white.png",
                        "32": "/assets/goldfish-white.png"
                    }
                });
                console.log("Context menu item created for patterns:", MATCH_PATTERNS);
            }).catch((err) => {
                console.error("Error creating context menu:", err);
            });
        });

        menusApi.onClicked.addListener((info, tab) => {
            if (info.menuItemId === "add-character" && tab?.id) {
                const selectedText = info.selectionText;
                console.log("Background: sending character to page:", selectedText);
                
                // Send to the content script in the current tab
                browser.tabs.sendMessage(tab.id, {
                    type: "CONTEXT_MENU_ADD_CHARACTER",
                    text: selectedText
                }).catch(err => {
                    console.warn("Could not send message to tab (page might need refresh):", err);
                });
            }
        });
        console.log("Context menu listeners attached.");
    } else {
        console.warn("Neither browser.menus nor browser.contextMenus API is available.");
    }
} catch (error) {
    console.error("Critical error in contextMenu.ts:", error);
}