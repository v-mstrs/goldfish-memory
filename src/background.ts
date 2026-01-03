import browser from "webextension-polyfill";
import { getCharactersByNovel } from "./db/crud";

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
    }
});