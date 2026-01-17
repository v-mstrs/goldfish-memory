import browser from "webextension-polyfill";
import { getCharactersByNovel, addCharacter } from "./db/crud";
import "./contextMenu";

/**
 * Main message listener for the background script.
 * Handles database queries and character creation.
 */
browser.runtime.onMessage.addListener(async (message: any) => {
    switch (message.type) {
        case "PING":
            return { status: "pong" };
        case "GET_CHARACTERS":
            try {
                return await getCharactersByNovel(message.novelId);
            } catch (error) {
                console.error("[Goldfish] Error fetching characters:", error);
                return [];
            }
        case "ADD_CHARACTER":
            try {
                await addCharacter(
                    message.novelId,
                    message.name,
                    message.aliases || [],
                    message.description || "",
                    message.imageUrl || ""
                );
                return { success: true };
            } catch (error) {
                console.error("[Goldfish] Error adding character:", error);
                return { success: false, error: (error as Error).message };
            }

        default:
            return null;
    }
});