export type RuntimeMessage =
    | { type: "PING" }
    | { type: "GET_CHARACTERS"; novelSlug: string }
    | {
        type: "ADD_CHARACTER";
        novelSlug: string;
        name: string;
        aliases?: string[];
        description?: string;
        imageUrl?: string;
        highlightColor?: string;
    }
    | { type: "RESCAN_PAGE" }
    | { type: "CONTEXT_MENU_ADD_CHARACTER"; text: string };

export function isRuntimeMessage(value: unknown): value is RuntimeMessage {
    if (typeof value !== "object" || value === null || !("type" in value)) return false;

    const message = value as Record<string, unknown>;
    switch (message.type) {
        case "PING":
        case "RESCAN_PAGE":
            return true;
        case "GET_CHARACTERS":
            return typeof message.novelSlug === "string";
        case "CONTEXT_MENU_ADD_CHARACTER":
            return typeof message.text === "string";
        case "ADD_CHARACTER":
            return typeof message.novelSlug === "string"
                && typeof message.name === "string"
                && (message.aliases === undefined || (Array.isArray(message.aliases) && message.aliases.every((alias) => typeof alias === "string")))
                && (message.description === undefined || typeof message.description === "string")
                && (message.imageUrl === undefined || typeof message.imageUrl === "string")
                && (message.highlightColor === undefined || typeof message.highlightColor === "string");
        default:
            return false;
    }
}
