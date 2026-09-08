# TAEMRY FLUX — Phase 6: Final Deployment & Go-Live Master Guide

This guide provides the complete, production-ready blueprint for deploying the **TAEMRY FLUX** ecosystem across **Vercel** (Frontend), **Render/Railway** (Backend Express API), **Firebase** (Auth, Firestore, Storage), and **Cloudflare** (DNS, SSL, Edge Security).

---

## 1. Architecture Overview

```
[ End User Browser ] 
        │
        ▼ (HTTPS)
[ Cloudflare Edge ] ──── WAF / DDoS / SSL / CDN
   │             │
   │ (app.taemryflux.com)
   ▼             │
[ Vercel ]       │ (api.taemryflux.com)
(React Frontend) │
                 ▼
          [ Render / Railway ]
          (Node.js Express API)
                 │
                 ▼
       [ Firebase Ecosystem ]
  Auth ─ Firestore ─ Storage
```

---

## 2. Frontend Deployment (Vercel)

### Step 2.1: Repository Setup
- The root project contains `index.html`, `vite.config.ts`, `src/`, and `vercel.json`.
- When linking your GitHub repository in Vercel:
  - **Framework Preset**: Vite
  - **Root Directory**: `./`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - **Install Command**: `npm install`

### Step 2.2: `vercel.json` SPA Routing
The repository includes `vercel.json` with client-side SPA rewrites so direct navigation to routes like `/admin`, `/watch-ads`, and `/wallet` works seamlessly without 404 errors:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 2.3: Environment Variables in Vercel
Navigate to **Project Settings > Environment Variables** in Vercel and add:

| Variable Key | Example Value | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyB123456789...` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `taemry-flux.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `taemry-flux` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `taemry-flux.appspot.com` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | FCM Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:...` | Web App ID |
| `VITE_API_BASE_URL` | `https://api.taemryflux.com/api` | Production Backend URL |

---

## 3. Backend Deployment (Render or Railway)

### Step 3.1: Service Configuration on Render
1. In Render Dashboard, click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure the following parameters:
   - **Name**: `taemry-flux-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Starter / Free

*(Alternatively, connect via `render.yaml` blueprint included in the root directory)*.

### Step 3.2: Environment Variables in Render / Railway
In Render under **Environment Variables**, add:

| Variable Key | Example Value | Notes |
|---|---|---|
| `PORT` | `5000` | Auto-assigned by Render if left empty |
| `NODE_ENV` | `production` | Production mode |
| `FRONTEND_URL` | `https://app.taemryflux.com` | Allowed CORS origin |
| `FIREBASE_PROJECT_ID` | `taemry-flux` | From Service Account JSON |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@taemry-flux.iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIEvgIB...-----END PRIVATE KEY-----\n"` | **Wrap in quotes with escaped `\n`** |

> ⚠️ **CRITICAL PITFALL: Firebase Private Key Formatting**  
> In Render environment variables, multi-line strings can break if pasted with raw carriage returns. Paste the key with `\n` escaped, or paste the single-line string with quotes. Our backend `backend/firebaseAdmin.js` automatically performs `.replace(/\\n/g, '\n')` to safeguard against this.

---

## 4. Firebase Configuration & Security Rules

### Step 4.1: Enable Services in Firebase Console
1. **Authentication**: Enable **Email/Password** under *Sign-in method*.
2. **Cloud Firestore**: Create database in **Production mode**.
3. **Storage**: Enable Cloud Storage bucket for deposit transaction screenshots.
4. **Service Account**: Go to *Project Settings > Service accounts > Generate new private key* to get credentials for Render.

### Step 4.2: Deploy Firestore Security Rules
Copy the included `firestore.rules` or deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

Key protections enforced:
- Members cannot tamper with `walletBalance`, `role`, `isAdmin`, or `currentPackage`.
- Balance adjustments and transaction credits can only be executed by the backend server Admin SDK.
- Only administrators can approve deposits, mark withdrawals as paid, or access system audit logs.

### Step 4.3: Deploy Storage Rules
Deploy the included `storage.rules` to secure receipt uploads:
```bash
firebase deploy --only storage:rules
```

Key protections enforced:
- Maximum upload size restricted to 5MB.
- File MIME type restricted to image files (`image/*`).
- Storage path isolated per authenticated user: `/screenshots/{userId}/{fileName}`.

### Step 4.4: Seed the Primary Admin User
Run the following Firebase CLI command or execute via Node to grant the administrator custom claim:
```javascript
const admin = require('firebase-admin');
// set custom claims
await admin.auth().setCustomUserClaims('<USER_UID>', { admin: true });
```
*(The backend also whitelists `admin@taemryflux.com` and `admin_taemry@taemryflux.com` automatically).*

---

## 5. Cloudflare DNS, SSL & Edge Protection

### Step 5.1: DNS Configuration
Add the following DNS records in your Cloudflare dashboard:

| Type | Name | Target / Content | Proxy Status |
|---|---|---|---|
| `CNAME` | `app` (or `@`) | `cname.vercel-dns.com` | **Proxied (Orange Cloud)** |
| `CNAME` | `api` | `taemry-flux-backend.onrender.com` | **Proxied (Orange Cloud)** |

### Step 5.2: SSL/TLS Encryption
- Set SSL/TLS mode to **Full (Strict)**.
- Enable **Always Use HTTPS** in *SSL/TLS > Edge Certificates*.
- Enable **Automatic HTTPS Rewrites**.

### Step 5.3: Rate Limiting & DDoS Shield (WAF)
Create a Cloudflare WAF Rate Limiting rule under **Security > WAF > Rate limiting rules**:
- **Expression**: `(http.request.uri.path contains "/api/")`
- **Rate**: 60 requests per 1 minute per IP address.
- **Action**: Managed Challenge / Block.

---

## 6. Pre-Deployment Testing Checklist (`curl` Commands)

Test your backend endpoints locally or on staging before launching to public traffic:

### 1. Backend Health Check
```bash
curl -i http://localhost:5000/api/health
```
*Expected Response: HTTP 200 `{ "status": "ok", "service": "TAEMRY FLUX Backend API" }`*

### 2. Public Platform Settings
```bash
curl -i http://localhost:5000/api/settings
```
*Expected Response: HTTP 200 `{ "success": true, "settings": { "exchangeRate": 300, "dailyAdLimit": 200, ... } }`*

### 3. Member Ad Status Check
```bash
curl -i -H "Authorization: Bearer <FIREBASE_USER_ID_TOKEN>" \
  http://localhost:5000/api/ads/status
```

### 4. Ad Reward Submission (Simulation)
```bash
curl -i -X POST \
  -H "Authorization: Bearer <FIREBASE_USER_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"adId": "ad_1"}' \
  http://localhost:5000/api/ads/watch
```

### 5. Admin Panel Stats (Protected)
```bash
curl -i -H "Authorization: Bearer <FIREBASE_ADMIN_ID_TOKEN>" \
  http://localhost:5000/api/admin/stats
```

### 6. Admin Ads Settings Update
```bash
curl -i -X PUT \
  -H "Authorization: Bearer <FIREBASE_ADMIN_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "dailyAdLimit": 200,
    "adTimerSeconds": 60,
    "adRewardPercentage": 0.1,
    "adCooldownSeconds": 0,
    "uplineCommissionPercentage": 50
  }' \
  http://localhost:5000/api/admin/settings
```

---

## 7. Troubleshooting & Common Pitfalls

| Symptom | Cause | Solution |
|---|---|---|
| **CORS Preflight Error (`403` / `Blocked`)** | Custom headers `x-user-email` or origin mismatch | Ensure `backend/server.js` includes `origin: true` and `allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email', 'x-user-admin']`. |
| **Direct URL reload shows 404 on Vercel** | SPA routing not rewrote to `/index.html` | Ensure `vercel.json` exists with `{ "source": "/(.*)", "destination": "/index.html" }`. |
| **Firebase Admin: `ASN1 / PEM routines` error** | Unescaped newlines in `FIREBASE_PRIVATE_KEY` on Render | Ensure key is wrapped in double quotes and backend parses `\n` via `.replace(/\\n/g, '\n')`. |
| **Admin Panel shows 403 Forbidden** | User does not have admin claims or whitelist | Login with `admin@taemryflux.com` or set `{ admin: true }` custom claim via Admin SDK. |
| **Deposit receipt upload fails** | Storage rules rejection or file > 5MB | Ensure uploaded file is an image (`image/jpeg`, `image/png`) and under 5MB. |

---

## 8. Go-Live Checklist

- [x] **Ads Engine Settings added in Admin Panel** (quicker timer presets, reward rates, daily ad limits, and sponsor catalog).
- [x] **Frontend Vite build validated** (`npm run build` succeeds without TypeScript or bundling warnings).
- [x] **Backend Express server modularized** (`backend/package.json`, `server.js`, and Procfile created).
- [x] **Firestore Security Rules configured** (`firestore.rules` safeguarding balances, roles, and admin controls).
- [x] **Firebase Storage Rules created** (`storage.rules` securing receipt screenshots under 5MB).
- [x] **Vercel SPA rewrite configuration added** (`vercel.json`).
- [x] **Render infrastructure blueprint added** (`render.yaml`).
- [x] **CORS headers tested** with cross-origin preflight requests.
- [x] **Ready for production launch.**
