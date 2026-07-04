# Unity Hub — Production Deployment Guide

**Stack:** React 18 + Vite (frontend) · Node.js + Express (API) · PostgreSQL

**Audit date:** July 2026

---

## Architecture

| Layer | Technology | Host recommendation |
|-------|------------|---------------------|
| Frontend | React, Vite, Tailwind | **Vercel** |
| API | Node.js, Express | **Railway** or **Render** |
| Database | PostgreSQL | **Neon**, **Supabase**, or Railway Postgres |
| Email | Brevo (API + SMTP) | Brevo dashboard |
| File uploads | Local `backend/uploads` | Ephemeral on PaaS — use S3/Cloudinary for prod |

This repo is a **monorepo** with separate apps:

```
Real_Unity_Hub/
├── frontend/          # React SPA (deploy to Vercel)
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
├── backend/           # Express API (deploy to Railway/Render)
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── render.yaml        # Optional Render blueprint (backend)
└── DEPLOYMENT.md      # This file
```

There is **no root `package.json`** — install and build each app separately.

---

## Pre-deploy checklist

Run locally before deploying:

```bash
# Backend
cd backend
cp .env.example .env          # fill in values
npm install
npm start                     # → http://localhost:5001/api/health

# Frontend
cd frontend
cp .env.example .env
npm install
npm run build                 # → frontend/dist/
npm run preview               # optional smoke test
```

### Health endpoints

| URL | Expected |
|-----|----------|
| `GET /api/health` | `{ "message": "Unity Hub API is running" }` |
| `GET /api/health/email` | `brevoApiOk: true` or `smtpOk: true` |

---

## Environment variables

### Frontend (`frontend/.env` → Vercel env)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | **Yes** | `https://api.yourdomain.com/api` |
| `VITE_AUTH_VIDEO` | No | `/auth/hero.mp4` |

### Backend (`backend/.env` → Railway/Render env)

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Auto | Set by host (5001 locally) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string with `?sslmode=require` for cloud DB |
| `JWT_SECRET` | **Yes** | Long random string — **never use `change_me_in_production`** |
| `JWT_EXPIRE` | No | Default `7d` / `1d` |
| `JWT_REMEMBER_EXPIRE` | No | Default `30d` |
| `SESSION_SECRET` | **Yes** | Long random string for OAuth sessions |
| `FRONTEND_URL` | **Yes** | `https://your-app.vercel.app` |
| `FRONTEND_URLS` | **Yes** | Comma-separated allowed CORS origins |
| `OAUTH_CALLBACK_URL` | **Yes** | Public API base, e.g. `https://api.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | For Google login | |
| `GOOGLE_CLIENT_SECRET` | For Google login | |
| `GITHUB_CLIENT_ID` | Optional | |
| `GITHUB_CLIENT_SECRET` | Optional | |
| `BREVO_API_KEY` | For email | `xkeysib-...` from Brevo |
| `FROM_EMAIL` | For email | Must be verified in Brevo |
| `FROM_NAME` | No | `Unity Hub` |
| `SMTP_HOST` | Fallback | `smtp-relay.brevo.com` |
| `SMTP_PORT` | Fallback | `587` |
| `SMTP_USER` | Fallback | `*@smtp-brevo.com` |
| `SMTP_PASS` | Fallback | Brevo SMTP key |

**Brevo:** Authorize your server IP at https://app.brevo.com/security/authorised_ips or disable IP restriction.

---

## Deploy frontend (Vercel)

1. Push repo to GitHub.
2. Vercel → **Import Project** → select repo.
3. Settings:

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Environment variable:
   ```
   VITE_API_URL=https://YOUR-API-URL/api
   ```
5. Deploy. `frontend/vercel.json` handles SPA routing (React Router).

---

## Deploy backend (Railway)

1. Railway → **New Project** → **Deploy from GitHub**.
2. Set **Root Directory** → `backend`.
3. **Start command:** `npm start`
4. Add all backend env vars from the table above.
5. Attach or link a PostgreSQL plugin → set `DATABASE_URL`.
6. Copy the public URL (e.g. `https://unity-hub-api.up.railway.app`).

### Deploy backend (Render)

Use the included `render.yaml` blueprint, or:

- Root dir: `backend`
- Build: `npm install`
- Start: `npm start`
- Health check: `/api/health`

---

## Connect frontend ↔ backend

After both are live:

1. Set on **backend**:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   FRONTEND_URLS=https://your-app.vercel.app
   OAUTH_CALLBACK_URL=https://your-api.up.railway.app
   ```
2. Redeploy backend.
3. Update **Vercel** `VITE_API_URL` if needed and redeploy frontend.

### Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/) → Credentials:

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
https://your-api.up.railway.app
```

**Authorized redirect URIs:**
```
https://your-api.up.railway.app/api/auth/google/callback
```

---

## Production audit report

### Passed

| Check | Result |
|-------|--------|
| Separate `frontend/package.json` | OK |
| Separate `backend/package.json` | OK |
| `npm install` (frontend) | OK |
| `npm install` (backend) | OK |
| `npm run build` (frontend) | OK — builds to `frontend/dist/` |
| Backend starts | OK — connects to PostgreSQL, runs migrations |
| Env examples | `frontend/.env.example`, `backend/.env.example` |
| Vercel SPA config | `frontend/vercel.json` |
| Render blueprint | `render.yaml` |

### Fixed in this audit

| Issue | Action taken |
|-------|----------------|
| No `.gitignore` | Created root `.gitignore` |
| `frontend/dist/` committed | Removed from git index (rebuild on deploy) |
| `node_modules/` committed (~28k files) | Removed from git index |
| `backend/.env` committed | Removed from git index — **rotate all secrets** |
| Missing `DEPLOYMENT.md` | This file |

### Blocking issues (action required)

| Priority | Issue | What to do |
|----------|-------|------------|
| **CRITICAL** | Fresh Railway/Neon DB has no tables | Fixed: server runs `bootstrap-schema.js` on startup. Redeploy backend after pulling latest code. |
| **CRITICAL** | `backend/.env` was in git history | Rotate `JWT_SECRET`, `BREVO_API_KEY`, `GOOGLE_CLIENT_SECRET`, DB password. |
| **CRITICAL** | `JWT_SECRET=change_me_in_production` in local `.env` | Generate strong secrets before production deploy |
| **HIGH** | Brevo IP restriction | Authorize deploy server IP in Brevo or emails will fail |
| **HIGH** | `node_modules` was tracked | Run `git add .gitignore` and commit the untrack changes (see below) |
| **MEDIUM** | Uploads stored on local disk | Railway/Render disks are ephemeral — plan S3/Cloudinary for media |
| **MEDIUM** | DB migrations need table owner | Some `ALTER TABLE` fail without superuser — run SQL as DB owner on Neon |
| **MEDIUM** | Large JS bundle (~1.1 MB) | Consider code-splitting later (not blocking deploy) |
| **LOW** | `mongoose` in backend deps but unused | Uses PostgreSQL/`pg` only — safe to remove later |
| **LOW** | README still mentions MongoDB | Update README when convenient |

### Commit the gitignore cleanup

After this audit, stage and commit:

```bash
git add .gitignore DEPLOYMENT.md backend/uploads/.gitkeep
git add frontend/.env.example backend/.env.example
git commit -m "chore: add .gitignore, remove secrets/build artifacts from tracking"
```

If `git rm --cached` was run for `node_modules`, `dist`, and `.env`, include those changes in the same commit.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error | Add exact Vercel URL to `FRONTEND_URLS` on backend |
| 401 after deploy | Ensure HTTPS on both sides; check `JWT_SECRET` is set |
| OAuth redirect mismatch | Redirect URI must match Google Console exactly |
| Email shows sent but not received | Check `/api/health/email`; fix Brevo IP + sender verification |
| 404 on page refresh (Vercel) | Ensure `frontend/vercel.json` is deployed |
| API 502 on Railway | Check `DATABASE_URL`, logs, and `PORT` binding |
| Build fails on Vercel | Set root directory to `frontend`, not repo root |

---

## Security reminders

- Never commit `.env`, API keys, or `node_modules`
- Use strong `JWT_SECRET` and `SESSION_SECRET` in production
- Set `NODE_ENV=production` on the API host
- Enable HTTPS everywhere (Vercel/Railway do this by default)
- Rotate credentials if they were ever committed to git
