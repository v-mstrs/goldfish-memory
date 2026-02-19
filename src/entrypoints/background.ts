import { defineBackground } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { apiService } from "../services/api";
import "../contextMenu";

export default defineBackground(() => {
    /**
     * Main message listener for the background script.
     * Handles database queries and character creation.
     */
    browser.runtime.onMessage.addListener(async (message: any) => {
        try {
            switch (message.type) {
                case "PING":
                    return { status: "pong" };

                case "GET_CHARACTERS":
                    return await apiService.getCharactersByNovel(message.novelId);

                case "ADD_CHARACTER":
                    await apiService.addCharacter({
                        novelId: message.novelId,
                        name: message.name,
                        aliases: message.aliases || [],
                        description: message.description || "",
                        imageUrl: message.imageUrl || ""
                    });
                    return { success: true };

                default:
                    return null;
            }
        } catch (error) {
            console.error(`[Goldfish] Error handling message ${message.type}:`, error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Initial startup logic
    console.log("[Goldfish] Background script initializing...");
});
