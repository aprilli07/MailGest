# MailGest Deployment Guide

This guide covers deploying the backend to Render, the frontend to Vercel, and setting up Google OAuth.

## Prerequisites
- Google Cloud project with OAuth consent screen configured.
- MongoDB Atlas cluster URI.
- (Optional) Upstash Redis credentials.

## 1) Google OAuth Setup
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `https://your-frontend.vercel.app`
   - Authorized redirect URIs:
     - `https://your-backend.onrender.com/auth/google/callback`
3. Save `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 2) Backend (Render)
1. In Render, create a new Web Service from the `server` folder (Node.js).
2. Set build command: `npm install` and start command: `node index.js`.
3. Add environment variables (from `server/.env.example`):
   - `PORT=8080`
   - `NODE_ENV=production`
   - `CLIENT_ORIGIN=https://your-frontend.vercel.app`
   - `MONGODB_URI=...`
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/auth/google/callback`
   - `JWT_SECRET=...`
   - `SESSION_SECRET=...`
   - (Optional) `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
4. Confirm health check path `/health`.
5. Deploy and note the backend URL: `https://your-backend.onrender.com`.

## 3) Frontend (Vercel)
1. Import the `client` folder into Vercel.
2. Set the Framework as Vite/React (static build). Vercel will run `npm install && npm run build`.
3. Add environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID=...`
4. Deploy and note the frontend URL: `https://your-frontend.vercel.app`.

## 4) Local Testing
- Server: from `server/`, run `npm install && npm run dev` (ensure `.env` present).
- Client: from `client/`, run `npm install && npm run dev` and set `VITE_API_URL=http://localhost:8080`.

## 5) Production Cookie & CORS Notes
- `cookie-session` is configured to use `sameSite=none` and `secure=true` in production for cross-site cookies.
- `CLIENT_ORIGIN` must match your Vercel domain.
- If you change domains, update both Google OAuth and `CLIENT_ORIGIN`.

## 6) Troubleshooting
- 401 after OAuth: Check cookies are set; ensure HTTPS and `sameSite=none`.
- CORS error: Verify `CLIENT_ORIGIN` env in Render matches Vercel domain exactly.
- Redirect mismatch: Ensure Google redirect URI matches Render backend callback URL.
