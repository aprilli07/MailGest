import { oauth2Client } from "../config/googleAuth.js";
import User from "../models/User.js";
import { listLatestEmailIds, getMessagesByIds } from "../services/gmailService.js";
import { summarizeMessagesForUser } from "../services/summarizeService.js";

export const summarizeEmails = async (req, res) => {
  try {
    const { emailCount, dateRange, sortBy } = req.body || {};

    const GMAIL_WINDOW_RANGE = "1m";   // last 1 month
    const GMAIL_WINDOW_COUNT = 50;     // up to 50 messages

    // Require login (support JWT via requireUser and cookie-session as fallback)
    const userId = (req.user && req.user._id?.toString()) || req.session.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Not logged in" });
    }

    // Load user
    const user = req.user || (await User.findById(userId));
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Make sure we have Google tokens
    if (!user.googleTokens?.refresh_token && !user.googleTokens?.access_token) {
      return res.status(400).json({ ok: false, error: "No Google tokens" });
    }

    // Refresh access token
    oauth2Client.setCredentials(user.googleTokens);
    const refreshed = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({
      ...user.googleTokens,
      access_token: refreshed?.token,
    });

    // fetch email ID's for recent window to detect new messages
    const gmailMsgRefs = await listLatestEmailIds(
      oauth2Client,
      GMAIL_WINDOW_COUNT,
      GMAIL_WINDOW_RANGE
    );
    // If no messages at all, return empty summaries
    if (!gmailMsgRefs || gmailMsgRefs.length === 0) {
      return res.json({ ok: true, summaries: [] });
    }

    // Existing cached summaries in MongoDB
    const existingSummaries = user.summaries || [];
    const existingById = new Map(existingSummaries.map((s) => [s.id, s]));

    // Identify new IDs
    const newIds = gmailMsgRefs.map((m) => m.id).filter((id) => !existingById.has(id));

    //console.log(`📬 Gmail window refs: ${gmailMsgRefs.length}, new ids: ${newIds.length}`);

    // Detect deleted messages and remove from cache
    const now = Date.now();
    const windowMs = GMAIL_WINDOW_RANGE === "1d" ? 1 * 24 * 60 * 60 * 1000 : GMAIL_WINDOW_RANGE === "1w" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(now - windowMs);

    const existingIdsSet = new Set(gmailMsgRefs.map((m) => m.id));
    const toRemove = existingSummaries.filter((s) => {
      try {
        return new Date(s.date) >= cutoffDate && !existingIdsSet.has(s.id);
      } catch (err) {
        return false;
      }
    }).map((s) => s.id);

    if (toRemove.length > 0) {
      console.log(`🗑️ Removing ${toRemove.length} deleted summaries from DB for user ${user._id}`);
      const remaining = existingSummaries.filter((s) => !toRemove.includes(s.id));
      user.summaries = remaining;
      await user.save();
      // update existingById to reflect removals
      existingById.clear();
      (user.summaries || []).forEach((s) => existingById.set(s.id, s));
    }

    // If no new messages, return cached summaries immediately (fast path)
    if (newIds.length === 0) {
      const allSummaries = (user.summaries || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json({ ok: true, summaries: allSummaries });
    }

    // Otherwise fetch full details only for the new IDs
    const newEmails = await getMessagesByIds(oauth2Client, newIds);

    let newSummaries = [];

    // Only call Gemini for new emails using the shared summarize service
    if (newEmails.length > 0) {
      let parsed;
      try {
        parsed = await summarizeMessagesForUser(newEmails, user._id.toString());
      } catch (err) {
        console.error("❌ Failed to summarize new emails:", err);
        return res.status(500).json({ ok: false, error: "Failed to summarize new emails" });
      }

      // Map summaries back to email IDs and ensure dates are Date objects
      newSummaries = parsed.map((p, idx) => {
        const base = newEmails[idx];
        return {
          id: base.id,
          from: p.from || base.from,
          subject: p.subject || base.subject,
          date: p.date ? new Date(p.date) : new Date(base.date),
          summary: p.summary || "",
          importance: p.importance || "Medium",
        };
      });

      // Merge new summaries into user's cached summaries and save
      const mergedById = new Map(existingSummaries.map((s) => [s.id, s]));
      newSummaries.forEach((s) => mergedById.set(s.id, s));

      user.summaries = Array.from(mergedById.values());
      await user.save();
    }

    // return all summaries 
    const allSummaries = (user.summaries || []).slice().sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.json({ ok: true, summaries: allSummaries });
  } catch (err) {
    console.error("❌ Email summary error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};