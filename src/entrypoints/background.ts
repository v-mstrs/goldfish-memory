
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
                    return await apiService.getCharactersByNovelSlug(message.novelSlug);

                case "ADD_CHARACTER":
                    await apiService.addCharacter(message.novelSlug, {
                        name: message.name,
                        aliases: message.aliases || [],
                        description: message.description || "",
                        imageUrl: message.imageUrl || "",
                        highlightColor: message.highlightColor || ""
                    });
                    return { success: true };

                case "COMMIT_AI_SCAN":
                    for (const ext of message.extractions) {
                        const payload = {
                            name: ext.name,
                            aliases: ext.aliases,
                            description: ext.description,
                            family: ext.family,
                            alliances: ext.alliances,
                            abilities: ext.abilities,
                            highlightColor: "none" // Default
                        };

                        if (ext.match_id) {
                            const existingChars = await apiService.getCharactersByNovelSlug(message.novelSlug);
                            const existing = existingChars.find((c: any) => c.id === ext.match_id);
                            if (existing) {
                                const mergedAliases = Array.from(new Set([...existing.aliases, ...ext.aliases]));
                                await apiService.updateCharacter(message.novelSlug, ext.match_id, {
                                    ...payload,
                                    aliases: mergedAliases,
                                    highlightColor: existing.highlightColor || "#c5daff",
                                    imageUrl: existing.imageUrl || ""
                                });
                            }
                        } else {
                            await apiService.addCharacter(message.novelSlug, payload);
                        }
                    }
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
