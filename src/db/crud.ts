import { db } from './schema';

export async function addNovel(title: string) {
  return await db.novels.add({ title, createdAt: Date.now() });
}

export async function getAllNovels() {
  return await db.novels.toArray();
}

export async function addCharacter(novelId: number, name: string, aliases: string[] = []) {
  return await db.characters.add({
    novelId,
    name,
    aliases,
    imageUrl: undefined
  });
}

export async function getCharactersByNovel(novelId: number) {
  return await db.characters.where('novelId').equals(novelId).toArray();
}