import { browser } from "wxt/browser";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { apiService, type Character, type Novel } from "../../services/api";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_HIGHLIGHT_COLOR = "#c5daff";
const DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR = 5;
const MIN_HIGHLIGHT_LIMIT_PER_CHAR = 1;
const MAX_HIGHLIGHT_LIMIT_PER_CHAR = 50;
const DEFAULT_HIGHLIGHT_FONT_SIZE_PX = 16;
const MIN_HIGHLIGHT_FONT_SIZE_PX = 10;
const MAX_HIGHLIGHT_FONT_SIZE_PX = 36;

interface HighlightDisplaySettings {
    fontSizePx: number;
    fontWeight: "400" | "600" | "700";
    fontStyle: "normal" | "italic";
    underlineStyle: "none" | "solid" | "dashed" | "dotted" | "wavy";
    highlightLimitPerChar: number;
}

const DEFAULT_DISPLAY_SETTINGS: HighlightDisplaySettings = {
    fontSizePx: DEFAULT_HIGHLIGHT_FONT_SIZE_PX,
    fontWeight: "700",
    fontStyle: "normal",
    underlineStyle: "wavy",
    highlightLimitPerChar: DEFAULT_HIGHLIGHT_LIMIT_PER_CHAR,
};

interface CharacterRow {
    id: number;
    name: string;
    aliasesText: string;
    aliases: string[];
    description: string;
    imageUrl: string;
    highlightColor: string;
    isDirty?: boolean;
}

class GoldfishDatabasePage {
    private table: any;
    private novels: Novel[] = [];
    private currentNovelSlug = "";
    private currentRows: CharacterRow[] = [];
    private statusTimeout: ReturnType<typeof setTimeout> | null = null;
    private displaySettingsStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    private ui = {
        selectedNovelLabel: document.getElementById("selectedNovelLabel") as HTMLSpanElement,
        characterCountLabel: document.getElementById("characterCountLabel") as HTMLSpanElement,
        apiBaseUrlSetting: document.getElementById("apiBaseUrlSetting") as HTMLInputElement,
        novelSelect: document.getElementById("novelSelect") as HTMLSelectElement,
        searchInput: document.getElementById("searchInput") as HTMLInputElement,
        clearFilterBtn: document.getElementById("clearFilterBtn") as HTMLButtonElement,
        toggleAliasesColumn: document.getElementById("toggleAliasesColumn") as HTMLInputElement,
        toggleImageColumn: document.getElementById("toggleImageColumn") as HTMLInputElement,
        tableStatus: document.getElementById("tableStatus") as HTMLDivElement,
        newNovelInput: document.getElementById("newNovelInput") as HTMLInputElement,
        addNovelBtn: document.getElementById("addNovelBtn") as HTMLButtonElement,
        charNameInput: document.getElementById("charNameInput") as HTMLInputElement,
        charAliasesInput: document.getElementById("charAliasesInput") as HTMLInputElement,
        charDescriptionInput: document.getElementById("charDescriptionInput") as HTMLTextAreaElement,
        charImageInput: document.getElementById("charImageInput") as HTMLInputElement,
        charColorInput: document.getElementById("charColorInput") as HTMLInputElement,
        charHighlightPalette: document.getElementById("charHighlightPalette") as HTMLDivElement,
        displayFontSize: document.getElementById("displayFontSize") as HTMLInputElement,
        displayFontWeight: document.getElementById("displayFontWeight") as HTMLSelectElement,
        displayUnderlineStyle: document.getElementById("displayUnderlineStyle") as HTMLSelectElement,
        displayHighlightLimit: document.getElementById("displayHighlightLimit") as HTMLInputElement,
        highlightPreviewWord: document.getElementById("highlightPreviewWord") as HTMLSpanElement,
        displaySettingsStatus: document.getElementById("displaySettingsStatus") as HTMLDivElement,
        addCharacterBtn: document.getElementById("addCharacterBtn") as HTMLButtonElement,
    };

    constructor() {
        this.createTable();
        void this.init();
    }

    private async init() {
        this.bindEvents();
        await this.loadBackendSettings();
        await this.loadNovels();
        await this.loadDisplaySettings();
        this.setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
    }

    private bindEvents() {
        this.ui.novelSelect.addEventListener("change", () => void this.handleNovelChange());
        this.ui.searchInput.addEventListener("input", () => this.applySearchFilter());
        this.ui.clearFilterBtn.addEventListener("click", () => this.clearSearchFilter());
        this.ui.toggleAliasesColumn.addEventListener("change", () => this.syncColumnVisibility());
        this.ui.toggleImageColumn.addEventListener("change", () => this.syncColumnVisibility());
        this.ui.addNovelBtn.addEventListener("click", () => void this.handleAddNovel());
        this.ui.addCharacterBtn.addEventListener("click", () => void this.handleAddCharacter());
        this.ui.charHighlightPalette.addEventListener("click", (event) => this.handlePaletteClick(event));
        this.ui.charColorInput.addEventListener("input", () => this.handleHighlightColorInput());
        this.ui.apiBaseUrlSetting.addEventListener("change", () => void this.saveBackendSettings());
        [
            this.ui.displayFontSize,
            this.ui.displayFontWeight,
            this.ui.displayUnderlineStyle,
            this.ui.displayHighlightLimit,
        ].forEach((field) => {
            field.addEventListener("input", () => void this.saveDisplaySettings());
        });

        this.ui.newNovelInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                void this.handleAddNovel();
            }
        });

        this.ui.charNameInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                void this.handleAddCharacter();
            }
        });

        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== "local" || !changes.activeNovelSlug) return;

            const nextSlug = typeof changes.activeNovelSlug.newValue === "string"
                ? changes.activeNovelSlug.newValue
                : "";

            if (!nextSlug || nextSlug === this.currentNovelSlug) return;
            void this.handleExternalNovelSelectionChange(nextSlug);
        });

        this.setHighlightColor(this.ui.charColorInput.value);
    }

    private async handleExternalNovelSelectionChange(slug: string) {
        const matchingNovel = this.novels.find((novel) => novel.slug === slug);
        if (!matchingNovel) {
            await this.loadNovels(slug);
            return;
        }

        this.currentNovelSlug = slug;
        this.ui.novelSelect.value = slug;
        this.renderNovelSummary();
        await this.loadCharactersForCurrentNovel();
    }

    private async loadDisplaySettings() {
        const { highlightDisplaySettings } = await browser.storage.local.get("highlightDisplaySettings");
        const settings = this.withDisplayDefaults(highlightDisplaySettings as Partial<HighlightDisplaySettings> | undefined);

        this.ui.displayFontSize.value = String(settings.fontSizePx);
        this.ui.displayFontWeight.value = settings.fontWeight;
        this.ui.displayUnderlineStyle.value = settings.underlineStyle;
        this.ui.displayHighlightLimit.value = String(settings.highlightLimitPerChar);
        this.renderHighlightPreview(settings);
    }

    private async saveDisplaySettings() {
        const settings = this.readDisplaySettingsFromForm();
        await browser.storage.local.set({ highlightDisplaySettings: settings });
        this.renderHighlightPreview(settings);
        this.showDisplaySettingsStatus("Highlight settings saved");
        await this.handleRescan();
    }

    private createTable() {
        this.table = new Tabulator("#characterTable", {
            layout: "fitColumns",
            height: "640px",
            placeholder: "Select a novel to load saved characters.",
            pagination: true,
            paginationSize: 10,
            selectableRows: 1,
            resizableColumnFit: true,
            index: "id",
            columns: [
                { title: "Name", field: "name", editor: "input", width: 180 },
                { title: "Aliases", field: "aliasesText", editor: "input", width: 220, visible: false },
                { title: "Description", field: "description", editor: "textarea", widthGrow: 2.6 },
                {
                    title: "Image",
                    field: "imageUrl",
                    editor: "input",
                    width: 190,
                    visible: false,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return "<span style='color:#6f8795;'>No image</span>";
                        return `<a class="table-image-link" href="${value}" target="_blank" rel="noreferrer">Open</a>`;
                    }
                },
                {
                    title: "Color",
                    field: "highlightColor",
                    editor: "input",
                    width: 150,
                    formatter: (cell: any) => {
                        const value = this.normalizeColor(cell.getValue());
                        return `<div class="table-color-cell"><span class="table-color-dot" style="background:${value};"></span><span>${value}</span></div>`;
                    }
                },
                {
                    title: "",
                    field: "actions",
                    width: 170,
                    hozAlign: "center",
                    headerSort: false,
                    resizable: false,
                    formatter: (cell: any) => {
                        const row = cell.getRow().getData() as CharacterRow;
                        const saveClass = row.isDirty ? "table-save-button dirty" : "table-save-button";
                        return `<div class="table-action-group"><button class="${saveClass}" type="button">Save</button><button class="table-delete-button" type="button">Delete</button></div>`;
                    },
                    cellClick: (_event: Event, cell: any) => {
                        const row = cell.getRow();
                        const target = _event.target as HTMLElement;

                        if (target.closest(".table-save-button")) {
                            void this.persistRowEdit(row.getData() as CharacterRow);
                            return;
                        }

                        if (target.closest(".table-delete-button")) {
                            void this.handleDeleteCharacter(row.getData() as CharacterRow);
                        }
                    }
                }
            ],
            rowClick: (_event: Event, row: any) => {
                row.select();
            },
            cellEdited: (cell: any) => {
                const rowData = cell.getRow().getData() as CharacterRow;
                rowData.isDirty = true;
                this.currentRows = this.currentRows.map((row) => row.id === rowData.id ? { ...rowData } : row);
                this.table.updateData([rowData]);
                this.showStatus(`Unsaved changes for ${rowData.name}`);
            },
            dataFiltered: (_filters: unknown, rows: Array<{ getData: () => CharacterRow }>) => {
                this.updateMetrics(rows.map((row) => row.getData()));
            },
            tableBuilt: () => {
                this.syncColumnVisibility();
            }
        });
    }

    private async loadBackendSettings() {
        const { apiBaseUrl } = await browser.storage.local.get("apiBaseUrl");
        this.ui.apiBaseUrlSetting.value = typeof apiBaseUrl === "string" && apiBaseUrl.trim()
            ? apiBaseUrl.trim()
            : DEFAULT_API_BASE_URL;
    }

    private async saveBackendSettings() {
        const candidate = this.ui.apiBaseUrlSetting.value.trim();
        const normalized = candidate.replace(/\/+$/, "");

        if (!/^https?:\/\/.+/i.test(normalized)) {
            this.showDisplaySettingsStatus("Use a full URL like http://127.0.0.1:8000", true);
            this.ui.apiBaseUrlSetting.value = normalized || DEFAULT_API_BASE_URL;
            return;
        }

        await browser.storage.local.set({ apiBaseUrl: normalized });
        this.ui.apiBaseUrlSetting.value = normalized;
        this.showDisplaySettingsStatus("Backend URL saved");
        await this.loadNovels(); // Reload novels after backend change
        await this.handleRescan();
    }

    private async loadNovels(preferredSlug?: string) {
        try {
            const stored = await browser.storage.local.get("activeNovelSlug");
            this.novels = await apiService.getAllNovels();
            this.ui.novelSelect.innerHTML = "";

            if (this.novels.length === 0) {
                this.currentNovelSlug = "";
                this.ui.novelSelect.appendChild(new Option("No novels yet", ""));
                this.table.replaceData([]);
                this.renderNovelSummary();
                this.updateMetrics([]);
                return;
            }

            this.novels.forEach((novel) => {
                this.ui.novelSelect.appendChild(new Option(novel.title, novel.slug));
            });

            const nextSlug = preferredSlug
                || (stored.activeNovelSlug as string | undefined)
                || this.novels[0]?.slug
                || "";

            const resolvedNovel = this.novels.find((novel) => novel.slug === nextSlug) || this.novels[0];
            this.currentNovelSlug = resolvedNovel.slug;
            this.ui.novelSelect.value = resolvedNovel.slug;
            this.renderNovelSummary();

            try {
                await browser.storage.local.set({ activeNovelSlug: resolvedNovel.slug });
            } catch {
                // Keep the page functional even if storage is temporarily unavailable.
            }

            await this.loadCharactersForCurrentNovel();
        } catch (error) {
            this.showStatus(this.formatError(error, "Failed to load novels"), true);
        }
    }

    private async handleNovelChange() {
        await this.selectNovel(this.ui.novelSelect.value);
    }

    private async selectNovel(slug: string) {
        this.currentNovelSlug = slug;
        this.renderNovelSummary();

        try {
            await browser.storage.local.set({ activeNovelSlug: slug });
        } catch {
            // Keep the page functional even if storage is temporarily unavailable.
        }

        await this.loadCharactersForCurrentNovel();
    }

    private async loadCharactersForCurrentNovel() {
        if (!this.currentNovelSlug) {
            this.currentRows = [];
            this.table.replaceData([]);
            this.updateMetrics([]);
            return;
        }

        try {
            const characters = await apiService.getCharactersByNovelSlug(this.currentNovelSlug);
            this.currentRows = characters.map((character) => this.toCharacterRow(character));
            this.table.replaceData(this.currentRows);
            this.updateMetrics(this.currentRows);
            this.showStatus(`Loaded ${this.currentRows.length} characters`);
        } catch (error) {
            this.showStatus(this.formatError(error, "Failed to load characters"), true);
        }
    }

    private toCharacterRow(character: Character): CharacterRow {
        return {
            id: Number(character.id),
            name: character.name,
            aliases: [...character.aliases],
            aliasesText: character.aliases.join(", "),
            description: character.description,
            imageUrl: character.imageUrl || "",
            highlightColor: this.normalizeColor(character.highlightColor),
            isDirty: false,
        };
    }

    private toCharacterPayload(row: CharacterRow): Character {
        return {
            id: row.id,
            name: row.name.trim(),
            aliases: row.aliasesText.split(",").map((value) => value.trim()).filter(Boolean),
            description: row.description.trim(),
            imageUrl: row.imageUrl.trim(),
            highlightColor: this.normalizeColor(row.highlightColor),
        };
    }

    private async persistRowEdit(rowData: CharacterRow) {
        if (!this.currentNovelSlug) return;

        const payload = this.toCharacterPayload(rowData);
        if (!payload.name || !payload.description) {
            this.showStatus("Name and description are required", true);
            await this.loadCharactersForCurrentNovel();
            return;
        }

        try {
            const updated = await apiService.updateCharacter(this.currentNovelSlug, rowData.id, payload);
            const updatedRow = this.toCharacterRow(updated);
            updatedRow.isDirty = false;
            this.table.updateData([updatedRow]);
            this.currentRows = this.currentRows.map((row) => row.id === updatedRow.id ? updatedRow : row);
            this.updateMetrics(this.currentRows);
            this.showStatus(`Saved ${updatedRow.name}`);
            await this.handleRescan();
        } catch (error) {
            this.showStatus(this.formatError(error, `Failed to update ${rowData.name}`), true);
            await this.loadCharactersForCurrentNovel();
        }
    }

    private async handleDeleteCharacter(row: CharacterRow) {
        if (!this.currentNovelSlug) return;

        const shouldDelete = window.confirm(`Delete ${row.name} from this novel?`);
        if (!shouldDelete) return;

        try {
            await apiService.deleteCharacter(this.currentNovelSlug, row.id);
            this.currentRows = this.currentRows.filter((item) => item.id !== row.id);
            this.table.deleteRow(row.id);
            this.updateMetrics(this.currentRows);
            this.showStatus(`Deleted ${row.name}`);
            await this.handleRescan();
        } catch (error) {
            this.showStatus(this.formatError(error, `Failed to delete ${row.name}`), true);
        }
    }

    private async handleAddNovel() {
        const title = this.ui.newNovelInput.value.trim();
        if (!title) {
            this.showStatus("Novel title is required", true);
            return;
        }

        try {
            this.ui.addNovelBtn.disabled = true;
            const novel = await apiService.addNovel(title);
            this.ui.newNovelInput.value = "";
            await this.loadNovels(novel.slug);
            this.showStatus(`Created ${novel.title}`);
        } catch (error) {
            this.showStatus(this.formatError(error, "Failed to create novel"), true);
        } finally {
            this.ui.addNovelBtn.disabled = false;
        }
    }

    private async handleAddCharacter() {
        if (!this.currentNovelSlug) {
            this.showStatus("Select a novel before adding a character", true);
            return;
        }

        const payload: Character = {
            name: this.ui.charNameInput.value.trim(),
            aliases: this.ui.charAliasesInput.value.split(",").map((value) => value.trim()).filter(Boolean),
            description: this.ui.charDescriptionInput.value.trim(),
            imageUrl: this.ui.charImageInput.value.trim(),
            highlightColor: this.normalizeColor(this.ui.charColorInput.value),
        };

        if (!payload.name || !payload.description) {
            this.showStatus("Name and description are required", true);
            return;
        }

        try {
            this.ui.addCharacterBtn.disabled = true;
            await apiService.addCharacter(this.currentNovelSlug, payload);
            this.ui.charNameInput.value = "";
            this.ui.charAliasesInput.value = "";
            this.ui.charDescriptionInput.value = "";
            this.ui.charImageInput.value = "";
            this.setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
            await this.loadCharactersForCurrentNovel();
            this.showStatus(`Added ${payload.name}`);
            await this.handleRescan();
        } catch (error) {
            this.showStatus(this.formatError(error, "Failed to add character"), true);
        } finally {
            this.ui.addCharacterBtn.disabled = false;
        }
    }

    private applySearchFilter() {
        const query = this.ui.searchInput.value.trim().toLowerCase();
        if (!query) {
            this.table.clearFilter(true);
            this.updateMetrics(this.currentRows);
            return;
        }

        this.table.setFilter((data: CharacterRow) => {
            return [
                data.name,
                data.aliasesText,
                data.description,
                data.imageUrl,
                data.highlightColor,
            ].some((value) => value.toLowerCase().includes(query));
        });
    }

    private clearSearchFilter() {
        this.ui.searchInput.value = "";
        this.table.clearFilter(true);
        this.updateMetrics(this.currentRows);
    }

    private updateMetrics(rows: CharacterRow[]) {
        this.ui.characterCountLabel.textContent = String(rows.length);
    }

    private renderNovelSummary() {
        const novel = this.novels.find((entry) => entry.slug === this.currentNovelSlug);
        this.ui.selectedNovelLabel.textContent = novel?.title || "No novel selected";
    }

    private normalizeHexColor(value: string | undefined): string | null {
        const trimmed = String(value || "").trim();
        if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
        return null;
    }

    private setHighlightColor(value: string) {
        const normalized = this.normalizeHexColor(value) || DEFAULT_HIGHLIGHT_COLOR;
        this.ui.charColorInput.value = normalized;
        this.syncHighlightPreview(normalized, normalized);
    }

    private handleHighlightColorInput() {
        const normalized = this.normalizeHexColor(this.ui.charColorInput.value);
        this.syncHighlightPreview(normalized || DEFAULT_HIGHLIGHT_COLOR, normalized);
    }

    private syncHighlightPreview(color: string, selectedColor?: string | null) {
        const normalized = this.normalizeHexColor(color) || DEFAULT_HIGHLIGHT_COLOR;
        this.ui.charHighlightPalette.querySelectorAll(".color-swatch").forEach((swatch) => {
            const button = swatch as HTMLButtonElement;
            const isSelected = !!selectedColor && button.dataset.color === selectedColor;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
        });

        this.renderHighlightPreview(this.readDisplaySettingsFromForm(), normalized);
    }

    private handlePaletteClick(event: Event) {
        const target = event.target as HTMLElement;
        const swatch = target.closest(".color-swatch") as HTMLButtonElement | null;
        if (!swatch) return;

        this.setHighlightColor(swatch.dataset.color || DEFAULT_HIGHLIGHT_COLOR);
    }

    private normalizeColor(value: string | undefined): string {
        return this.normalizeHexColor(value) || DEFAULT_HIGHLIGHT_COLOR;
    }

    private readDisplaySettingsFromForm(): HighlightDisplaySettings {
        return {
            fontSizePx: this.normalizeFontSize(this.ui.displayFontSize.value),
            fontWeight: this.ui.displayFontWeight.value as HighlightDisplaySettings["fontWeight"],
            fontStyle: "normal",
            underlineStyle: this.ui.displayUnderlineStyle.value as HighlightDisplaySettings["underlineStyle"],
            highlightLimitPerChar: this.normalizeHighlightLimit(this.ui.displayHighlightLimit.value),
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

    private renderHighlightPreview(settings: HighlightDisplaySettings, colorOverride?: string) {
        const preview = this.ui.highlightPreviewWord;
        const previewColor = this.normalizeHexColor(colorOverride || this.ui.charColorInput.value) || DEFAULT_HIGHLIGHT_COLOR;

        this.ui.displayFontSize.value = String(settings.fontSizePx);
        this.ui.displayHighlightLimit.value = String(settings.highlightLimitPerChar);

        preview.style.fontSize = `${settings.fontSizePx}px`;
        preview.style.fontWeight = settings.fontWeight;
        preview.style.fontStyle = settings.fontStyle;
        preview.style.color = previewColor;
        preview.style.textDecoration = settings.underlineStyle === "none"
            ? "none"
            : `${previewColor} ${settings.underlineStyle} underline`;
        preview.style.textDecorationColor = previewColor;
    }

    private showDisplaySettingsStatus(message: string, isError = false) {
        if (this.displaySettingsStatusTimeout) clearTimeout(this.displaySettingsStatusTimeout);

        this.ui.displaySettingsStatus.textContent = message;
        this.ui.displaySettingsStatus.classList.toggle("error", isError);
        this.ui.displaySettingsStatus.classList.remove("hidden");

        this.displaySettingsStatusTimeout = setTimeout(() => {
            this.ui.displaySettingsStatus.classList.add("hidden");
        }, 1200);
    }

    private syncColumnVisibility() {
        if (!this.table) return;

        if (this.ui.toggleAliasesColumn.checked) {
            this.table?.showColumn("aliasesText");
        } else {
            this.table?.hideColumn("aliasesText");
        }

        if (this.ui.toggleImageColumn.checked) {
            this.table?.showColumn("imageUrl");
        } else {
            this.table?.hideColumn("imageUrl");
        }
    }

    private showStatus(message: string, isError = false) {
        if (this.statusTimeout) clearTimeout(this.statusTimeout);

        this.ui.tableStatus.textContent = message;
        this.ui.tableStatus.classList.toggle("error", isError);
        this.ui.tableStatus.classList.remove("hidden");

        this.statusTimeout = setTimeout(() => {
            this.ui.tableStatus.classList.add("hidden");
        }, 2200);
    }

    private formatError(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message) {
            return `${fallback}: ${error.message}`;
        }

        return fallback;
    }
    private async handleRescan() {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) return;

        try {
            await browser.tabs.sendMessage(tabs[0].id, { type: "RESCAN_PAGE" });
        } catch {
            // Ignore if content script is unavailable for the active tab.
        }
    }
}

document.addEventListener("DOMContentLoaded", () => new GoldfishDatabasePage());
