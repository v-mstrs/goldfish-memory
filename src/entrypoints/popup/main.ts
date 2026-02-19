import { dbService } from "../../services/database";
import { backupService } from "../../services/backup";
import { browser } from 'wxt/browser';

/**
 * GoldfishPopup handles all UI interactions within the extension popup.
 */
class GoldfishPopup {
    private ui = {
        header: {
            optionsBtn: document.getElementById("optionsBtn") as HTMLButtonElement,
        },
        novel: {
            select: document.getElementById("novelSelect") as HTMLSelectElement,
            name: document.getElementById("newNovel") as HTMLInputElement,
            saveBtn: document.getElementById("saveNovelBtn") as HTMLButtonElement,
            toggleBtn: document.getElementById("toggleNovelDrawer") as HTMLButtonElement,
            toast: document.getElementById("novelToast") as HTMLDivElement,
            arrow: document.getElementById("arrow") as HTMLSpanElement,
            drawer: document.getElementById("novelAddDrawer") as HTMLDivElement,
        },
        char: {
            name: document.getElementById("charName") as HTMLInputElement,
            aliases: document.getElementById("charAliases") as HTMLInputElement,
            desc: document.getElementById("charDesc") as HTMLTextAreaElement,
            img: document.getElementById("charImgUrl") as HTMLInputElement,
            saveBtn: document.getElementById("addCharBtn") as HTMLButtonElement,
        },
        storage: {
            exportBtn: document.getElementById("exportBtn") as HTMLButtonElement,
            importBtn: document.getElementById("importBtn") as HTMLButtonElement,
            backupSelect: document.getElementById("backupSelect") as HTMLSelectElement,
        },
        logo: {
            img: document.getElementById("rescanPage") as HTMLImageElement
        }
    };

    private toastTimeout: ReturnType<typeof setTimeout> | null = null;
    private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        await this.refreshNovelDropdown();
        // Small delay to ensure browser focus isn't interrupted by storage loading
        setTimeout(() => this.syncDraft("load"), 100);
        this.setupListeners();
    }

    /**
     * Bind UI events to handlers.
     */
    private setupListeners() {
        this.ui.novel.saveBtn.addEventListener("click", () => this.handleSaveNovel());
        this.ui.char.saveBtn.addEventListener("click", () => this.handleSaveCharacter());
        this.ui.novel.toggleBtn.addEventListener("click", () => this.toggleDrawer());
        this.ui.storage.exportBtn.addEventListener("click", () => backupService.manualExport());
        this.ui.storage.importBtn.addEventListener("click", () => this.handleImport());

        this.ui.storage.backupSelect.addEventListener("change", () => {
            browser.storage.local.set({ backupInterval: this.ui.storage.backupSelect.value });
        });

        // Persist novel selection immediately
        this.ui.novel.select.addEventListener("change", () => {
            browser.storage.local.set({ activeNovelId: this.ui.novel.select.value });
        });

        // Persist draft with debounce to avoid blocking the UI thread
        const draftFields = [
            this.ui.char.name, 
            this.ui.char.aliases, 
            this.ui.char.desc, 
            this.ui.char.img
        ];
        
        draftFields.forEach(el => {
            el.addEventListener("input", () => this.syncDraft("save"));
        });

        // Enter key support for quick saving
        this.ui.novel.name.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.handleSaveNovel();
            }
        });
        this.ui.char.name.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.handleSaveCharacter();
            }
        });

        this.ui.logo.img.addEventListener("click", () => this.handleRescan());
        this.ui.header.optionsBtn.addEventListener("click", () => this.openOptions());
    }

    /**
     * Saves or loads the current form state to/from storage.
     */
    private async syncDraft(mode: DraftMode) {
        if (mode === "save") {
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            
            this.debounceTimeout = setTimeout(async () => {
                const state: DraftState = {
                    charName: this.ui.char.name.value,
                    charAliases: this.ui.char.aliases.value,
                    charDesc: this.ui.char.desc.value,
                    charImg: this.ui.char.img.value
                };
                await browser.storage.local.set({ draft: state });
            }, 500);
        } else {
            const data = await browser.storage.local.get(["draft", "activeNovelId", "backupInterval"]);
            if (data.activeNovelId) this.ui.novel.select.value = data.activeNovelId as string;
            if (data.backupInterval) this.ui.storage.backupSelect.value = data.backupInterval as string;

            const s = data.draft as DraftState;
            if (s) {
                this.ui.char.name.value = s.charName || "";
                this.ui.char.aliases.value = s.charAliases || "";
                this.ui.char.desc.value = s.charDesc || "";
                this.ui.char.img.value = s.charImg || "";
            }
        }
    }

    private toggleDrawer(forceState?: boolean) {
        const isHidden = this.ui.novel.drawer.classList.toggle("hidden", forceState);
        this.ui.novel.arrow.textContent = isHidden ? "▼" : "▲";
        if (!isHidden) {
            // Delay focus slightly to allow CSS transitions or layout updates
            setTimeout(() => this.ui.novel.name.focus(), 50);
        }
    }

    /**
     * Displays a temporary notification toast.
     */
    private showStatus(message: string, type: "success" | "error" = "success") {
        if (this.toastTimeout) clearTimeout(this.toastTimeout);

        this.ui.novel.toast.textContent = message;
        this.ui.novel.toast.classList.remove("hidden");

        const isError = type === "error";
        Object.assign(this.ui.novel.toast.style, {
            background: isError ? "#441a1a" : "#1f3d2b",
            borderColor: isError ? "#ff5f5f" : "#28a745",
            color: isError ? "#ffbaba" : "#8ff0b0"
        });

        this.toastTimeout = setTimeout(() => this.ui.novel.toast.classList.add("hidden"), 2500);
    }

    private async refreshNovelDropdown(selectId?: number) {
        const novels = await dbService.getAllNovels();
        this.ui.novel.select.length = 1; // Keep placeholder

        novels.forEach(novel => {
            this.ui.novel.select.appendChild(new Option(novel.title, novel.id!.toString()));
        });

        if (selectId) this.ui.novel.select.value = selectId.toString();
    }

    private async handleSaveNovel() {
        const title = this.ui.novel.name.value.trim();
        if (!title) return this.showStatus("Novel title required", "error");

        try {
            this.ui.novel.saveBtn.disabled = true;
            const newId = await dbService.addNovel(title);
            this.ui.novel.name.value = "";
            this.toggleDrawer(true);
            await this.refreshNovelDropdown(newId);
            this.showStatus("✔ Novel added");
        } catch (err) {
            this.showStatus("Error saving novel", "error");
        } finally {
            this.ui.novel.saveBtn.disabled = false;
        }
    }

    private async handleSaveCharacter() {
        const novelId = parseInt(this.ui.novel.select.value);
        const name = this.ui.char.name.value.trim();
        const desc = this.ui.char.desc.value.trim();
        const img = this.ui.char.img.value.trim();
        const aliases = this.ui.char.aliases.value.split(",").map(a => a.trim()).filter(Boolean);

        if (isNaN(novelId)) return this.showStatus("Select a novel first!", "error");
        if (!name || !desc) return this.showStatus("Name and description required", "error");

        try {
            this.ui.char.saveBtn.disabled = true;
            await dbService.addCharacter({ 
                novelId, 
                name, 
                aliases, 
                description: desc, 
                imageUrl: img 
            });

            const originalText = this.ui.char.saveBtn.textContent;
            this.ui.char.saveBtn.textContent = "✓ Saved!";
            this.ui.char.saveBtn.classList.add("success-state");

            // Reset form
            [this.ui.char.name, this.ui.char.aliases, this.ui.char.desc, this.ui.char.img].forEach(i => i.value = "");
            await browser.storage.local.remove("draft");

            setTimeout(() => {
                this.ui.char.saveBtn.textContent = originalText;
                this.ui.char.saveBtn.classList.remove("success-state");
                this.ui.char.saveBtn.disabled = false;
            }, 2000);
        } catch (err) {
            this.showStatus("Failed to save character", "error");
            this.ui.char.saveBtn.disabled = false;
        }
    }

    private handleImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const json = JSON.parse(text);

                if (confirm("This will overwrite your current database. Continue?")) {
                    await backupService.manualImport(json);
                    this.showStatus("✔ Database imported!");

                    await this.refreshNovelDropdown();
                    this.ui.novel.select.value = "";
                    await browser.storage.local.remove(["draft", "activeNovelId"]);
                    await this.syncDraft("load");
                }
            } catch (err) {
                console.error("[Popup] Import error:", err);
                this.showStatus("Import failed", "error");
            }
        };
        input.click();
    }

    private async handleRescan() {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
            this.ui.logo.img.style.transform = "rotate(360deg)";
            this.ui.logo.img.style.transition = "transform 0.5s ease";

            try {
                await browser.tabs.sendMessage(tabs[0].id, { type: "RESCAN_PAGE" });
            } catch (err) {
                // Ignore if content script isn't ready
            }

            setTimeout(() => {
                this.ui.logo.img.style.transform = "none";
                this.ui.logo.img.style.transition = "none";
            }, 500);
        }
    }

    private openOptions() {
        // Updated to use WXT's output filename
        browser.tabs.create({ url: browser.runtime.getURL("/popup.html") });
        window.close();
    }
}

interface DraftState {
    selectedNovel?: string;
    charName?: string;
    charAliases?: string;
    charDesc?: string;
    charImg?: string;
}

type DraftMode = "save" | "load";

// Start the popup logic
document.addEventListener("DOMContentLoaded", () => new GoldfishPopup());
