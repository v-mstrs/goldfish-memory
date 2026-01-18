import { db } from "./schema";

export async function addNovel(title: string) {
    return await db.novels.add({ title: title.trim(), createdAt: Date.now() });
}

export async function getAllNovels() {
    return await db.novels.toArray();
}

export async function addCharacter(novelId: number, name: string, aliases: string[], description: string, imageUrl: string) {
    const cleanName = name.trim();
    const cleanAliases = aliases.map(a => a.trim()).filter(Boolean);
    const cleanDesc = description.trim();
    const cleanImg = imageUrl.trim();

    // Check for existing character by name (case-insensitive & whitespace-insensitive)
    const existing = await db.characters
        .where("novelId").equals(novelId)
        .filter(c => c.name.trim().toLowerCase() === cleanName.toLowerCase())
        .first();

    if (existing) {
        console.log(`[Goldfish] Updating existing character: ${cleanName}`);
        // Update existing with new details. 
        // We also update 'name' to 'cleanName' to fix any "Encrid " vs "Encrid" storage issues.
        return await db.characters.update(existing.id!, { 
            name: cleanName,
            aliases: cleanAliases, 
            description: cleanDesc, 
            imageUrl: cleanImg 
        });
    }

    return await db.characters.add({
        novelId, 
        name: cleanName, 
        aliases: cleanAliases, 
        description: cleanDesc, 
        imageUrl: cleanImg, 
        createdAt: Date.now()
    });
}

export async function getCharactersByNovel(novelId: number) {
    return await db.characters.where("novelId").equals(novelId).toArray();
}

export async function generateBackupData() {
    const novels = await db.novels.toArray();
    const characters = await db.characters.toArray();
    
    return {
        version: 1,
        timestamp: Date.now(),
        data: { novels, characters }
    };
}

export async function exportDatabase() {
    try {
        const backup = await generateBackupData();

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `goldfish_backup_${new Date().toISOString().split("T")[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export failed:", error);
    }
}

export async function importDatabase(data: { novels: any[], characters: any[] }) {
    await db.transaction("rw", db.novels, db.characters, async () => {
        await Promise.all([
            db.novels.clear(),
            db.characters.clear()
        ]);

        if (data.novels?.length) await db.novels.bulkAdd(data.novels);
        if (data.characters?.length) await db.characters.bulkAdd(data.characters);
    });
}
