# MailGest

MailGest is a web app that connects to your Gmail account, fetches recent messages, and generates concise, prioritized summaries (High/Medium/Low) so you can focus on what matters.

## Overview
- **Purpose:** Quickly triage your inbox with AI-generated summaries.
- **Auth:** Google OAuth 2.0 (secure sign-in via Google).
- **AI:** Summarization powered by a server-side AI service (Gemini/OpenAI compatible).
- **Storage:** User profiles, OAuth tokens, and cached summaries in MongoDB.
- **Deployment:** Frontend on Vercel, backend on Render.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **OAuth:** `googleapis` (OAuth2 Client)
