import { summarizeThread } from "../services/aiService.js";

// Build prompt, call Gemini (via summarizeThread), parse strict-JSON response,
// and return an array of parsed summary objects corresponding to `messages`.
export async function summarizeMessagesForUser(messages, userId) {
    // handle empty input
    if (!Array.isArray(messages) || messages.length === 0) return [];

    // build prompt for Gemini
    const prompt = `\nYou are an intelligent email summarizer.\nFor each email below, do the following:\n1. Write a concise 1–2 sentence summary.\n2. Assign an importance level: \"High\", \"Medium\", or \"Low\".\n\nReturn ONLY strict JSON with NO extra commentary or markdown fences:\n[\n  {\n    "from": "Sender name (not full address)",\n    "date": "YYYY-MM-DD",\n    "subject": "Subject line",\n    "summary": "Short summary here",\n    "importance": "High | Medium | Low"\n  }\n]\n\nHere are the emails to summarize:\n\n${messages
        .map(
        (m, i) => `Email ${i + 1}:\nFrom: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\nSnippet: ${m.snippet}\n`
        )
        .join("\n")}`;

    // call Gemini 
    const raw = await summarizeThread(prompt, userId);

    // Clean and parse JSON response
    let parsed;
    try {
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) {
        throw new Error("Gemini response was not an array");
        }
    } catch (err) {
        // Re-throw with context so callers can handle gracefully
        const e = new Error("Failed to parse Gemini response: " + (err.message || err));
        e.cause = err;
        throw e;
    }
    // return parsed summaries
    return parsed;
}

export default {
  summarizeMessagesForUser,
};
