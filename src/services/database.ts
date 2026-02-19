import Dexie, { type Table } from "dexie";

export interface Novel {
    id?: number;
    title: string;
    createdAt: number;
    updateAt?: number;
}

export interface Character {
    id?: number;
    novelId: number;
    name: string;
    aliases: string[];
    description: string;
    imageUrl?: string;
    createdAt: number;
    updatedAt?: number;
}

export class DatabaseService extends Dexie {
    novels!: Table<Novel>;
    characters!: Table<Character>;

    constructor() {
        super("GoldfishDB");
        this.version(2).stores({
            novels: "++id, title, createdAt",
            characters: "++id, &[novelId+name], novelId, name, createdAt"
        });
    }

    async addNovel(title: string): Promise<number> {
        return await this.novels.add({
            title: title.trim(),
            createdAt: Date.now()
        });
    }

    async getAllNovels(): Promise<Novel[]> {
        return await this.novels.toArray();
    }

    async getCharactersByNovel(novelId: number): Promise<Character[]> {
        return await this.characters.where("novelId").equals(novelId).toArray();
    }

    async addCharacter(character: Omit<Character, "id" | "createdAt" | "updatedAt">): Promise<number> {
        const cleanName = character.name.trim();
        const cleanAliases = character.aliases.map(a => a.trim()).filter(Boolean);
        const cleanDesc = character.description.trim();
        const cleanImg = character.imageUrl?.trim();

        const now = Date.now();

        const existing = await this.characters
            .where("[novelId+name]")
            .equals([character.novelId, cleanName])
            .first();

        if (existing) {
            await this.characters.update(existing.id, {
                name: cleanName,
                aliases: cleanAliases,
                description: cleanDesc,
                imageUrl: cleanImg,
                updatedAt: now
            });

            return existing.id!;
        }

        return await this.characters.add({
            novelId: character.novelId,
            name: cleanName,
            aliases: cleanAliases,
            description: cleanDesc,
            imageUrl: cleanImg,
            createdAt: now,
            updatedAt: now
        });
    }

    async getBackupData() {
        const [novels, characters] = await Promise.all([
            this.novels.toArray(),
            this.characters.toArray()
        ]);

        return {
            version: 2,
            timestamp: Date.now(),
            data: { novels, characters }
        };
    }

    async importData(data: { novels: Novel[], characters: Character[] }): Promise<void> {
        await this.transaction("rw", this.novels, this.characters, async () => {
            await Promise.all([
                this.novels.clear(),
                this.characters.clear()
            ]);

            if (data.novels?.length) await this.novels.bulkAdd(data.novels);
            if (data.characters?.length) await this.characters.bulkAdd(data.characters);
        });
    }
}

export const dbService = new DatabaseService();
