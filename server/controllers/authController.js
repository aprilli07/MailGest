import { google } from "googleapis";
import User from "../models/User.js";
import { oauth2Client, SCOPES } from "../config/googleAuth.js";

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
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("OAuth failed");
  }
};