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