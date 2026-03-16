import { browser } from "wxt/browser";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator_midnight.min.css";
import { apiService, type Character, type Novel } from "../../services/api";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_HIGHLIGHT_COLOR = "#c5daff";

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

    private ui = {
        selectedNovelLabel: document.getElementById("selectedNovelLabel") as HTMLSpanElement,
        apiBaseUrlLabel: document.getElementById("apiBaseUrlLabel") as HTMLSpanElement,
        characterCountLabel: document.getElementById("characterCountLabel") as HTMLSpanElement,
        novelSelect: document.getElementById("novelSelect") as HTMLSelectElement,
        searchInput: document.getElementById("searchInput") as HTMLInputElement,
        clearFilterBtn: document.getElementById("clearFilterBtn") as HTMLButtonElement,
        toggleAliasesColumn: document.getElementById("toggleAliasesColumn") as HTMLInputElement,
        toggleImageColumn: document.getElementById("toggleImageColumn") as HTMLInputElement,
        refreshBtn: document.getElementById("refreshBtn") as HTMLButtonElement,
        rescanBtn: document.getElementById("rescanBtn") as HTMLButtonElement,
        tableStatus: document.getElementById("tableStatus") as HTMLDivElement,
        newNovelInput: document.getElementById("newNovelInput") as HTMLInputElement,
        addNovelBtn: document.getElementById("addNovelBtn") as HTMLButtonElement,
        charNameInput: document.getElementById("charNameInput") as HTMLInputElement,
        charAliasesInput: document.getElementById("charAliasesInput") as HTMLInputElement,
        charDescriptionInput: document.getElementById("charDescriptionInput") as HTMLTextAreaElement,
        charImageInput: document.getElementById("charImageInput") as HTMLInputElement,
        charColorInput: document.getElementById("charColorInput") as HTMLInputElement,
        charHighlightPalette: document.getElementById("charHighlightPalette") as HTMLDivElement,
        highlightPreviewWord: document.getElementById("highlightPreviewWord") as HTMLSpanElement,
        addCharacterBtn: document.getElementById("addCharacterBtn") as HTMLButtonElement,
    };

    constructor() {
        this.createTable();
        void this.init();
    }

    private async init() {
        this.bindEvents();
        await this.loadApiBaseUrlLabel();
        await this.loadNovels();
        this.setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
    }

    private bindEvents() {
        this.ui.novelSelect.addEventListener("change", () => void this.handleNovelChange());
        this.ui.searchInput.addEventListener("input", () => this.applySearchFilter());
        this.ui.clearFilterBtn.addEventListener("click", () => this.clearSearchFilter());
        this.ui.toggleAliasesColumn.addEventListener("change", () => this.syncColumnVisibility());
        this.ui.toggleImageColumn.addEventListener("change", () => this.syncColumnVisibility());
        this.ui.refreshBtn.addEventListener("click", () => void this.refreshCurrentNovel());
        this.ui.rescanBtn.addEventListener("click", () => void this.handleRescan());
        this.ui.addNovelBtn.addEventListener("click", () => void this.handleAddNovel());
        this.ui.addCharacterBtn.addEventListener("click", () => void this.handleAddCharacter());
        this.ui.charHighlightPalette.addEventListener("click", (event) => this.handlePaletteClick(event));
        this.ui.charColorInput.addEventListener("input", () => this.handleHighlightColorInput());

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

        this.setHighlightColor(this.ui.charColorInput.value);
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

    private async loadApiBaseUrlLabel() {
        const { apiBaseUrl } = await browser.storage.local.get("apiBaseUrl");
        const baseUrl = typeof apiBaseUrl === "string" && apiBaseUrl.trim()
            ? apiBaseUrl.trim()
            : DEFAULT_API_BASE_URL;
        this.ui.apiBaseUrlLabel.textContent = `Backend: ${baseUrl}`;
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

        this.ui.highlightPreviewWord.style.color = normalized;
        this.ui.highlightPreviewWord.style.textDecoration = `${normalized} wavy underline`;
        this.ui.highlightPreviewWord.style.textDecorationColor = normalized;
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

    private async refreshCurrentNovel() {
        await this.loadApiBaseUrlLabel();
        await this.loadNovels(this.currentNovelSlug);
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
