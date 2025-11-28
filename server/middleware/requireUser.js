import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Vercel and Render have two different domains and browsers DO NOT send
// // cookies across different domains -> use JWT to authenticate instead

// authentication middleware to require a logged-in user
export const requireUser = async (req, res, next) => {
  try {
    // Allow JWT via Authorization header as alternative to cookie-session
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      try {
        const token = auth.slice(7);
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.userId) {
          const user = await User.findById(payload.userId);
          if (user) {
            req.user = user;
            return next();
          }
        }
      } catch (e) {
      }
    }
    // Ensure the user is logged in (cookie-session fallback)
    if (!req.session.userId) {
      console.warn("requireUser: missing session.userId", {
        cookies: req.headers.cookie,
        session: req.session,
        origin: req.headers.origin,
      });
      return res.status(401).json({ ok: false, error: "Not logged in" });
    }

    // Look up the user in the database
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    // Attach user to request so controllers can access it
    req.user = user;
    next(); // Continue to the next function (controller)
  } catch (err) {
    console.error("Error in requireUser middleware:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};