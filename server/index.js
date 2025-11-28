import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieSession from "cookie-session";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";

dotenv.config(); // load .env file
//console.log("✅ OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);
//console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
const app = express(); 

// Ensure secure cookies are set behind proxies (Render/Heroku/Vercel)
app.set("trust proxy", 1);

// CORS: allow local dev and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN
].filter(Boolean);

// helper to check if origin is allowed
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // non-browser / same-origin
  if (allowedOrigins.includes(origin)) return true;
  // Allow any Vercel preview or production subdomain
  try {
    const url = new URL(origin);
    const host = url.host;
    if (host.endsWith(".vercel.app")) return true;
  } catch {}
  return false;
};

// Determines if origin is allowed and sets CORS accordingly
// Determines if backend should allow incoming requests from frontend
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// cookie session middleware (stores user id after OAuth safely)
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.COOKIE_DOMAIN || undefined,
    httpOnly: true
  })
);

// connect to MongoDB Atlas
connectDB();

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", emailRoutes);

// health check for Render
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

