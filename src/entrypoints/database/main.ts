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

interface CharacterTablePreferences {
    showAliases: boolean;
    showImageUrl: boolean;
}

const DEFAULT_TABLE_PREFERENCES: CharacterTablePreferences = {
    showAliases: false,
    showImageUrl: true,
};

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

interface TableRow {
    getData(): CharacterRow;
    select(): void;
}

interface TableCell {
    getValue(): unknown;
    getRow(): TableRow;
}

type BulkEditableField = "highlightColor" | "imageUrl" | "description";

interface CharacterTable {
    updateData(rows: CharacterRow[]): Promise<unknown>;
    replaceData(rows: CharacterRow[]): void;
    deleteRow(id: number): void;
    clearFilter(includeHeaderFilters?: boolean): void;
    setFilter(filter: (row: CharacterRow) => boolean): void;
    showColumn(field: string): void;
    hideColumn(field: string): void;
    redraw(force?: boolean): void;
    getSelectedData(): CharacterRow[];
    deselectRow(): void;
    on(event: string, callback: (...args: any[]) => void): void;
}

class CharacterLibraryPage {
    private table!: CharacterTable;
    private novels: Novel[] = [];
    private currentNovelSlug = "";
    private currentRows: CharacterRow[] = [];
    private statusTimeout: ReturnType<typeof setTimeout> | null = null;
    private displaySettingsStatusTimeout: ReturnType<typeof setTimeout> | null = null;

    private ui = {
        novelForm: document.getElementById("novelForm") as HTMLFormElement,
        characterForm: document.getElementById("characterForm") as HTMLFormElement,
        selectedNovelLabel: document.getElementById("selectedNovelLabel") as HTMLSpanElement,
        characterCountLabel: document.getElementById("characterCountLabel") as HTMLSpanElement,
        apiBaseUrlSetting: document.getElementById("apiBaseUrlSetting") as HTMLInputElement,
        novelSelect: document.getElementById("novelSelect") as HTMLSelectElement,
        searchInput: document.getElementById("searchInput") as HTMLInputElement,
        clearFilterBtn: document.getElementById("clearFilterBtn") as HTMLButtonElement,
        toggleAliasesColumn: document.getElementById("toggleAliasesColumn") as HTMLInputElement,
        toggleImageColumn: document.getElementById("toggleImageColumn") as HTMLInputElement,
        bulkSelectionLabel: document.getElementById("bulkSelectionLabel") as HTMLSpanElement,
        bulkFieldSelect: document.getElementById("bulkFieldSelect") as HTMLSelectElement,
        bulkValueInput: document.getElementById("bulkValueInput") as HTMLInputElement,
        applyBulkEditBtn: document.getElementById("applyBulkEditBtn") as HTMLButtonElement,
        clearSelectionBtn: document.getElementById("clearSelectionBtn") as HTMLButtonElement,
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
        await this.loadTablePreferences();
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
        this.ui.toggleAliasesColumn.addEventListener("change", () => void this.syncColumnVisibility(true));
        this.ui.toggleImageColumn.addEventListener("change", () => void this.syncColumnVisibility(true));
        this.ui.bulkFieldSelect.addEventListener("change", () => this.syncBulkEditor());
        this.ui.applyBulkEditBtn.addEventListener("click", () => void this.applyBulkEdit());
        this.ui.clearSelectionBtn.addEventListener("click", () => this.table.deselectRow());
        this.ui.novelForm.addEventListener("submit", (event) => {
            event.preventDefault();
            void this.handleAddNovel();
        });
        this.ui.characterForm.addEventListener("submit", (event) => {
            event.preventDefault();
            void this.handleAddCharacter();
        });
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

        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== "local" || !changes.activeNovelSlug) return;

            const nextSlug = typeof changes.activeNovelSlug.newValue === "string"
                ? changes.activeNovelSlug.newValue
                : "";

            if (!nextSlug || nextSlug === this.currentNovelSlug) return;
            void this.handleExternalNovelSelectionChange(nextSlug);
        });

        this.setHighlightColor(this.ui.charColorInput.value);
        this.syncBulkEditor();
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

    private createImageCell(value: unknown): HTMLElement {
        const container = document.createElement("div");
        const rawUrl = typeof value === "string" ? value.trim() : "";
        if (!rawUrl) {
            container.className = "table-empty-value";
            container.textContent = "No image";
            return container;
        }

        try {
            const url = new URL(rawUrl);
            if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported URL protocol");

            const link = document.createElement("a");
            link.className = "table-image-link";
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = rawUrl;
            link.title = rawUrl;

            const preview = document.createElement("img");
            preview.className = "table-image-preview";
            preview.src = url.href;
            preview.alt = "";
            preview.loading = "lazy";
            preview.addEventListener("error", () => preview.classList.add("load-error"), { once: true });

            container.className = "table-image-cell";
            container.append(preview, link);
            return container;
        } catch {
            container.className = "table-empty-value";
            container.textContent = "Invalid URL";
            return container;
        }
    }

    private createColorCell(cell: TableCell): HTMLElement {
        const color = this.normalizeColor(typeof cell.getValue() === "string" ? cell.getValue() as string : "");
        const container = document.createElement("div");
        container.className = "table-color-cell";

        const picker = document.createElement("input");
        picker.type = "color";
        picker.className = "table-color-picker";
        picker.value = color;
        picker.setAttribute("aria-label", `Change highlight color for ${cell.getRow().getData().name}`);
        picker.addEventListener("click", (event) => event.stopPropagation());

        const label = document.createElement("span");
        label.textContent = color;
        picker.addEventListener("change", (event) => {
            event.stopPropagation();
            const rowData = cell.getRow().getData();
            rowData.highlightColor = this.normalizeColor(picker.value);
            label.textContent = rowData.highlightColor;
            void this.persistColorChange(rowData, rowData.highlightColor);
        });

        container.append(picker, label);
        return container;
    }

    private createActionsCell(row: CharacterRow): HTMLElement {
        const container = document.createElement("div");
        container.className = "table-action-group";

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = row.isDirty ? "table-save-button dirty" : "table-save-button";
        saveButton.textContent = "Save";
        saveButton.setAttribute("aria-label", `Save ${row.name}`);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "table-delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${row.name}`);

        container.append(saveButton, deleteButton);
        return container;
    }

    private createTable() {
        this.table = new Tabulator("#characterTable", {
            layout: "fitColumns",
            height: "min(640px, 68vh)",
            placeholder: "Select a novel to load saved characters.",
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [15, 30, 50, 100],
            paginationCounter: "rows",
            selectableRows: true,
            resizableColumnFit: true,
            movableColumns: true,
            columnHeaderVertAlign: "middle",
            index: "id",
            initialSort: [{ column: "name", dir: "asc" }],
            columns: [
                {
                    title: "",
                    formatter: "rowSelection",
                    titleFormatter: "rowSelection",
                    formatterParams: { rowRange: "active" },
                    titleFormatterParams: { rowRange: "active" },
                    hozAlign: "center",
                    headerHozAlign: "center",
                    headerSort: false,
                    width: 40,
                    minWidth: 40,
                    resizable: false,
                    frozen: true,
                    vertAlign: "middle",
                    cssClass: "selection-column",
                },
                { title: "Name", field: "name", editor: "input", minWidth: 160, widthGrow: 1, frozen: true },
                { title: "Aliases", field: "aliasesText", editor: "input", minWidth: 190, widthGrow: 1.2, visible: false },
                { title: "Description", field: "description", editor: "textarea", minWidth: 260, widthGrow: 2.6 },
                {
                    title: "Image URL",
                    field: "imageUrl",
                    editor: "input",
                    minWidth: 240,
                    widthGrow: 1.5,
                    visible: true,
                    formatter: (cell: TableCell) => this.createImageCell(cell.getValue())
                },
                {
                    title: "Color",
                    field: "highlightColor",
                    width: 150,
                    headerSort: false,
                    formatter: (cell: TableCell) => this.createColorCell(cell)
                },
                {
                    title: "",
                    field: "actions",
                    width: 170,
                    hozAlign: "center",
                    headerSort: false,
                    resizable: false,
                    frozen: true,
                    formatter: (cell: TableCell) => {
                        const row = cell.getRow().getData();
                        return this.createActionsCell(row);
                    },
                    cellClick: (_event: Event, cell: TableCell) => {
                        const row = cell.getRow();
                        const target = _event.target as HTMLElement;

                        if (target.closest(".table-save-button")) {
                            void this.persistRowEdit(row.getData());
                            return;
                        }

                        if (target.closest(".table-delete-button")) {
                            void this.handleDeleteCharacter(row.getData());
                        }
                    }
                }
            ],
        }) as CharacterTable;

        // Tabulator 6 exposes table events through .on(); constructor callbacks
        // are not registered and therefore never fire.
        this.table.on("rowSelectionChanged", (data: CharacterRow[]) => {
            this.renderBulkSelection(data.length);
        });
        this.table.on("cellEdited", (cell: TableCell) => {
            const rowData = cell.getRow().getData();
            rowData.isDirty = true;
            this.currentRows = this.currentRows.map((row) => row.id === rowData.id ? { ...rowData } : row);
            this.table.updateData([rowData]);
            this.showStatus(`Unsaved changes for ${rowData.name}`);
        });
        this.table.on("dataFiltered", (_filters: unknown, rows: Array<{ getData: () => CharacterRow }>) => {
            this.updateMetrics(rows.map((row) => row.getData()));
        });
        this.table.on("tableBuilt", () => {
            void this.syncColumnVisibility();
        });
    }

    private async loadTablePreferences() {
        const { characterTablePreferences } = await browser.storage.local.get("characterTablePreferences");
        const stored = characterTablePreferences as Partial<CharacterTablePreferences> | undefined;

        this.ui.toggleAliasesColumn.checked = stored?.showAliases ?? DEFAULT_TABLE_PREFERENCES.showAliases;
        this.ui.toggleImageColumn.checked = stored?.showImageUrl ?? DEFAULT_TABLE_PREFERENCES.showImageUrl;
        await this.syncColumnVisibility();
    }

    private async loadBackendSettings() {
        const { apiBaseUrl } = await browser.storage.local.get("apiBaseUrl");
        this.ui.apiBaseUrlSetting.value = typeof apiBaseUrl === "string" && apiBaseUrl.trim()
            ? apiBaseUrl.trim()
            : DEFAULT_API_BASE_URL;
    }

    private syncBulkEditor() {
        const field = this.ui.bulkFieldSelect.value as BulkEditableField;
        const input = this.ui.bulkValueInput;

        if (field === "highlightColor") {
            input.type = "color";
            input.value = this.normalizeColor(input.value);
            input.placeholder = "#c5daff";
        } else if (field === "imageUrl") {
            input.type = "url";
            input.value = "";
            input.placeholder = "https://example.com/image.jpg (blank removes images)";
        } else {
            input.type = "text";
            input.value = "";
            input.placeholder = "Replacement description";
        }
    }

    private renderBulkSelection(count: number) {
        this.ui.bulkSelectionLabel.textContent = count === 1 ? "1 selected" : `${count} selected`;
        this.ui.applyBulkEditBtn.disabled = count === 0;
        this.ui.clearSelectionBtn.disabled = count === 0;
    }

    private async applyBulkEdit() {
        const selectedRows = this.table.getSelectedData();
        if (selectedRows.length === 0 || !this.currentNovelSlug) return;

        const field = this.ui.bulkFieldSelect.value as BulkEditableField;
        const rawValue = this.ui.bulkValueInput.value.trim();
        if (field === "description" && !rawValue) {
            this.showStatus("Description cannot be empty", true);
            return;
        }
        if (field === "imageUrl" && rawValue && !/^https?:\/\/.+/i.test(rawValue)) {
            this.showStatus("Use a full image URL beginning with http:// or https://", true);
            return;
        }

        const value = field === "highlightColor" ? this.normalizeColor(rawValue) : rawValue;
        this.ui.applyBulkEditBtn.disabled = true;

        const originalButtonLabel = this.ui.applyBulkEditBtn.textContent || "Apply to selected";

        try {
            const updatedRows: CharacterRow[] = [];
            for (const [index, row] of selectedRows.entries()) {
                this.ui.applyBulkEditBtn.textContent = `Updating ${index + 1}/${selectedRows.length}…`;
                const updatedCharacter = await apiService.updateCharacterFields(
                    this.currentNovelSlug,
                    row.id,
                    { [field]: value },
                );
                updatedRows.push(this.toCharacterRow(updatedCharacter));
            }
            const updatedById = new Map(updatedRows.map((row) => [row.id, row]));

            this.currentRows = this.currentRows.map((row) => updatedById.get(row.id) || row);
            await this.table.updateData(updatedRows);
            this.table.deselectRow();
            this.showStatus(`Updated ${updatedRows.length} characters`);
            await this.handleRescan();
        } catch (error) {
            this.showStatus(this.formatError(error, "Failed to update selected characters"), true);
            await this.loadCharactersForCurrentNovel();
        } finally {
            this.ui.applyBulkEditBtn.textContent = originalButtonLabel;
            this.ui.applyBulkEditBtn.disabled = this.table.getSelectedData().length === 0;
        }
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
            this.ui.novelSelect.replaceChildren();

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
            if (!resolvedNovel) return;

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

    private async persistColorChange(rowData: CharacterRow, color: string) {
        if (!this.currentNovelSlug) return;

        try {
            const updated = await apiService.updateCharacterFields(this.currentNovelSlug, rowData.id, {
                highlightColor: this.normalizeColor(color),
            });
            const updatedRow = this.toCharacterRow(updated);
            await this.table.updateData([updatedRow]);
            this.currentRows = this.currentRows.map((row) => row.id === updatedRow.id ? updatedRow : row);
            this.showStatus(`Changed ${updatedRow.name} to ${updatedRow.highlightColor}`);
            await this.handleRescan();
        } catch (error) {
            this.showStatus(this.formatError(error, `Failed to change ${rowData.name}'s color`), true);
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

    private async syncColumnVisibility(persist = false) {
        // Tabulator may fire tableBuilt before the constructor assignment completes.
        if (!this.table) return;

        if (this.ui.toggleAliasesColumn.checked) {
            this.table.showColumn("aliasesText");
        } else {
            this.table.hideColumn("aliasesText");
        }

        if (this.ui.toggleImageColumn.checked) {
            this.table.showColumn("imageUrl");
        } else {
            this.table.hideColumn("imageUrl");
        }

        // Frozen columns retain their previous offset until Tabulator performs a
        // full layout pass. Redraw so Actions remains flush with the right edge.
        this.table.redraw(true);

        if (persist) {
            await browser.storage.local.set({
                characterTablePreferences: {
                    showAliases: this.ui.toggleAliasesColumn.checked,
                    showImageUrl: this.ui.toggleImageColumn.checked,
                } satisfies CharacterTablePreferences,
            });
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
        const tabs = await browser.tabs.query({});
        await Promise.allSettled(tabs
            .filter((tab) => typeof tab.id === "number")
            .map((tab) => browser.tabs.sendMessage(tab.id!, { type: "RESCAN_PAGE" })));
    }
}

document.addEventListener("DOMContentLoaded", () => new CharacterLibraryPage());
