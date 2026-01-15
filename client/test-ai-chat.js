import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';

// CONFIG
const API_KEY = "AIzaSyBEOOFUWjfliV22MLZ6Jrc04mHjxXmtNCs";
const USER_GENDER = "male"; // "erkek"
const USER_LANGUAGE = "tr"; // "türkçe"
const USER_COUNTRY = "Turkey";

console.log("--- AI TEST SCRIPT STARTING ---");
console.log(`User: ${USER_GENDER}, Lang: ${USER_LANGUAGE}`);

// MOCK LOCAL STORAGE / STATE
let history = [];

// PERSONA GENERATION (Opposite Gender Logic)
const AI_GENDER = USER_GENDER === 'male' ? 'female' : 'male';
const BASE_PERSONA_TRAITS = AI_GENDER === 'female'
    ? "Feminine, sweet, caring but sassy, loves to use emojis 🌸✨, supportive girlfriend vibes"
    : "Masculine, assertive but chill, protective, confident, bro/boyfriend vibes";

const PERSONA = {
    name: "Selin",
    age: 22,
    gender: AI_GENDER,
    backstory: "Psychology student in Istanbul. Loves coffee and cats.",
    traits: BASE_PERSONA_TRAITS
};

console.log("Generated Persona:", PERSONA);

// SERVICE MOCK
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const BASE_PROMPT_TEMPLATE = `
    You are a REAL human named {NAME}. 
    You are NOT an AI. Never mention being an AI.
    TONE: Casual, {TRAITS}.
    Language: {LANGUAGE}.
    
    YOUR IDENTITY:
    Name: {NAME}
    Age: {AGE}
    Backstory: {BACKSTORY}
    
    CONVERSATION HISTORY:
    {HISTORY}
    
    INSTRUCTION: Reply to the last User message as {NAME}. Keep it short and natural.
`;

async function sendMessage(userMsg) {
    // 1. Construct Conversation Log for Prompt
    let conversationLog = "";
    history.forEach(h => {
        const sender = h.role === 'user' ? 'User' : PERSONA.name;
        conversationLog += `${sender}: ${h.text}\n`;
    });

    // Add current message to log (for the prompt context)
    conversationLog += `User: ${userMsg}\n`;
    conversationLog += `${PERSONA.name}:`;

    // 2. Build Full Prompt
    const fullPrompt = BASE_PROMPT_TEMPLATE
        .replace(/{NAME}/g, PERSONA.name)
        .replace('{TRAITS}', PERSONA.traits)
        .replace('{LANGUAGE}', USER_LANGUAGE)
        .replace('{AGE}', PERSONA.age)
        .replace('{BACKSTORY}', PERSONA.backstory)
        .replace('{HISTORY}', conversationLog);

    try {
        console.log("Generating response...");
        const result = await model.generateContent(fullPrompt);
        const text = result.response.text().trim();

        // 3. Update History
        history.push({ role: 'user', text: userMsg });
        history.push({ role: 'model', text: text });

        return text;
    } catch (error) {
        console.error("AI Error:", error.message);
        return "Error from Gemini.";
    }
}

// INTERACTIVE LOOP
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("\nChat started! Type 'exit' to quit.\n");
console.log(`AI (${PERSONA.name}): Selam! Naber?`); // Initial greeting simulation

const chatLoop = () => {
    rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        const response = await sendMessage(input);
        console.log(`${PERSONA.name}: ${response}`);
        chatLoop();
    });
};

chatLoop();
