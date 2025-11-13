import User from "../models/User.js";

export const getUser = async (req, res) => {
    const user = req.user;
    //console.log("➡️ /api/me hit, session:", req.session);
    
  res.json({
    ok: true,
    user: {
      id: user._id,
      email: user.email,
    },
  });
};

// logout user by clearing session
export const logout = (req, res) => {
  req.session = null;
  res.json({ ok: true, message: "Logged out successfully" });
};