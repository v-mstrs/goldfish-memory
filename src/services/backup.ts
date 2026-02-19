import { dbService } from "./database";
import browser from "webextension-polyfill";

const ALARM_NAME = "auto-backup";

export class BackupService {
    /**
     * Schedules the auto-backup alarm based on user settings.
     * Fixes the bug where backups trigger on every browser startup.
     */
    async scheduleAutoBackup() {
        const { backupInterval, lastBackupTime } = await browser.storage.local.get([
            "backupInterval",
            "lastBackupTime"
        ]);

        // Always clear existing alarm before rescheduling
        await browser.alarms.clear(ALARM_NAME);

        if (!backupInterval || backupInterval === "off") {
            console.log("[Goldfish] Auto-backup is disabled.");
            return;
        }

        let intervalInMinutes = 60 * 24; // Daily
        if (backupInterval === "weekly") intervalInMinutes = 60 * 24 * 7;

        const now = Date.now();
        const lastBackup = (lastBackupTime as number) || 0;
        const timeSinceLastBackup = (now - lastBackup) / (1000 * 60);

        // If we missed a backup or it's overdue, start soon (1 min delay).
        // Otherwise, wait for the remaining time of the interval.
        let delayInMinutes = intervalInMinutes - timeSinceLastBackup;
        if (delayInMinutes <= 0) delayInMinutes = 1;

        browser.alarms.create(ALARM_NAME, {
            delayInMinutes,
            periodInMinutes: intervalInMinutes
        });
        
        console.log(`[Goldfish] Auto-backup scheduled. Next run in ~${Math.round(delayInMinutes)} minutes.`);
    }

    /**
     * Executes the actual backup process.
     */
    async performAutoBackup() {
        let url: string | null = null;
        try {
            const backup = await dbService.getBackupData();
            const json = JSON.stringify(backup, null, 2);
            
            const blob = new Blob([json], { type: "application/json" });
            url = URL.createObjectURL(blob);
            
            const date = new Date().toISOString().split("T")[0];
            
            await browser.downloads.download({
                url,
                filename: `goldfish_autobackup_${date}.json`,
                conflictAction: "uniquify",
                saveAs: false 
            });

            await browser.storage.local.set({ lastBackupTime: Date.now() });
            console.log("[Goldfish] Auto-backup completed.");
        } catch (error) {
            console.error("[Goldfish] Auto-backup failed:", error);
        } finally {
            if (url) {
                // Short delay to ensure download starts before revocation
                setTimeout(() => URL.revokeObjectURL(url!), 15000);
            }
        }
    }

    /**
     * Manual export for the user (via popup).
     */
    async manualExport() {
        const backup = await dbService.getBackupData();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `goldfish_backup_${new Date().toISOString().split("T")[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    /**
     * Manual import from a file.
     */
    async manualImport(jsonData: any) {
        if (!jsonData.data || !Array.isArray(jsonData.data.novels) || !Array.isArray(jsonData.data.characters)) {
            throw new Error("Invalid backup file format");
        }
        await dbService.importData(jsonData.data);
    }
}

export const backupService = new BackupService();
