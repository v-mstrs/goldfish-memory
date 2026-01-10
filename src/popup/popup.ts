import { addNovel, getAllNovels, addCharacter, exportDatabase } from '../db/crud';
import { type DraftMode, type DraftState } from '../types'
import browser from "webextension-polyfill";


const UI = {
    novel: {
        select: document.getElementById('novelSelect') as HTMLSelectElement,
        name: document.getElementById('newNovel') as HTMLInputElement,
        saveBtn: document.getElementById('saveNovelBtn') as HTMLButtonElement,
        toggleBtn: document.getElementById('toggleNovelDrawer') as HTMLButtonElement,
        toast: document.getElementById('novelToast'),
        arrow: document.getElementById('arrow'),
        drawer: document.getElementById('novelAddDrawer') as HTMLDivElement,
    },
    char: {
        name: document.getElementById("charName") as HTMLInputElement,
        aliases: document.getElementById("charAliases") as HTMLInputElement,
        desc: document.getElementById("charDesc") as HTMLTextAreaElement,
        img: document.getElementById("charImgUrl") as HTMLInputElement,
        saveBtn: document.getElementById("addCharBtn") as HTMLButtonElement,
    },
    storage: { // json 
        importBtn: document.getElementById('importBtn') as HTMLButtonElement,
        exportBtn: document.getElementById('exportBtn') as HTMLButtonElement,
    }
};

async function syncDraft(mode: DraftMode) {
    if (mode === 'save') {
        const state = {
            selectedNovel: UI.novel.select.value,
            charName: UI.char.name.value,
            charAliases: UI.char.aliases.value,
            charDesc: UI.char.desc.value,
            charImg: UI.char.img.value
        };
        return browser.storage.local.set({ draft: state });
    }

    if (mode === 'load') {
        const data = await browser.storage.local.get('draft');
        const s = data?.draft as DraftState

        if (s) {
            UI.novel.select.value = s.selectedNovel || "";
            UI.char.name.value = s.charName || "";
            UI.char.aliases.value = s.charAliases || "";
            UI.char.desc.value = s.charDesc || "";
            UI.char.img.value = s.charImg || "";
        }
    }
}

const toggleDrawer = (forceState?: boolean) => {
    const isHidden = UI.novel.drawer.classList.toggle('hidden', forceState);

    // ONLY update the text of the ARROW span, not the whole drawer!
    if (UI.novel.arrow) {
        UI.novel.arrow.textContent = isHidden ? '▼' : '▲';
    }

    if (!isHidden) {
        UI.novel.name.focus();
    }
};

// Data Syncing
async function refreshNovelDropdown(selectId?: number) {
    // Optimization: Use a DocumentFragment to minimize reflows
    const fragment = document.createDocumentFragment();
    const novels = await getAllNovels();

    // Keep placeholder (assuming index 0 is placeholder)
    UI.novel.select.length = 1;

    novels.forEach(novel => {
        const option = new Option(novel.title, novel.id!.toString());
        fragment.appendChild(option);
    });

    UI.novel.select.appendChild(fragment);

    if (selectId) {
        UI.novel.select.value = selectId.toString();
    }
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showNovelToast(title: string) {
    showStatus(`✔ Novel "${title}" added`, 'success');
}

async function handleSaveNovel() {
    const title = UI.novel.name.value.trim();

    if (!title) {
        showStatus("Novel title required", "error");
        return;
    }

    try {
        UI.novel.saveBtn.disabled = true;

        const newId = await addNovel(title);
        UI.novel.name.value = '';
        toggleDrawer(true);
        await refreshNovelDropdown(newId);
        showNovelToast(title);
        console.log(`Saved novel: ${title}`)
    } catch (err) {
        console.error("Failed to save novel:", err);
        alert("Error saving novel.");
    } finally {
        UI.novel.saveBtn.disabled = false;
    }
}

async function handleSaveCharacter() {
    const novelId = parseInt(UI.novel.select.value);
    const name = UI.char.name.value.trim();
    const desc = UI.char.desc.value.trim();
    const img = UI.char.img.value.trim();
    const aliases = UI.char.aliases.value
        .split(',')
        .map(a => a.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    if (isNaN(novelId)) {
        showStatus("Select a novel first!", "error");
        return;
    }
    if (!name) {
        showStatus("Name is required", "error");
        return;
    }

    if (!desc) {
        showStatus("Description is required", "error");
        return;
    }

    try {
        UI.char.saveBtn.disabled = true;
        await addCharacter(novelId, name, aliases, desc, img);

        // --- SUCCESS FEEDBACK ---
        const originalText = UI.char.saveBtn.textContent;
        const originalBg = UI.char.saveBtn.style.backgroundColor;

        UI.char.saveBtn.textContent = "✓ Saved!";
        UI.char.saveBtn.style.backgroundColor = "#2e7d32";

        // Reset the form
        UI.char.name.value = '';
        UI.char.aliases.value = '';
        UI.char.desc.value = '';
        UI.char.img.value = '';

        // revert button after 2 seconds
        setTimeout(() => {
            UI.char.saveBtn.textContent = originalText;
            UI.char.saveBtn.style.backgroundColor = originalBg;
            UI.char.saveBtn.disabled = false;
        }, 2000);
        
        return true;
    } catch (err) {
        console.error("Failed to save character:", err);
        UI.char.saveBtn.disabled = false;
        return false;
    }
}

function showStatus(message: string, type: 'success' | 'error' = 'success') {
    const toast = UI.novel.toast;
    if (!toast) return;

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toast.textContent = message;
    toast.classList.remove('hidden');

    // Change color based on error or success
    if (type === 'error') {
        toast.style.background = "#441a1a"; // Dark red
        toast.style.borderColor = "#ff5f5f"; // Bright red border
        toast.style.color = "#ffbaba";
    } else {
        toast.style.background = "#1f3d2b"; // Your original green
        toast.style.borderColor = "#28a745";
        toast.style.color = "#8ff0b0";
    }

    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
        toastTimeout = null;
    }, 1500);
}

const init = async () => {
    console.log("%c GOLDFISH-MEMORY LOADED ", "background: #222; color: #bada55; font-size: 20px;");

    await refreshNovelDropdown();
    await syncDraft("load");

    // draft Persistence (Save as you type)
    const inputs = [
        UI.char.name,
        UI.char.aliases,
        UI.char.desc,
        UI.char.img,
        UI.novel.select
    ];

    inputs.forEach(el => {
        const eventType = el instanceof HTMLSelectElement ? 'change' : 'input';
        el.addEventListener(eventType, () => syncDraft("save"));
    });

    const onSaveSuccess = async () => {
        console.log("Save initiated...");
        try {
            const success = await handleSaveCharacter();
            if (success) {
                // If handleSaveCharacter succeeds, then we clear the draft
                console.log("Save function finished, now clearing draft...");
                await browser.storage.local.remove('draft');
            }
        } catch (err) {
            console.error("CRITICAL ERROR IN onSaveSuccess:", err);
        }
    };

    UI.novel.saveBtn?.addEventListener('click', handleSaveNovel);
    UI.novel.name?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveNovel();
    });

    UI.char.saveBtn?.addEventListener('click', onSaveSuccess);
    UI.char.name?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onSaveSuccess();
    });

    UI.novel.toggleBtn?.addEventListener('click', () => toggleDrawer());
    UI.storage.exportBtn?.addEventListener('click', async () => {
        await exportDatabase();
        console.log("Database exported successfully");
    });
};

document.addEventListener('DOMContentLoaded', init);
