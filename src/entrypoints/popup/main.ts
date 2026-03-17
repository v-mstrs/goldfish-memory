import { apiService } from "../../services/api";
import { browser } from "wxt/browser";

interface HighlightDisplaySettings {
    fontSizePx: number;
    fontWeight: "400" | "600" | "700";
    fontStyle: "normal" | "italic";
    underlineStyle: "none" | "solid" | "dashed" | "dotted" | "wavy";
    highlightLimitPerChar: number;
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

const DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR = 5;
const MIN_HIGHLIGHT_LIMIT_PER_CHAR = 1;
const MAX_HIGHLIGHT_LIMIT_PER_CHAR = 50;
const DEFAULT_HIGHLIGHT_FONT_SIZE_PX = 16;
const MIN_HIGHLIGHT_FONT_SIZE_PX = 10;
const MAX_HIGHLIGHT_FONT_SIZE_PX = 36;
const DEFAULT_HIGHLIGHT_COLOR = "#c5daff";

const DEFAULT_DISPLAY_SETTINGS: HighlightDisplaySettings = {
    fontSizePx: DEFAULT_HIGHLIGHT_FONT_SIZE_PX,
    fontWeight: "700",
    underlineStyle: "wavy",
    fontStyle: "normal",
    highlightLimitPerChar: DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR,
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

class GoldfishPopup {
    private ui = {
        header: {
            optionsBtn: document.getElementById("optionsBtn") as HTMLButtonElement,
        },
        settings: {
            apiBaseUrl: document.getElementById("apiBaseUrlSetting") as HTMLInputElement,
            fontSize: document.getElementById("displayFontSize") as HTMLInputElement,
            textStyle: document.getElementById("displayTextStyle") as HTMLSelectElement,
            underline: document.getElementById("displayUnderlineStyle") as HTMLSelectElement,
            highlightLimit: document.getElementById("displayHighlightLimit") as HTMLInputElement,
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
        void this.init();
    }

    private async init() {
        this.setupListeners();
        try {
            await this.verifyBackgroundConnection();
            await this.refreshNovelDropdown();
            await this.loadBackendSettings();
            await this.loadDisplaySettings();
            await this.syncDraft("load");
        } catch (error) {
            console.error("[Goldfish] Initialization error:", error);
        }
    }

    private async verifyBackgroundConnection() {
        try {
            const response = await browser.runtime.sendMessage({ type: "PING" });
            console.log("[Goldfish] Background ping:", response);
        } catch (error) {
            console.error("[Goldfish] Background unreachable:", error);
        }
    }

    private setupListeners() {
        this.ui.novel.saveBtn.addEventListener("click", () => void this.handleSaveNovel());
        this.ui.char.saveBtn.addEventListener("click", () => void this.handleSaveCharacter());
        this.ui.novel.toggleBtn.addEventListener("click", () => this.toggleDrawer());
        this.ui.novel.select.addEventListener("change", () => void this.handleNovelSelectionChange());

        const draftFields = [
            this.ui.char.name,
            this.ui.char.aliases,
            this.ui.char.desc,
            this.ui.char.img,
            this.ui.char.color
        ];

        draftFields.forEach((el) => {
            el.addEventListener("input", () => void this.syncDraft("save"));
        });

        this.ui.char.palette.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const swatch = target.closest(".color-swatch") as HTMLButtonElement | null;
            if (!swatch) return;

            this.setHighlightColor(swatch.dataset.color || DEFAULT_HIGHLIGHT_COLOR);
            void this.syncDraft("save");
        });

        this.ui.char.color.addEventListener("input", () => {
            this.setHighlightColor(this.ui.char.color.value);
            void this.syncDraft("save");
        });

        this.ui.settings.apiBaseUrl.addEventListener("change", () => {
            void this.saveBackendSettings();
        });

        [
            this.ui.settings.fontSize,
            this.ui.settings.textStyle,
            this.ui.settings.underline,
            this.ui.settings.highlightLimit,
        ].forEach((el) => {
            el.addEventListener("input", () => {
                void this.saveDisplaySettings();
            });
        });

        this.ui.novel.name.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                void this.handleSaveNovel();
            }
        });

        this.ui.char.name.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                void this.handleSaveCharacter();
            }
        });

        this.ui.logo.img.addEventListener("click", () => void this.handleRescan());
        this.ui.header.optionsBtn.addEventListener("click", () => this.openOptions());
    }

    private async handleNovelSelectionChange() {
        await browser.storage.local.set({ activeNovelSlug: this.ui.novel.select.value });
    }

    private async syncDraft(mode: DraftMode) {
        if (mode === "save") {
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

            this.debounceTimeout = setTimeout(async () => {
                const state: DraftState = {
                    selectedNovel: this.ui.novel.select.value,
                    charName: this.ui.char.name.value,
                    charAliases: this.ui.char.aliases.value,
                    charDesc: this.ui.char.desc.value,
                    charImg: this.ui.char.img.value,
                    charColor: this.ui.char.color.value
                };
                await browser.storage.local.set({ draft: state });
            }, 500);
            return;
        }

        const data = await browser.storage.local.get(["draft", "activeNovelSlug"]);
        const activeNovelSlug = typeof data.activeNovelSlug === "string" ? data.activeNovelSlug : "";
        if (activeNovelSlug) {
            this.ui.novel.select.value = activeNovelSlug;
        }

        const draft = data.draft as DraftState | undefined;
        if (!draft) return;

        if (!activeNovelSlug && draft.selectedNovel) {
            this.ui.novel.select.value = draft.selectedNovel;
        }

        this.ui.char.name.value = draft.charName || "";
        this.ui.char.aliases.value = draft.charAliases || "";
        this.ui.char.desc.value = draft.charDesc || "";
        this.ui.char.img.value = draft.charImg || "";
        this.setHighlightColor(draft.charColor || DEFAULT_HIGHLIGHT_COLOR);
    }

    private setHighlightColor(value: string) {
        const normalized = this.normalizeHexColor(value) || DEFAULT_HIGHLIGHT_COLOR;
        this.ui.char.color.value = normalized;

        this.ui.char.palette.querySelectorAll(".color-swatch").forEach((swatch) => {
            const button = swatch as HTMLButtonElement;
            const isSelected = button.dataset.color === normalized;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
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
        this.ui.settings.fontSize.value = String(settings.fontSizePx);
        this.ui.settings.underline.value = settings.underlineStyle;
        this.ui.settings.highlightLimit.value = String(settings.highlightLimitPerChar);
        this.renderHighlightPreview(settings);
    }

    private async saveDisplaySettings() {
        const settings = this.readDisplaySettingsFromForm();

        await browser.storage.local.set({ highlightDisplaySettings: settings });
        this.renderHighlightPreview(settings);
        this.showSettingsSaved("Display settings saved");
        await this.handleRescan();
    }

    private async loadBackendSettings() {
        const { apiBaseUrl } = await browser.storage.local.get("apiBaseUrl");
        this.ui.settings.apiBaseUrl.value = typeof apiBaseUrl === "string" && apiBaseUrl.trim()
            ? apiBaseUrl.trim()
            : DEFAULT_API_BASE_URL;
    }

    private async saveBackendSettings() {
        const candidate = this.ui.settings.apiBaseUrl.value.trim();
        const normalized = candidate.replace(/\/+$/, "");

        if (!/^https?:\/\/.+/i.test(normalized)) {
            this.showSettingsSaved("Use a full URL like http://127.0.0.1:8000", true);
            this.ui.settings.apiBaseUrl.value = normalized || DEFAULT_API_BASE_URL;
            return;
        }

        await browser.storage.local.set({ apiBaseUrl: normalized });
        this.ui.settings.apiBaseUrl.value = normalized;
        this.showSettingsSaved("Backend URL saved");
        await this.handleRescan();
    }

    private readDisplaySettingsFromForm(): HighlightDisplaySettings {
        const [fontWeight, fontStyle] = this.ui.settings.textStyle.value.split("-") as [
            HighlightDisplaySettings["fontWeight"],
            HighlightDisplaySettings["fontStyle"]
        ];

        return {
            fontSizePx: this.normalizeFontSize(this.ui.settings.fontSize.value),
            fontWeight,
            fontStyle,
            underlineStyle: this.ui.settings.underline.value as HighlightDisplaySettings["underlineStyle"],
            highlightLimitPerChar: this.normalizeHighlightLimit(this.ui.settings.highlightLimit.value),
        };
    }

    private withDisplayDefaults(value?: Partial<HighlightDisplaySettings>): HighlightDisplaySettings {
        return {
            fontSizePx: this.normalizeFontSize(value?.fontSizePx),
            fontWeight: value?.fontWeight || DEFAULT_DISPLAY_SETTINGS.fontWeight,
            fontStyle: value?.fontStyle || DEFAULT_DISPLAY_SETTINGS.fontStyle,
            underlineStyle: value?.underlineStyle || DEFAULT_DISPLAY_SETTINGS.underlineStyle,
            highlightLimitPerChar: this.normalizeHighlightLimit(value?.highlightLimitPerChar),
        };
    }

    private normalizeFontSize(value: unknown): number {
        const candidate = typeof value === "number"
            ? value
            : Number.parseInt(String(value ?? ""), 10);

        if (!Number.isFinite(candidate)) {
            return DEFAULT_HIGHLIGHT_FONT_SIZE_PX;
        }

        return Math.min(
            MAX_HIGHLIGHT_FONT_SIZE_PX,
            Math.max(MIN_HIGHLIGHT_FONT_SIZE_PX, Math.floor(candidate))
        );
    }

    private normalizeHighlightLimit(value: unknown): number {
        const candidate = typeof value === "number"
            ? value
            : Number.parseInt(String(value ?? ""), 10);

        if (!Number.isFinite(candidate)) {
            return DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR;
        }

        return Math.min(
            MAX_HIGHLIGHT_LIMIT_PER_CHAR,
            Math.max(MIN_HIGHLIGHT_LIMIT_PER_CHAR, Math.floor(candidate))
        );
    }

    private showSettingsSaved(message: string, isError = false) {
        if (this.settingsStatusTimeout) clearTimeout(this.settingsStatusTimeout);
        this.ui.settings.status.textContent = message;
        this.ui.settings.status.classList.toggle("error", isError);
        this.ui.settings.status.classList.remove("hidden");
        this.settingsStatusTimeout = setTimeout(() => {
            this.ui.settings.status.classList.add("hidden");
        }, 1200);
    }

    private renderHighlightPreview(settings: HighlightDisplaySettings) {
        const preview = this.ui.settings.previewWord;
        const previewColor = this.normalizeHexColor(this.ui.char.color.value) || DEFAULT_HIGHLIGHT_COLOR;
        this.ui.settings.fontSize.value = String(settings.fontSizePx);
        this.ui.settings.highlightLimit.value = String(settings.highlightLimitPerChar);

        preview.style.fontSize = `${settings.fontSizePx}px`;
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
            setTimeout(() => this.ui.novel.name.focus(), 50);
        }
    }

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
        try {
            const novels = await apiService.getAllNovels();
            const stored = await browser.storage.local.get("activeNovelSlug");
            const preferredSlug = selectSlug
                || this.ui.novel.select.value
                || (stored.activeNovelSlug as string | undefined)
                || "";

            this.ui.novel.select.length = 1;

            novels.forEach((novel) => {
                this.ui.novel.select.appendChild(new Option(novel.title, novel.slug));
            });

            const availableSlug = novels.some((novel) => novel.slug === preferredSlug)
                ? preferredSlug
                : novels[0]?.slug || "";

            if (availableSlug) {
                this.ui.novel.select.value = availableSlug;
            }
        } catch (error) {
            console.error("[Goldfish] Failed to refresh novel dropdown:", error);
            this.showStatus("Could not load novels from backend", "error");
        }
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
            this.showStatus("Novel added");
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
        const highlightColor = this.normalizeHexColor(this.ui.char.color.value) || DEFAULT_HIGHLIGHT_COLOR;
        const aliases = this.ui.char.aliases.value.split(",").map((alias) => alias.trim()).filter(Boolean);

        if (!novelSlug) return this.showStatus("Select a novel first", "error");
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
            this.ui.char.saveBtn.textContent = "Saved";
            this.ui.char.saveBtn.classList.add("success-state");

            [this.ui.char.name, this.ui.char.aliases, this.ui.char.desc, this.ui.char.img].forEach((input) => {
                input.value = "";
            });
            this.setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
            await browser.storage.local.remove("draft");
            await this.handleRescan();

            setTimeout(() => {
                this.ui.char.saveBtn.textContent = originalText;
                this.ui.char.saveBtn.classList.remove("success-state");
                this.ui.char.saveBtn.disabled = false;
            }, 1200);
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
        browser.tabs.create({ url: browser.runtime.getURL("/database.html") });
        window.close();
    }
}

document.addEventListener("DOMContentLoaded", () => new GoldfishPopup());
