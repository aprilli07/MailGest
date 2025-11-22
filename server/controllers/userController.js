import User from "../models/User.js";

export const getUser = async (req, res) => {
  const user = req.user;
  //console.log("➡️ /api/me hit, session:", req.session);
    
  // determine if cache is ready
  const cacheReady = Array.isArray(user.summaries) && user.summaries.length > 0;
  const cachedCount = Array.isArray(user.summaries) ? user.summaries.length : 0;

  res.json({
    ok: true,
    user: {
      id: user._id,
      email: user.email,
      cacheReady,
      cachedCount,
    },
  });
};

// logout user by clearing session
export const logout = (req, res) => {
  req.session = null;
  res.json({ ok: true, message: "Logged out successfully" });
};