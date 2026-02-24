import { browser } from "wxt/browser";

export interface Novel {
    id: number;
    title: string;
    slug: string;
}

export interface Character {
    name: string;
    aliases: string[];
    description: string;
    imageUrl?: string;
}

interface NovelDetailResponse {
    id: number;
    title: string;
    slug: string;
    characters: Array<{
        name: string;
        description: string;
        image_url?: string | null;
        aliases: string[];
    }>;
}

interface CharacterResponse {
    id: number;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export class ApiService {
    private async getBaseUrl(): Promise<string> {
        const { apiBaseUrl } = await browser.storage.local.get("apiBaseUrl");
        const candidate = typeof apiBaseUrl === "string" ? apiBaseUrl.trim() : "";
        return (candidate || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        const baseUrl = await this.getBaseUrl();
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(init?.headers || {})
            }
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(`API ${response.status}: ${message || response.statusText}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return await response.json() as T;
    }

    async addNovel(title: string): Promise<Novel> {
        const trimmedTitle = title.trim();
        const slug = slugify(trimmedTitle);
        if (!slug) {
            throw new Error("Novel slug is empty. Use letters or numbers in the title.");
        }

        return await this.request<Novel>("/", {
            method: "POST",
            body: JSON.stringify({
                title: trimmedTitle,
                slug
            })
        });
    }

    async getAllNovels(): Promise<Novel[]> {
        return await this.request<Novel[]>("/novels");
    }

    async getCharactersByNovelSlug(novelSlug: string): Promise<Character[]> {
        const detail = await this.request<NovelDetailResponse>(`/novels/${encodeURIComponent(novelSlug)}`);
        return detail.characters.map((char) => ({
            name: char.name,
            aliases: char.aliases || [],
            description: char.description || "",
            imageUrl: char.image_url || ""
        }));
    }

    async addCharacter(novelSlug: string, character: Character): Promise<number> {
        const result = await this.request<CharacterResponse>(`/novels/${encodeURIComponent(novelSlug)}/characters`, {
            method: "POST",
            body: JSON.stringify({
                name: character.name.trim(),
                aliases: character.aliases.map(alias => alias.trim()).filter(Boolean),
                description: character.description.trim(),
                image_url: character.imageUrl?.trim() || ""
            })
        });
        return result.id;
    }

}

export const apiService = new ApiService();
