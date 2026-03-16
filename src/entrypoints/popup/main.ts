import { apiService } from "../../services/api";
import { browser } from 'wxt/browser';

interface HighlightDisplaySettings {
    fontWeight: "400" | "600" | "700";
    fontStyle: "normal" | "italic";
    underlineStyle: "none" | "solid" | "dashed" | "dotted" | "wavy";
}

const DEFAULT_DISPLAY_SETTINGS: HighlightDisplaySettings = {
    fontWeight: "700",
    underlineStyle: "wavy",
    fontStyle: "normal"
};

/**
 * GoldfishPopup handles all UI interactions within the extension popup.
 */
class GoldfishPopup {
    private ui = {
        header: {
            optionsBtn: document.getElementById("optionsBtn") as HTMLButtonElement,
        },
        settings: {
            textStyle: document.getElementById("displayTextStyle") as HTMLSelectElement,
            underline: document.getElementById("displayUnderlineStyle") as HTMLSelectElement,
            previewWord: document.getElementById("highlightPreviewWord") as HTMLSpanElement,
            status: document.getElementById("displaySettingsStatus") as HTMLDivElement,
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
            color: document.getElementById("charHighlightColor") as HTMLInputElement,
            palette: document.getElementById("charHighlightPalette") as HTMLDivElement,
            saveBtn: document.getElementById("addCharBtn") as HTMLButtonElement,
        },
        logo: {
            img: document.getElementById("rescanPage") as HTMLImageElement
        }
    };

    private toastTimeout: ReturnType<typeof setTimeout> | null = null;
    private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    private settingsStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        await this.verifyBackgroundConnection();
        await this.refreshNovelDropdown();
        await this.loadDisplaySettings();
        // Small delay to ensure browser focus isn't interrupted by storage loading
        setTimeout(() => this.syncDraft("load"), 100);
        this.setupListeners();
    }

    private async verifyBackgroundConnection() {
        try {
            const response = await browser.runtime.sendMessage({ type: "PING" });
            console.log("[Goldfish] Background ping:", response);
        } catch (error) {
            console.error("[Goldfish] Background unreachable:", error);
            this.showStatus("Background script is not reachable", "error");
        }
    }

    /**
     * Bind UI events to handlers.
     */
    private setupListeners() {
        this.ui.novel.saveBtn.addEventListener("click", () => this.handleSaveNovel());
        this.ui.char.saveBtn.addEventListener("click", () => this.handleSaveCharacter());
        this.ui.novel.toggleBtn.addEventListener("click", () => this.toggleDrawer());
        // Persist novel selection immediately
        this.ui.novel.select.addEventListener("change", () => {
            browser.storage.local.set({ activeNovelSlug: this.ui.novel.select.value });
        });

        // Persist draft with debounce to avoid blocking the UI thread
        const draftFields = [
            this.ui.char.name, 
            this.ui.char.aliases, 
            this.ui.char.desc, 
            this.ui.char.img,
            this.ui.char.color
        ];
        
        draftFields.forEach(el => {
            el.addEventListener("input", () => this.syncDraft("save"));
        });

        this.ui.char.palette.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const swatch = target.closest(".color-swatch") as HTMLButtonElement | null;
            if (!swatch) return;

            this.setHighlightColor(swatch.dataset.color || "#c5daff");
            void this.syncDraft("save");
        });

        this.ui.char.color.addEventListener("change", () => {
            this.setHighlightColor(this.ui.char.color.value);
            void this.syncDraft("save");
        });

        [
            this.ui.settings.textStyle,
            this.ui.settings.underline,
        ].forEach((el) => {
            el.addEventListener("input", () => {
                void this.saveDisplaySettings();
            });
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
                    charImg: this.ui.char.img.value,
                    charColor: this.ui.char.color.value
                };
                await browser.storage.local.set({ draft: state });
            }, 500);
        } else {
            const data = await browser.storage.local.get(["draft", "activeNovelSlug"]);
            if (data.activeNovelSlug) this.ui.novel.select.value = data.activeNovelSlug as string;

            const s = data.draft as DraftState;
            if (s) {
                this.ui.char.name.value = s.charName || "";
                this.ui.char.aliases.value = s.charAliases || "";
                this.ui.char.desc.value = s.charDesc || "";
                this.ui.char.img.value = s.charImg || "";
                this.setHighlightColor(s.charColor || "#c5daff");
            }
        }
    }

    private setHighlightColor(value: string) {
        const normalized = this.normalizeHexColor(value) || "#c5daff";
        this.ui.char.color.value = normalized;

        this.ui.char.palette.querySelectorAll(".color-swatch").forEach((swatch) => {
            const button = swatch as HTMLButtonElement;
            button.classList.toggle("selected", button.dataset.color === normalized);
        });

        this.renderHighlightPreview(this.readDisplaySettingsFromForm());
    }

    private normalizeHexColor(value: string): string | null {
        const trimmed = value.trim();
        if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
        return null;
    }

    private async loadDisplaySettings() {
        const { highlightDisplaySettings } = await browser.storage.local.get("highlightDisplaySettings");
        const settings = this.withDisplayDefaults(highlightDisplaySettings as Partial<HighlightDisplaySettings> | undefined);

        this.ui.settings.textStyle.value = `${settings.fontWeight}-${settings.fontStyle}`;
        this.ui.settings.underline.value = settings.underlineStyle;
        this.renderHighlightPreview(settings);
    }

    private async saveDisplaySettings() {
        const settings = this.readDisplaySettingsFromForm();

        await browser.storage.local.set({ highlightDisplaySettings: settings });
        this.renderHighlightPreview(settings);
        this.showSettingsSaved();
        await this.handleRescan();
    }

    private readDisplaySettingsFromForm(): HighlightDisplaySettings {
        const [fontWeight, fontStyle] = this.ui.settings.textStyle.value.split("-") as [
            HighlightDisplaySettings["fontWeight"],
            HighlightDisplaySettings["fontStyle"]
        ];

        return {
            fontWeight,
            fontStyle,
            underlineStyle: this.ui.settings.underline.value as HighlightDisplaySettings["underlineStyle"],
        };
    }

    private withDisplayDefaults(value?: Partial<HighlightDisplaySettings>): HighlightDisplaySettings {
        return {
            fontWeight: value?.fontWeight || DEFAULT_DISPLAY_SETTINGS.fontWeight,
            fontStyle: value?.fontStyle || DEFAULT_DISPLAY_SETTINGS.fontStyle,
            underlineStyle: value?.underlineStyle || DEFAULT_DISPLAY_SETTINGS.underlineStyle,
        };
    }

    private showSettingsSaved() {
        if (this.settingsStatusTimeout) clearTimeout(this.settingsStatusTimeout);
        this.ui.settings.status.textContent = "Saved";
        this.ui.settings.status.classList.remove("hidden");
        this.settingsStatusTimeout = setTimeout(() => {
            this.ui.settings.status.classList.add("hidden");
        }, 1200);
    }

    private renderHighlightPreview(settings: HighlightDisplaySettings) {
        const preview = this.ui.settings.previewWord;
        const previewColor = this.normalizeHexColor(this.ui.char.color.value) || "#c5daff";

        preview.style.fontWeight = settings.fontWeight;
        preview.style.fontStyle = settings.fontStyle;
        preview.style.color = previewColor;
        preview.style.textDecoration = settings.underlineStyle === "none"
            ? "none"
            : `${previewColor} ${settings.underlineStyle} underline`;
        preview.style.textDecorationColor = previewColor;
    }

    private toggleDrawer(forceHidden?: boolean) {
        const shouldHide = typeof forceHidden === "boolean"
            ? forceHidden
            : !this.ui.novel.drawer.classList.contains("hidden");

        this.setDrawerHidden(shouldHide);
    }

    private setDrawerHidden(hidden: boolean) {
        this.ui.novel.drawer.classList.toggle("hidden", hidden);
        this.ui.novel.arrow.textContent = hidden ? "▼" : "▲";

        if (!hidden) {
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

    private async refreshNovelDropdown(selectSlug?: string) {
        const novels = await apiService.getAllNovels();
        this.ui.novel.select.length = 1; // Keep placeholder

        novels.forEach(novel => {
            this.ui.novel.select.appendChild(new Option(novel.title, novel.slug));
        });

        if (selectSlug) this.ui.novel.select.value = selectSlug;
    }

    private async handleSaveNovel() {
        const title = this.ui.novel.name.value.trim();
        if (!title) return this.showStatus("Novel title required", "error");

        try {
            this.ui.novel.saveBtn.disabled = true;
            const novel = await apiService.addNovel(title);
            this.ui.novel.name.value = "";
            this.toggleDrawer(true);
            await this.refreshNovelDropdown(novel.slug);
            await browser.storage.local.set({ activeNovelSlug: novel.slug });
            this.showStatus("✔ Novel added");
        } catch (err) {
            this.showStatus("Error saving novel", "error");
        } finally {
            this.ui.novel.saveBtn.disabled = false;
        }
    }

    private async handleSaveCharacter() {
        const novelSlug = this.ui.novel.select.value;
        const name = this.ui.char.name.value.trim();
        const desc = this.ui.char.desc.value.trim();
        const img = this.ui.char.img.value.trim();
        const highlightColor = this.normalizeHexColor(this.ui.char.color.value) || "#c5daff";
        const aliases = this.ui.char.aliases.value.split(",").map(a => a.trim()).filter(Boolean);

        if (!novelSlug) return this.showStatus("Select a novel first!", "error");
        if (!name || !desc) return this.showStatus("Name and description required", "error");

        try {
            this.ui.char.saveBtn.disabled = true;
            await apiService.addCharacter(novelSlug, {
                name, 
                aliases, 
                description: desc, 
                imageUrl: img,
                highlightColor
            });

            const originalText = this.ui.char.saveBtn.textContent;
            this.ui.char.saveBtn.textContent = "✓ Saved!";
            this.ui.char.saveBtn.classList.add("success-state");

            // Reset form
            [this.ui.char.name, this.ui.char.aliases, this.ui.char.desc, this.ui.char.img].forEach(i => i.value = "");
            this.setHighlightColor("#c5daff");
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
    charColor?: string;
}

type DraftMode = "save" | "load";

// Start the popup logic
document.addEventListener("DOMContentLoaded", () => new GoldfishPopup());
