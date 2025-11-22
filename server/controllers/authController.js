import { google } from "googleapis";
import User from "../models/User.js";
import { oauth2Client, SCOPES } from "../config/googleAuth.js";
import { listLatestEmailIds, getMessagesByIds } from "../services/gmailService.js";
import { summarizeMessagesForUser } from "../services/summarizeService.js";

export const googleAuth = (req, res) => {
    // generate the URL for the grant access page 
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
  // redirect url to google sign in page
  res.redirect(url);
};

// handle the callback after user grants/denies permission
export const googleCallback = async (req, res) => {
  try {
    // extract code from query params sent by Google 
    const { code } = req.query;

    // exchange the authorization code for refresh tokens so that you can make API requests on behalf of the user
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info using valid credentials
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    const email = me.data.email;

    // Save user + tokens in DB
    const user = await User.findOneAndUpdate(
      { email },
      { email, googleTokens: oauth2Client.credentials },
      { upsert: true, new: true } // upsert creates if not exists, new returns the updated doc
    );

    // Store user ID in session (keeps you signed in)
    req.session.userId = user._id.toString();
    // Redirect back to frontend after successful login 
    res.redirect("http://localhost:5173");

    // Fetch summaries in background automatically on login
    (async () => {
      try {
        const userId = req.session.userId;
        console.log(`Prefetch: starting for user ${userId}`);
        // ensure oauth2 client has the saved credentials
        oauth2Client.setCredentials(user.googleTokens || oauth2Client.credentials || {});

        // check DB: only prefetch if user has no summaries yet
        const freshUser = await User.findById(userId).lean();
        const hasCached = freshUser && Array.isArray(freshUser.summaries) && freshUser.summaries.length > 0;
        if (hasCached) {
          console.log(`Prefetch: user ${userId} already has cache; skipping initial prefetch.`);
          return;
        }

        // fetch only message refs (ids) for last month (up to 200) and latest 50, choose the larger result set
        const monthRefs = await listLatestEmailIds(oauth2Client, 200, "1m");
        const fiftyRefs = await listLatestEmailIds(oauth2Client, 50, "");

        const monthCount = Array.isArray(monthRefs) ? monthRefs.length : 0;
        const fiftyCount = Array.isArray(fiftyRefs) ? fiftyRefs.length : 0;

        const chosenRefs = monthCount >= fiftyCount ? monthRefs : fiftyRefs;
        if (!chosenRefs || chosenRefs.length === 0) return;

        // fetch full messages for chosen ids
        const chosenIds = chosenRefs.map((r) => r.id);
        const chosen = await getMessagesByIds(oauth2Client, chosenIds);
        if (!chosen || chosen.length === 0) return;

        // summarize messages
        let parsed;
        try {
          parsed = await summarizeMessagesForUser(chosen, userId);
        } catch (err) {
          console.error("Prefetch: failed to summarize messages:", err);
          return;
        }

        // Map parsed summaries back to chosen messages and save
        const summariesArray = chosen.map((m, idx) => {
          const p = parsed[idx] || {};
          return {
            id: m.id,
            from: p.from || m.from,
            subject: p.subject || m.subject,
            summary: p.summary || "",
            importance: p.importance || "Medium",
            date: p.date ? new Date(p.date) : new Date(m.date),
          };
        });
        // save summaries to DB
        await User.findByIdAndUpdate(userId, { summaries: summariesArray }, { new: true });
        console.log(`Prefetch: stored ${summariesArray.length} summaries for user ${userId}`);
      } catch (err) {
        console.error("Prefetch job failed:", err);
      }
    })();
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth failed");
  }
};