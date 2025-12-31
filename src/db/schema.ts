import Dexie, { type Table } from 'dexie';

export interface Novel {
  id?: number; // Primary Key
  title: string;
  createdAt: number;
}

export interface Character {
  id?: number;    // Primary Key
  novelId: number; // Foreign Key linking to Novel.id
  name: string;
  aliases: string[];
  imageUrl?: string;
}

export class GoldfishDB extends Dexie {
  novels!: Table<Novel>;
  characters!: Table<Character>;

  constructor() {
    super('GoldfishDB');
    this.version(1).stores({
      novels: '++id, title',           // Index title for searching
      characters: '++id, novelId, name' // Index novelId to find novel's cast fast
    });
  }
}

export const db = new GoldfishDB();