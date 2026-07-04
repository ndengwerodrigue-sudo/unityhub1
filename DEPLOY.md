# Unity Hub — Production Deploy Guide

> **Full audit + checklist:** see [DEPLOYMENT.md](./DEPLOYMENT.md)

Stack: **React (Vite)** frontend + **Node.js (Express)** API + **PostgreSQL**.

Recommended hosting:

| Part | Platform |
|------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend API | [Railway](https://railway.app) or [Render](https://render.com) |
| Database | [Neon](https://neon.tech), [Supabase](https://supabase.com), or Railway PostgreSQL |

---

## 1. PostgreSQL database

1. Create a PostgreSQL database (Neon or Supabase is free to start).
2. Copy the connection string → this is your `DATABASE_URL`.
3. The backend runs migrations automatically on startup (`server.js`).

Example:

```env
DATABASE_URL=postgresql://user:password@host.region.neon.tech/unity_hub?sslmode=require
```

---

## 2. Backend (Railway or Render)

### Option A — Railway

1. Push the repo to GitHub.
2. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub**.
3. Set **Root Directory** to `backend`.
4. **Start command:** `npm start`
5. Add environment variables (see list below).
6. Copy the public URL (e.g. `https://unity-hub-api.up.railway.app`).

### Option B — Render

1. Push the repo to GitHub.
2. Render → **New** → **Blueprint** → connect repo (uses `render.yaml` in the repo root),  
   **or** **New Web Service** → root dir `backend`, build `npm install`, start `npm start`.
3. Set env vars and deploy.
4. Health check path: `/api/health`

### Backend environment variables

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://...

JWT_SECRET=long_random_string
JWT_EXPIRE=7d
SESSION_SECRET=another_long_random_string

# Your Vercel frontend URL (add after step 3)
FRONTEND_URL=https://your-app.vercel.app
FRONTEND_URLS=https://your-app.vercel.app
OAUTH_CALLBACK_URL=https://your-api.up.railway.app

# Google OAuth — redirect URI must be:
# https://YOUR-API-URL/api/auth/google/callback
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Brevo email
BREVO_API_KEY=xkeysib-...
FROM_EMAIL=verified-sender@yourdomain.com
FROM_NAME=Unity Hub
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_login@smtp-brevo.com
SMTP_PASS=your_brevo_key
```

**Brevo:** Authorize your server IP at https://app.brevo.com/security/authorised_ips (or disable IP restriction).

**Uploads:** Local `backend/uploads` is ephemeral on Railway/Render. For production media, plan S3/Cloudinary later.

---

## 3. Frontend (Vercel)

1. Push the repo to GitHub.
2. [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. Configure:

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. **Environment variables** (Vercel project settings):

```env
VITE_API_URL=https://your-api.up.railway.app/api
```

5. Deploy. Vercel uses `frontend/vercel.json` for React Router SPA routing.

---

## 4. Connect frontend ↔ backend

After Vercel gives you a URL (e.g. `https://unity-hub.vercel.app`):

1. Update backend env:
   - `FRONTEND_URL=https://unity-hub.vercel.app`
   - `FRONTEND_URLS=https://unity-hub.vercel.app`
2. Redeploy the backend (CORS reads these vars).

---

## 5. Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your OAuth client:

**Authorized JavaScript origins:**

```
https://unity-hub.vercel.app
https://your-api.up.railway.app
```

**Authorized redirect URIs:**

```
https://your-api.up.railway.app/api/auth/google/callback
```

---

## 6. Verify deployment

| Check | URL |
|-------|-----|
| API health | `https://your-api.../api/health` |
| Email config | `https://your-api.../api/health/email` |
| Frontend | `https://your-app.vercel.app` |

Test: register/login, browse opportunities, send a message.

---

## Local vs production

| | Local | Production |
|---|--------|------------|
| Frontend | `http://localhost:3000` | `https://*.vercel.app` |
| API | `http://localhost:5001/api` | `https://*.railway.app/api` |
| Env (frontend) | `frontend/.env` → `VITE_API_URL` | Vercel dashboard |
| Env (backend) | `backend/.env` | Railway/Render dashboard |

---

## Troubleshooting

- **CORS errors** — `FRONTEND_URLS` on backend must include your exact Vercel URL (no trailing slash).
- **401 / session** — cookies use `sameSite: lax`; frontend and API must both be HTTPS in production.
- **OAuth redirect mismatch** — redirect URI must match Google Console exactly.
- **Emails not arriving** — check `/api/health/email` and Brevo sender + IP allowlist.
- **404 on refresh** — ensure `frontend/vercel.json` is deployed (SPA rewrite to `index.html`).
