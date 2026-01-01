import { db } from './schema';

export async function addNovel(title: string) {
    return await db.novels.add({ title, createdAt: Date.now() });
}

export async function getAllNovels() {
    return await db.novels.toArray();
}

export async function addCharacter(novelId: number, name: string, aliases: string[], description: string, imageUrl: string) {
    const existing = await db.characters
        .where('novelId').equals(novelId)
        .filter(c => c.name.toLowerCase() === name.toLowerCase())
        .first();

    if (existing) {
        console.log("Existing character. Overwriting...")
        // Update existing with the new image URL
        return await db.characters.update(existing.id!, { aliases, description, imageUrl });
    }
    return await db.characters.add({
        novelId, name, aliases, description, imageUrl, createdAt: Date.now()
    });
}

export async function getCharactersByNovel(novelId: number) {
    return await db.characters.where('novelId').equals(novelId).toArray();
}

export async function exportDatabase() {
    try {
        const novels = await db.novels.toArray();
        const characters = await db.characters.toArray();
        
        const backup = {
            version: 1,
            timestamp: Date.now(),
            data: { novels, characters }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `goldfish_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export failed:", error);
    }
}