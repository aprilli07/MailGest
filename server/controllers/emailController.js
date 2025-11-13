import { oauth2Client } from "../config/googleAuth.js";
import User from "../models/User.js";
import { listLatestEmails, getThreadBodies } from "../services/gmailService.js";
import { summarizeThread } from "../services/aiService.js";

export const summarizeEmails = async (req, res) => {
  try {
    //console.log("🔹 summarizeEmails called. Body:", req.body);

    // extract parameters
    const { emailCount, dateRange, sortBy } = req.body || {};

    // emailCount = 0 → fetch many so filtering works
    const count = Number(emailCount) > 0 ? Number(emailCount) : 100;

    // "all" → no date filter
    const range = dateRange === "all" ? "" : dateRange;

    // ensure logged in
    if (!req.session.userId) {
      return res.status(401).json({ ok: false, error: "Not logged in" });
    }

    // find user
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // verify tokens
    if (!user.googleTokens?.refresh_token && !user.googleTokens?.access_token) {
      return res.status(400).json({ ok: false, error: "No Google tokens" });
    }

    // refresh access token
    oauth2Client.setCredentials(user.googleTokens);
    const refreshed = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({
      ...user.googleTokens,
      access_token: refreshed?.token,
    });

    // fetch emails
    const emails = await listLatestEmails(oauth2Client, count, range);
    //console.log("📬 Fetched emails:", emails.length);

    if (!emails || emails.length === 0) {
      return res.json({ ok: true, summaries: [] });
    }

    // build summarization prompt
    const prompt = `
    You are an intelligent email summarizer.  
    For each email below, do the following:
    1. Write a concise 1–2 sentence summary.
    2. Assign an importance level: High, Medium, Low.

    Return ONLY strict JSON:
    [
      {
        "from": "",
        "date": "",
        "subject": "",
        "summary": "",
        "importance": ""
      }
    ]

    Emails:
    ${emails
      .map(
        (m, i) => `
    Email ${i + 1}:
    From: ${m.from}
    Date: ${m.date}
    Subject: ${m.subject}
    Snippet: ${m.snippet}
    `
      )
      .join("\n")}
    `;
    
    // save the raw ouput form Gemini  
    let result = await summarizeThread(prompt);

    // Parse Gemini output (get rid of extra ''' stuff)
    let summaries = [];
    try {
      const cleaned = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      summaries = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ Failed to parse Gemini response:", err);
      summaries = [{ summary: result, importance: "Unknown" }];
    }

    //console.log("✅ Parsed summaries:", summaries);

    return res.json({ ok: true, summaries });

  } catch (err) {
    console.error("❌ Email summary error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};