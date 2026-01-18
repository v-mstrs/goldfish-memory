import browser from "webextension-polyfill";
import { getCharactersByNovel, addCharacter, generateBackupData } from "./db/crud";
import "./contextMenu";

const ALARM_NAME = "auto-backup";

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

// --- Auto Backup Logic ---

async function scheduleAlarm() {
    const data = await browser.storage.local.get("backupInterval");
    const interval = data.backupInterval as string; // 'daily', 'weekly', 'off'

    await browser.alarms.clear(ALARM_NAME);

    if (!interval || interval === "off") return;

    let periodInMinutes = 60 * 24; // Daily default
    if (interval === "weekly") periodInMinutes = 60 * 24 * 7;
    
    // Create alarm
    browser.alarms.create(ALARM_NAME, {
        delayInMinutes: 1, // Start soon after setting
        periodInMinutes
    });
}

browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        let url: string | null = null;
        try {
            const backup = await generateBackupData();
            const json = JSON.stringify(backup, null, 2);
            
            // Use Blob + URL.createObjectURL for Firefox compatibility
            const blob = new Blob([json], { type: "application/json" });
            url = URL.createObjectURL(blob);
            
            const date = new Date().toISOString().split("T")[0];
            
            await browser.downloads.download({
                url: url,
                filename: `goldfish_autobackup_${date}.json`,
                conflictAction: "uniquify",
                saveAs: false 
            });
            console.log("[Goldfish] Auto-backup completed.");
        } catch (error) {
            console.error("[Goldfish] Auto-backup failed:", error);
        } finally {
            // Clean up the object URL to prevent memory leaks
            if (url) {
                // Short delay to ensure download starts before revocation
                setTimeout(() => URL.revokeObjectURL(url!), 10000);
            }
        }
    }
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.backupInterval) {
        scheduleAlarm();
    }
});

// Initial check on startup
scheduleAlarm();