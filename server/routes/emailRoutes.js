import express from "express";
import { summarizeEmails } from "../controllers/emailController.js";
import { requireUser } from "../middleware/requireUser.js";

const router = express.Router();

router.post("/summary", requireUser, summarizeEmails);

export default router;