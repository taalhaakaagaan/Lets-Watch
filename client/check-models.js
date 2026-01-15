// check-models.js
const API_KEY = "AIzaSyBEOOFUWjfliV22MLZ6Jrc04mHjxXmtNCs";

async function list() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(m.name);
                    // Check supported generation methods
                    console.log(" - Support:", m.supportedGenerationMethods);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

list();
