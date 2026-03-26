
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { type Character } from "./api";

export interface GeminiCharacterExtraction {
    name: string;
    aliases: string[];
    description: string;
    family?: string;
    alliances?: string;
    abilities?: string;
    match_id?: number;
}

const SYSTEM_INSTRUCTION = `
You are a literary analyst specializing in Chinese cultivation web novels (e.g., Tribulation of Myriad Races).
Your task is to extract character information from the provided chapter text.

You will be given:
1. A list of EXISTING characters (ID, Name, Aliases, Description).
2. The chapter text.

Strict Rules for Character Extraction:
- ONLY extract actual characters. 
- IGNORE common nouns. PREFER full names or unique monikers.
- DO NOT extract characters with no plot relevance.
- DO NOT assume or hallucinate. If unknown, skip the field.
- DO NOT describe interactions with the Main Character (MC) or what happened between them.

Strict Description Template (Fewest words possible):
The 'description' field MUST strictly follow this format: "[Identity]. [Occupation/Rank]. [Cultivation]. [Faculty]. [Research Role]."
- Identity: Brief role (e.g. "Student at Great Xia Academy").
- Occupation/Rank: (e.g. "Deputy Head", "Vice-principal", "Elder", "General"). ONLY if mentioned.
- Cultivation: (e.g. "Soaring Realm").
- Faculty: Choose ONLY from: (Single Character, Multi Character, Beast Tamer, Pill making, Willpower).
- Research Role: Choose ONLY from: (Researcher, Assistant Researcher).
- OMIT any part that is unknown.
- NO fluff. NO history. NO MC interaction.

Fields:
    - name: Primary name.
    - aliases: Other names used in this text.
    - description: The structured minimal string following the template above.
    - family: Relations mentioned.
    - alliances: Sects, groups, or kingdoms.
    - abilities: Techniques or specific powers (brief).

CRITICAL: 
- Return ONLY a JSON array of objects.
- If 'description' would be empty after following the rules, you can still extract the character with just a name if they are important.
`;

const RESPONSE_SCHEMA = {
    description: "List of character extractions",
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            name: { type: SchemaType.STRING, description: "Primary name", nullable: false },
            aliases: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Other names/titles" },
            description: { type: SchemaType.STRING, description: "Minimalist template: [Identity]. [Occupation/Rank]. [Cultivation]. [Faculty]. [Research Role]." },
            family: { type: SchemaType.STRING, description: "Family relations" },
            alliances: { type: SchemaType.STRING, description: "Sects or groups" },
            abilities: { type: SchemaType.STRING, description: "Techniques or powers" },
            match_id: { type: SchemaType.NUMBER, description: "ID of matching character from context" },
        },
        required: ["name", "aliases", "description"],
    },
};

export class AiService {
    private async getGenAI(): Promise<GoogleGenerativeAI> {
        const { geminiApiKey } = await browser.storage.local.get("geminiApiKey");
        if (!geminiApiKey) throw new Error("Gemini API Key not found in settings.");
        return new GoogleGenerativeAI(geminiApiKey);
    }

    async extractCharacters(chapterText: string, existingCharacters: Character[]): Promise<GeminiCharacterExtraction[]> {
        const genAI = await this.getGenAI();
        console.log("[Goldfish AI] Using model: gemini-2.5-flash");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.1,
            }
        });

        const charContext = existingCharacters.map(c => ({
            id: c.id,
            name: c.name,
            aliases: c.aliases,
            description: c.description
        }));

        const prompt = `
EXISTING CHARACTERS CONTEXT:
${JSON.stringify(charContext)}

CHAPTER TEXT TO ANALYZE:
${chapterText}
        `;

        console.log(`[Goldfish AI] Sending request to Gemini... (Context: ${charContext.length} chars, Text: ${chapterText.length} bytes)`);
        
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            console.log("[Goldfish AI] Received raw response from Gemini. Length:", text.length);

            if (!text) {
                throw new Error("Empty response from AI.");
            }

            // Remove markdown code blocks if present
            const cleanJson = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            const parsed = JSON.parse(cleanJson);
            console.log("[Goldfish AI] Successfully parsed JSON. Extractions found:", parsed.length);
            return parsed as GeminiCharacterExtraction[];
        } catch (error) {
            console.error("[Goldfish AI] API or Parsing Error:", error);
            throw error;
        }
    }

    async testConnection(): Promise<void> {
        const genAI = await this.getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log("[Goldfish AI] Testing connection with gemini-2.5-flash...");
        const result = await model.generateContent("Respond with 'OK'");
        const response = await result.response;
        const text = response.text();
        console.log("[Goldfish AI] Test response:", text);
        if (!text.includes("OK")) {
            throw new Error("Unexpected response from Gemini API.");
        }
    }
}

export const aiService = new AiService();
