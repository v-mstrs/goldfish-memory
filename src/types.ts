export interface DraftState {
    selectedNovel?: string;
    charName?: string;
    charAliases?: string;
    charDesc?: string;
    charImg?: string;
}

export type DraftMode = "save" | "load";