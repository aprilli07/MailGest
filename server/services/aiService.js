import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
import { ratelimit } from "../config/upstash.js";

// reads model and API key from .env file
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // fallback just in case

// summarize a batch of emails
export async function summarizeThread(prompt, userId = "global") {
  try {
    //  Apply rate limiting (per user or global), wait if necessary
    const { success, reset } = await ratelimit.limit(userId);
    if (!success) {
      const waitTime = Math.max(1000, reset * 1000 - Date.now());
      console.log(`⏳ Rate limit hit, waiting ${waitTime / 1000}s...`);
      await new Promise((res) => setTimeout(res, waitTime));
    }

    // Call Gemini API once with the full prompt
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    // Retry on 503 (model overloaded)
    if (res.status === 503) {
      console.warn("⚠️ Gemini overloaded — retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
      return summarizeThread(prompt, userId);
    }

    // Handle errors
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    // Parse the response and extract the summary text
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(No summary)";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "(Error summarizing batch)";
  }
}