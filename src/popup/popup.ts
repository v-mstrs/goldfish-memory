import { addNovel, getAllNovels, addCharacter, exportDatabase } from '../db/crud';
import { type DraftMode, type DraftState } from '../types';
import browser from "webextension-polyfill";

const UI = {
    novel: {
        select: document.getElementById('novelSelect') as HTMLSelectElement,
        name: document.getElementById('newNovel') as HTMLInputElement,
        saveBtn: document.getElementById('saveNovelBtn') as HTMLButtonElement,
        toggleBtn: document.getElementById('toggleNovelDrawer') as HTMLButtonElement,
        toast: document.getElementById('novelToast') as HTMLDivElement,
        arrow: document.getElementById('arrow') as HTMLSpanElement,
        drawer: document.getElementById('novelAddDrawer') as HTMLDivElement,
    },
    char: {
        name: document.getElementById("charName") as HTMLInputElement,
        aliases: document.getElementById("charAliases") as HTMLInputElement,
        desc: document.getElementById("charDesc") as HTMLTextAreaElement,
        img: document.getElementById("charImgUrl") as HTMLInputElement,
        saveBtn: document.getElementById("addCharBtn") as HTMLButtonElement,
    },
    storage: {
        exportBtn: document.getElementById('exportBtn') as HTMLButtonElement,
    }
};

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Persists or loads the current form state to/from local storage.
 */
async function syncDraft(mode: DraftMode) {
    if (mode === 'save') {
        const state = {
            charName: UI.char.name.value,
            charAliases: UI.char.aliases.value,
            charDesc: UI.char.desc.value,
            charImg: UI.char.img.value
        };
        await browser.storage.local.set({
            draft: state,
            activeNovelId: UI.novel.select.value
        });
    } else {
        const data = await browser.storage.local.get(['draft', 'activeNovelId']);
        const s = data.draft as DraftState;

        if (data.activeNovelId) UI.novel.select.value = data.activeNovelId as string;
        if (s) {
            UI.char.name.value = s.charName || "";
            UI.char.aliases.value = s.charAliases || "";
            UI.char.desc.value = s.charDesc || "";
            UI.char.img.value = s.charImg || "";
        }
    }
}

/**
 * Toggles the "Add New Novel" drawer.
 */
const toggleDrawer = (forceState?: boolean) => {
    const isHidden = UI.novel.drawer.classList.toggle('hidden', forceState);
    if (UI.novel.arrow) UI.novel.arrow.textContent = isHidden ? '▼' : '▲';
    if (!isHidden) UI.novel.name.focus();
};

/**
 * Displays a temporary status message (toast).
 */
function showStatus(message: string, type: 'success' | 'error' = 'success') {
    if (!UI.novel.toast) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    UI.novel.toast.textContent = message;
    UI.novel.toast.classList.remove('hidden');

    const isError = type === 'error';
    UI.novel.toast.style.background = isError ? "#441a1a" : "#1f3d2b";
    UI.novel.toast.style.borderColor = isError ? "#ff5f5f" : "#28a745";
    UI.novel.toast.style.color = isError ? "#ffbaba" : "#8ff0b0";

    toastTimeout = setTimeout(() => UI.novel.toast.classList.add('hidden'), 2000);
}

/**
 * Refreshes the list of novels in the dropdown.
 */
async function refreshNovelDropdown(selectId?: number) {
    const novels = await getAllNovels();
    UI.novel.select.length = 1; // Keep placeholder

    novels.forEach(novel => {
        UI.novel.select.appendChild(new Option(novel.title, novel.id!.toString()));
    });

    if (selectId) UI.novel.select.value = selectId.toString();
}

/**
 * Saves a new novel to the database.
 */
async function handleSaveNovel() {
    const title = UI.novel.name.value.trim();
    if (!title) return showStatus("Novel title required", "error");

    try {
        UI.novel.saveBtn.disabled = true;
        const newId = await addNovel(title);
        UI.novel.name.value = '';
        toggleDrawer(true);
        await refreshNovelDropdown(newId);
        showStatus(`✔ Novel added`);
    } catch (err) {
        showStatus("Error saving novel", "error");
    } finally {
        UI.novel.saveBtn.disabled = false;
    }
}

/**
 * Saves a new character to the database.
 */
async function handleSaveCharacter() {
    const novelId = parseInt(UI.novel.select.value);
    const name = UI.char.name.value.trim();
    const desc = UI.char.desc.value.trim();
    const img = UI.char.img.value.trim();
    const aliases = UI.char.aliases.value.split(',').map(a => a.trim()).filter(Boolean);

    if (isNaN(novelId)) return showStatus("Select a novel first!", "error");
    if (!name || !desc) return showStatus("Name and Description required", "error");

    try {
        UI.char.saveBtn.disabled = true;
        await addCharacter(novelId, name, aliases, desc, img);

        const originalText = UI.char.saveBtn.textContent;
        UI.char.saveBtn.textContent = "✓ Saved!";
        UI.char.saveBtn.classList.add('success-state'); // Assuming CSS handles color

        // Reset form
        [UI.char.name, UI.char.aliases, UI.char.desc, UI.char.img].forEach(i => i.value = '');
        await browser.storage.local.remove('draft');

        setTimeout(() => {
            UI.char.saveBtn.textContent = originalText;
            UI.char.saveBtn.classList.remove('success-state');
            UI.char.saveBtn.disabled = false;
        }, 2000);
    } catch (err) {
        showStatus("Failed to save character", "error");
        UI.char.saveBtn.disabled = false;
    }
}

const init = async () => {
    await refreshNovelDropdown();
    await syncDraft("load");

    // Persist as you type
    [UI.char.name, UI.char.aliases, UI.char.desc, UI.char.img, UI.novel.select].forEach(el => {
        el.addEventListener(el instanceof HTMLSelectElement ? 'change' : 'input', () => syncDraft("save"));
    });

    UI.novel.saveBtn.onclick = handleSaveNovel;
    UI.char.saveBtn.onclick = handleSaveCharacter;
    UI.novel.toggleBtn.onclick = () => toggleDrawer();
    UI.storage.exportBtn.onclick = exportDatabase;

    // Enter key support
    UI.novel.name.onkeydown = (e) => {
        if (e.key === 'Enter') handleSaveNovel();
    }
    UI.char.name.onkeydown = (e) => {
        if (e.key === 'Enter') handleSaveCharacter();
    }
};

document.addEventListener('DOMContentLoaded', init);