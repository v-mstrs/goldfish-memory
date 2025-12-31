import { addNovel, getAllNovels, addCharacter } from '../db/crud';

//@ts-ignore
const api: typeof browser = typeof browser !== "undefined" ? browser : (chrome as any);

const elements = {
    select: document.getElementById('novelSelect') as HTMLSelectElement,
    newNovelInput: document.getElementById('newNovelInput') as HTMLInputElement,
    saveNovelBtn: document.getElementById('saveNovelBtn') as HTMLButtonElement,
    drawer: document.getElementById('novelAddDrawer') as HTMLDivElement,
    toggleBtn: document.getElementById('toggleNovelDrawer') as HTMLButtonElement,
    arrow: document.getElementById('arrow') as HTMLSpanElement | null,

    charNameInput: document.getElementById("charName") as HTMLInputElement,
    charAliases: document.getElementById("charAliases") as HTMLInputElement,
    charDesc: document.getElementById("charDesc") as HTMLTextAreaElement,
    charImageUrl: document.getElementById("charImgUrl") as HTMLTextAreaElement, // Matches HTML charImgUrl
    charSaveBtn: document.getElementById("addCharBtn") as HTMLButtonElement,    // Matches HTML addCharBtn
};

const saveDraftState = () => {
    const state = {
        selectedNovel: elements.select.value,
        charName: elements.charNameInput.value,
        charAliases: elements.charAliases.value,
        charDesc: elements.charDesc.value,
        charImg: elements.charImageUrl.value
    };
    api.storage.local.set({ draft: state });
};

const loadDraftState = async () => {
    const data = await api.storage.local.get('draft');
    if (data?.draft) {
        const s = data.draft;
        elements.select.value = s.selectedNovel || "";
        elements.charNameInput.value = s.charName || "";
        elements.charAliases.value = s.charAliases || "";
        elements.charDesc.value = s.charDesc || "";
        elements.charImageUrl.value = s.charImg || "";
    }
};

const toggleDrawer = (forceState?: boolean) => {
    const isHidden = elements.drawer.classList.toggle('hidden', forceState);
    if (elements.arrow) {
        elements.arrow.textContent = isHidden ? '▼' : '▲';
    }
    if (!isHidden) elements.newNovelInput.focus(); // UX: Focus input when opened
};

// 3. Logic: Data Syncing
async function refreshNovelDropdown(selectId?: number) {
    // Optimization: Use a DocumentFragment to minimize reflows
    const fragment = document.createDocumentFragment();
    const novels = await getAllNovels();

    // Keep placeholder (assuming index 0 is placeholder)
    elements.select.length = 1;

    novels.forEach(novel => {
        const option = new Option(novel.title, novel.id!.toString());
        fragment.appendChild(option);
    });

    elements.select.appendChild(fragment);

    if (selectId) {
        elements.select.value = selectId.toString();
    }
}

function showNovelToast(title: string) {
    const toast = document.getElementById('novelToast');
    if (!toast) return;

    toast.textContent = `✔ Novel "${title}" added`;

    toast.classList.remove('hidden', 'hide');
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Wait for fade-out to finish before hiding
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 250);
    }, 1600);
}

async function handleSaveNovel() {
    const title = elements.newNovelInput.value.trim();
    if (!title) return;

    try {
        elements.saveNovelBtn.disabled = true;

        const newId = await addNovel(title);

        elements.newNovelInput.value = '';
        toggleDrawer(true);
        await refreshNovelDropdown(newId);

        showNovelToast(title); // 👈 success indicator
    } catch (err) {
        console.error("Failed to save novel:", err);
        alert("Error saving novel.");
    } finally {
        elements.saveNovelBtn.disabled = false;
    }
}

async function handleSaveCharacter() {
    const novelId = parseInt(elements.select.value);
    const name = elements.charNameInput.value.trim();
    const desc = elements.charDesc.value.trim();
    const img = elements.charImageUrl.value.trim();
    const aliases = elements.charAliases.value.split(',').map(a => a.trim()).filter(a => a !== "");

    if (isNaN(novelId)) {
        alert("Select a novel first!");
        return;
    }
    if (!name) {
        alert("Name is required");
        return;
    }

    if (!desc) {
        alert("Description is required");
        return;
    }

    try {
        elements.charSaveBtn.disabled = true;
        await addCharacter(novelId, name, aliases, desc, img);

        // --- SUCCESS FEEDBACK ---
        const originalText = elements.charSaveBtn.textContent;
        const originalBg = elements.charSaveBtn.style.backgroundColor;

        elements.charSaveBtn.textContent = "✓ Saved!";
        elements.charSaveBtn.style.backgroundColor = "#2e7d32";

        // Reset the form
        elements.charNameInput.value = '';
        elements.charAliases.value = '';
        elements.charDesc.value = '';
        elements.charImageUrl.value = '';

        // revert button after 2 seconds
        setTimeout(() => {
            elements.charSaveBtn.textContent = originalText;
            elements.charSaveBtn.style.backgroundColor = originalBg;
            elements.charSaveBtn.disabled = false;
        }, 2000);

    } catch (err) {
        console.error("Failed to save character:", err);
        elements.charSaveBtn.disabled = false;
    }
}

const init = async () => {
    console.log("%c GOLDFISH-MEMORY LOADED ", "background: #222; color: #bada55; font-size: 20px;");

    await refreshNovelDropdown();
    await loadDraftState();

    // draft Persistence (Save as you type)
    const inputs = [
        elements.charNameInput,
        elements.charAliases,
        elements.charDesc,
        elements.charImageUrl,
        elements.select
    ];

    inputs.forEach(el => {
        const eventType = el instanceof HTMLSelectElement ? 'change' : 'input';
        el.addEventListener(eventType, saveDraftState);
    });

    const onSaveSuccess = async () => {
        console.log("Save initiated...");
        try {
            await handleSaveCharacter();
            // If handleSaveCharacter succeeds, then we clear the draft
            console.log("Save function finished, now clearing draft...");
            await api.storage.local.remove('draft');
        } catch (err) {
            console.error("CRITICAL ERROR IN onSaveSuccess:", err);
        }
    };

    elements.saveNovelBtn?.addEventListener('click', handleSaveNovel);
    elements.charSaveBtn?.addEventListener('click', onSaveSuccess);

    elements.charNameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onSaveSuccess();
    });

    elements.toggleBtn?.addEventListener('click', () => toggleDrawer());
};

document.addEventListener('DOMContentLoaded', init);