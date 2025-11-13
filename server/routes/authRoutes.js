import express from "express";
import { googleAuth, googleCallback } from "../controllers/authController.js";

const router = express.Router();
// starts google oauth login flow 
router.get("/google", googleAuth);
// handles callback after user grants/denies permission
router.get("/google/callback", googleCallback);
export default router;