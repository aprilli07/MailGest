import User from "../models/User.js";

export const requireUser = async (req, res, next) => {
  try {
    // Ensure the user is logged in
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