import { addNovel, getAllNovels } from '../db/crud';

const novelSelect = document.getElementById('novelSelect') as HTMLSelectElement;
const newNovelInput = document.getElementById('newNovelInput') as HTMLInputElement;
const saveNovelBtn = document.getElementById('saveNovelBtn') as HTMLButtonElement;
const novelAddDrawer = document.getElementById('novelAddDrawer') as HTMLDivElement;
const toggleBtn = document.getElementById('toggleNovelDrawer') as HTMLButtonElement;


document.addEventListener('DOMContentLoaded', async () => {
    await refreshNovelDropdown();
});

toggleBtn?.addEventListener('click', () => {
    novelAddDrawer.classList.toggle('hidden');
    const arrow = document.getElementById('arrow');
    if (arrow) arrow.textContent = novelAddDrawer.classList.contains('hidden') ? '▼' : '▲';
});

saveNovelBtn?.addEventListener('click', async () => {
    const title = newNovelInput.value.trim();
    
    if (!title) return;

    try {
        const newId = await addNovel(title);
        console.log(`Novel created with ID: ${newId}`);

        newNovelInput.value = '';
        novelAddDrawer.classList.add('hidden');
        
        await refreshNovelDropdown(newId); 
    } catch (err) {
        console.error("Failed to save novel:", err);
        alert("Error saving novel.");
    }
});

/**
 * Reusable function to clear and reload the dropdown
 * @param selectId Optional: if provided, sets this ID as the active selection
 */
async function refreshNovelDropdown(selectId?: number) {
    // Clear existing options (keep the first placeholder)
    novelSelect.length = 1;

    const novels = await getAllNovels();
    
    novels.forEach(novel => {
        const option = document.createElement('option');
        option.value = novel.id!.toString(); // Dexie IDs are numbers, select values are strings
        option.textContent = novel.title;
        novelSelect.appendChild(option);
    });

    if (selectId) {
        novelSelect.value = selectId.toString();
    }
}