import express from "express";
import { summarizeEmails } from "../controllers/emailController.js";

const router = express.Router();

router.post("/summary", summarizeEmails);

export default router;