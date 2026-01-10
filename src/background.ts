import browser from "webextension-polyfill";
import { getCharactersByNovel, addCharacter } from "./db/crud";
import "./contextMenu";

console.log("[Goldfish] Background script starting...");

browser.runtime.onMessage.addListener(async (message: any) => {
    console.log("Background received message:", message);
    if (message.type === 'GET_CHARACTERS') {
        try {
            const characters = await getCharactersByNovel(message.novelId);
            console.log(`Found ${characters.length} characters for novel ${message.novelId}`);
            return characters;
        } catch (error) {
            console.error("Background error fetching characters:", error);
            return [];
        }
    } else if (message.type === 'ADD_CHARACTER') {
        try {
            await addCharacter(
                message.novelId,
                message.name,
                message.aliases || [],
                message.description || "",
                message.imageUrl || ""
            );
            console.log("Character added successfully.");
            return { success: true };
        } catch (error) {
            console.error("Error adding character:", error);
            return { success: false, error: (error as Error).message };
        }
    }
});