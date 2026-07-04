# Unity Hub Authentication Setup

This guide explains how to configure production-ready authentication for Unity Hub, including **Email + Password**, **Google OAuth 2.0**, and **GitHub OAuth**.

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally or remotely
- Unity Hub backend and frontend installed

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 1. Environment variables

### Backend (`backend/.env`)

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Example configuration (use placeholders until you have real credentials):

```env
PORT=5001
NODE_ENV=development

APP_URL=http://localhost:5001
OAUTH_CALLBACK_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000,http://localhost:3001

DATABASE_URL=postgresql://postgres:password@localhost:5432/unity_hub

JWT_SECRET=your_secure_random_secret
JWT_EXPIRE=1d
JWT_REMEMBER_EXPIRE=30d
SESSION_SECRET=your_secure_random_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

> **Never commit `.env` files or hardcode secrets in source code.**

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5001/api
```

---

## 2. Start the application

```bash
# Terminal 1 — backend (runs auth DB migration on startup)
cd backend
npm start

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:3000/login`.

---

## 3. Google OAuth setup

### Step 1 — Create a Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name it (e.g. `Unity Hub`) and click **Create**

### Step 2 — Enable the Google Identity / OAuth API

1. Open **APIs & Services** → **Library**
2. Search for **Google Identity** or **Google+ API** / **People API**
3. Enable **Google Identity Services** (or the OAuth-related API shown for your project)

### Step 3 — Configure the OAuth consent screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (or Internal for workspace-only)
3. Fill in app name, support email, and developer contact
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if the app is in **Testing** mode

### Step 4 — Create OAuth 2.0 Client ID credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**

### Step 5 — Authorized JavaScript origins

Add your development and production frontend URLs:

```
http://localhost:3000
http://localhost:5173
https://your-production-domain.com
```

### Step 6 — Authorized redirect URIs

Add the **backend** OAuth callback URL (not the frontend):

```
http://localhost:5001/api/auth/google/callback
https://your-api-domain.com/api/auth/google/callback
```

### Step 7 — Copy Client ID and Client Secret

From the credentials page, copy:

- **Client ID** → `GOOGLE_CLIENT_ID`
- **Client Secret** → `GOOGLE_CLIENT_SECRET`

### Step 8 — Save in `.env`

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OAUTH_CALLBACK_URL=http://localhost:5001
```

### Step 9 — Restart the development server

```bash
cd backend && npm start
```

### Step 10 — Test Google sign-in

1. Open `http://localhost:3000/login`
2. Click **Google**
3. Choose an account and approve permissions
4. You should be redirected to the dashboard

---

## 4. GitHub OAuth setup

### Step 1 — Create or log into a GitHub account

Use an account that can create OAuth applications.

### Step 2 — Open GitHub Developer Settings

Go to [github.com/settings/developers](https://github.com/settings/developers)

### Step 3 — Create a new OAuth App

Click **New OAuth App** (or **Register a new application**).

### Step 4 — Set the Homepage URL

```
http://localhost:3000
```

For production:

```
https://your-production-domain.com
```

### Step 5 — Set the Authorization Callback URL

```
http://localhost:5001/api/auth/github/callback
```

For production:

```
https://your-api-domain.com/api/auth/github/callback
```

### Step 6 — Generate Client ID and Client Secret

After creating the app, copy:

- **Client ID** → `GITHUB_CLIENT_ID`
- Generate and copy **Client Secret** → `GITHUB_CLIENT_SECRET`

### Step 7 — Save in `.env`

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Step 8 — Restart the application

```bash
cd backend && npm start
```

### Step 9 — Test GitHub login

1. Open `http://localhost:3000/login`
2. Click **GitHub**
3. Authorize the application
4. You should land on the dashboard

> GitHub may hide your email unless it is public. Unity Hub requests the `user:email` scope. If no email is returned, a fallback OAuth email is used and the account can still sign in.

---

## 5. Authentication features

| Feature | Description |
|--------|-------------|
| Email + password | Register and sign in with bcrypt-hashed passwords |
| Google / GitHub OAuth | Full OAuth 2.0 via Passport.js |
| Account linking | Same verified email merges OAuth with existing account |
| Remember me | Extends session duration (30 days) |
| Refresh tokens | HttpOnly cookie + automatic token refresh |
| Logout | Revokes current session |
| Logout all devices | `POST /api/auth/logout-all` (authenticated) |
| Connected providers | Connect / disconnect on Profile page |
| Rate limiting | Login and auth endpoints are rate-limited |
| Secure OAuth exchange | One-time code exchange (no JWT in URL) |

---

## 6. API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Email login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout current device |
| POST | `/api/auth/logout-all` | Logout all devices |
| POST | `/api/auth/oauth/exchange` | Exchange OAuth code for session |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/providers/:provider/connect` | Link provider |
| DELETE | `/api/auth/providers/:provider` | Unlink provider |

---

## 7. Production checklist

- [ ] Set strong `JWT_SECRET` and `SESSION_SECRET` (32+ random bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for frontend and backend
- [ ] Update Google/GitHub redirect URIs for production domains
- [ ] Set `FRONTEND_URLS` to your production frontend origin(s)
- [ ] Set `OAUTH_CALLBACK_URL` to your production API URL
- [ ] Never expose client secrets in frontend code

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `Google OAuth not configured` | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`, restart backend |
| `redirect_uri_mismatch` | Callback URL in Google/GitHub must exactly match `/api/auth/{provider}/callback` |
| CORS errors | Add your frontend URL to `FRONTEND_URLS` |
| Session expired | Frontend auto-refreshes; log in again if refresh cookie expired |
| Duplicate account | Use the same email — accounts link automatically when email is verified |

---

## 9. Testing checklist

- [ ] Email registration works
- [ ] Email login works
- [ ] Remember me persists longer sessions
- [ ] Google login works (new + existing users)
- [ ] GitHub login works (new + existing users)
- [ ] Account linking works (email account + OAuth same email)
- [ ] Logout works
- [ ] Protected routes require authentication
- [ ] Connect / disconnect providers on Profile
- [ ] OAuth errors show friendly messages
