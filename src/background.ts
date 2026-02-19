import browser from "webextension-polyfill";
import { dbService } from "./services/database";
import { backupService } from "./services/backup";
import "./contextMenu";

const ALARM_NAME = "auto-backup";

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
                return await dbService.getCharactersByNovel(message.novelId);

            case "ADD_CHARACTER":
                await dbService.addCharacter({
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

/**
 * Alarm listener for automated backups.
 */
browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await backupService.performAutoBackup();
    }
});

/**
 * Storage change listener to update settings dynamically.
 */
browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.backupInterval) {
        backupService.scheduleAutoBackup();
    }
});

// Initial startup logic
const init = async () => {
    console.log("[Goldfish] Background script initializing...");
    await backupService.scheduleAutoBackup();
};

init();
