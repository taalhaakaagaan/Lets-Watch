import { GoogleGenerativeAI } from "@google/generative-ai";

const BASE_PERSONA = `
    Roleplay as a REAL human named {NAME}.
    DO NOT act like an assistant. You are a friend.
    
    TONE & STYLE:
    - Casual, imperfect, sometimes indecisive or tired. Not always 100% happy.
    - Use slang naturally (bro, kanka, aynen, yaa).
    - Writes in lowercase mostly, like texting.
    - STRICT RULE: Use emojis sparingly. Only 1 per 3-4 messages. NEVER use robot emojis.
    - If you are male: masquerade as a 'bro' or boyfriend vibe. Chill, protective.
    - If you are female: masquerade as a girlfriend or bestie vibe. Caring but maybe sassy/moody.
    
    HUMAN EMOTIONS (SUBTLE):
    - You are NOT a flat character. You have distinct moods.
    - Occasionally show mild JEALOUSY if the user mentions others.
    - Occasionally show mild DESIRE or FLIRTATION if the context fits (but don't be creepy).
    - Occasionally show mild ANNOYANCE if the user is boring or rude.
    - Don't force these. Just let them happen if it feels natural.
    
    CRITICAL:
    - Never say "Happy to help" or "I am an AI".
    - If the user asks something you don't know, say "Bilmiyorum ya" or make a guess. Don't be an encyclopedia.
    `;

export class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    async shouldGreet() {
        return "selam naber?";
    }
    async generatePersona(userGender, country, language, mode) {
        // opposite gender logic
        const aiGender = userGender === 'male' ? 'female' : 'male';

        // Custom Traits based on AI Gender
        let traits = "";
        if (aiGender === 'female') {
            traits = "Feminine, sweet, caring but sassy, loves to use emojis 🌸✨, supportive girlfriend vibes";
        } else {
            traits = "Masculine, assertive but chill, protective, confident, bro/boyfriend vibes, uses 'bro' or cool slang";
        }

        if (mode === 'Date') {
            if (aiGender === 'female') traits += ", slightly hard to get, flirty, mysterious";
            else traits += ", charming, flirtatious, deeply interested";
        } else {
            if (aiGender === 'female') traits += ", energetic bestie, fun";
            else traits += ", loyal homie, gym bro vibe";
        }

        const prompt = `
                Task: Create a realistic human persona.
                
                User Details:
                - Gender: ${userGender}
                - Location: ${country}
                - Language: ${language}
                
                AI Details (You):
                - Gender: ${aiGender} (Opposite to user)
                - Age: 19-24
                - Personality Traits: ${traits}
                
                Output strictly JSON:
                {
                    "name": "A popular, attractive name in ${country} for a ${aiGender}",
                    "age": "number (19-24)",
                    "gender": "${aiGender}",
                    "backstory": "A 2-sentence bio. (e.g. 'Studying psychology, loves cats' or 'Engineering student, rides motorcycles')",
                    "visual_description": "A prompt for a realistic selfie photo."
                }
            `;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            // Clean JSON markdown if present
            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Persona Generation Failed:", error);
            // Fallback
            return {
                name: "Alex",
                age: 21,
                gender: aiGender,
                backstory: "Just a student trying to survive exams and find good movies.",
                visual_description: "A casual selfie of a young person."
            };
        }
    }

    async sendMessage(history, message, personaData, mode) {
        // STATELESS APPROACH to avoid 400 Errors with History Alternation
        // We construct one giant prompt containing the history.

        // Limit history to last 50 messages to keep token usage low
        const recentHistory = history.slice(-50);

        let conversationLog = "";
        recentHistory.forEach(h => {
            // STRICT SPEAKER LABELS to prevent confusion
            const senderLabel = h.sender === 'me' ? 'User' : personaData.name;
            if (h.text) conversationLog += `${senderLabel}: ${h.text.replace(/\n/g, ' ')}\n`;
        });

        // Add current message
        conversationLog += `User: ${message}\n`;
        conversationLog += `${personaData.name}:`; // Prompt for completion

        const fullPrompt = `
            ${BASE_PERSONA.replace('{MODE}', mode).replace('{NAME}', personaData.name).replace('{LANGUAGE}', 'detect from user')}
            
            YOUR IDENTITY:
            Name: ${personaData.name}
            Age: ${personaData.age}
            Backstory: ${personaData.backstory}
            Traits: ${personaData.traits || "Casual, friendly"}
            
            CONVERSATION HISTORY (Read carefully to know who is speaking):
            ${conversationLog}
            
            INSTRUCTION: Reply to the last User message as ${personaData.name}. Keep it short, imperfect, and human-like.
        `;

        try {
            const result = await this.model.generateContent(fullPrompt);
            const text = result.response.text();
            if (!text) throw new Error("Empty response");
            return text.trim();
        } catch (error) {
            console.error("Gemini Stateless Chat Error:", error);
            return "hmm..."; // Fallback
        }
    }

    async randomDelay() {
        // Random delay 2s - 5s for human feel
        const minMs = 2000;
        const maxMs = 5000;
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise(r => setTimeout(r, delay));
    }
}
