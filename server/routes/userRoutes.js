import express from "express";
import { getUser, logout } from "../controllers/userController.js";
import { requireUser } from "../middleware/requireUser.js";
import User from "../models/User.js"; 

const router = express.Router();

// GET /api/user/me - get current logged in user
router.get("/me", requireUser, getUser);
// POST /api/user/logout - logout current user
router.post("/logout", requireUser, logout);


export default router;