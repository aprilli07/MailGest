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

// enables CORS so react dev server can talk to this API
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// cookie session middleware (stores user id after OAuth safely)
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "lax",             // helps with cookies across localhost:4000 ↔ 5173
    secure: false,               // true only if using HTTPS
    httpOnly: true               // prevents client-side JS access
  })
);

// connect to MongoDB Atlas
connectDB();

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", emailRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

