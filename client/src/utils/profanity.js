// Profanity Filter Removed by User Request
// We keep the class structure to avoid breaking imports in other files.

class ProfanityFilter {
    constructor() {
    }

    isProfane(text) {
        return false;
    }

    clean(text) {
        return text;
    }

    addWords(...words) {
        // No-op
    }
}

export const profanityFilter = new ProfanityFilter();
