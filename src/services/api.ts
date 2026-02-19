import { browser } from "wxt/browser";

export interface Novel {
    id?: number;
    title: string;
    createdAt: number;
    updatedAt?: number;
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

const DEFAULT_API_BASE_URL = "http://raspberrypi.local:8000";

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

    async addNovel(title: string): Promise<number> {
        const result = await this.request<{ id: number }>("/novels", {
            method: "POST",
            body: JSON.stringify({ title: title.trim() })
        });
        return result.id;
    }

    async getAllNovels(): Promise<Novel[]> {
        return await this.request<Novel[]>("/novels");
    }

    async getCharactersByNovel(novelId: number): Promise<Character[]> {
        return await this.request<Character[]>(`/novels/${novelId}/characters`);
    }

    async addCharacter(character: Omit<Character, "id" | "createdAt" | "updatedAt">): Promise<number> {
        const result = await this.request<{ id: number }>("/characters", {
            method: "POST",
            body: JSON.stringify({
                novelId: character.novelId,
                name: character.name.trim(),
                aliases: character.aliases.map(alias => alias.trim()).filter(Boolean),
                description: character.description.trim(),
                imageUrl: character.imageUrl?.trim() || ""
            })
        });
        return result.id;
    }

}

export const apiService = new ApiService();
