# Project Rules & Persistent Instructions

## STRICT INVARIANT: Firebase Configuration & SDK Lock (PERMANENT)
- **DO NOT MODIFY, MOVE, OR RENAME** `src/firebase/firebase.config.js`.
- **DO NOT MODIFY, MOVE, OR RENAME** `backend/firebaseAdmin.js`.
- **DO NOT MODIFY, MOVE, OR RENAME** `firebase-applet-config.json`.

### Client-Side Firebase Configuration:
- The Firebase configuration credentials, exports (`firebaseConfig`, `app`, `auth`, `db`, `analytics`, `googleProvider`, `isFirebaseConfigured`) are completely finalized and permanently locked per the project owner's strict directive:
  - `apiKey`: `"AIzaSyDHehaUaazgx9t5e6M5LzRFghD-6h7Gh14"`
  - `authDomain`: `"taemry-flux.firebaseapp.com"`
  - `projectId`: `"taemry-flux"`
  - `storageBucket`: `"taemry-flux.firebasestorage.app"`
  - `messagingSenderId`: `"692537379762"`
  - `appId`: `"1:692537379762:web:030e49001e88f1877cf2ab"`
  - `measurementId`: `"G-N91Y82MWHP"`

### Backend Firebase Admin SDK & Service Account Lock:
- Service Account Client Email: `"firebase-adminsdk-fbsvc@taemry-flux.iam.gserviceaccount.com"`
- Firebase Project ID: `"taemry-flux"`
- Supported initialization pathways in `backend/firebaseAdmin.js`:
  1. `serviceAccountKey.json` / `backend/serviceAccountKey.json` via `admin.credential.cert(serviceAccount)`
  2. `FIREBASE_SERVICE_ACCOUNT` raw JSON string in environment variable
  3. `FIREBASE_CLIENT_EMAIL` (`firebase-adminsdk-fbsvc@taemry-flux.iam.gserviceaccount.com`) + `FIREBASE_PRIVATE_KEY` + `FIREBASE_PROJECT_ID` (`taemry-flux`)
  4. In-memory fallback during local development when credentials are not yet uploaded

Any future assistant, turn, or task MUST keep these configurations strictly intact without making changes to them.

## STRICT INVARIANT: Daily Ads Matching Commission Rates (PERMANENT)
- Whenever a downline member completes an ad view and earns their ad reward (e.g. 0.1% per ad / 20% daily for 200 ads), the upline matching commissions are strictly locked to:
  - **Level 1**: **25%** of user's earned ad reward
  - **Level 2**: **20%** of user's earned ad reward
  - **Level 3**: **15%** of user's earned ad reward
  - **Level 4**: **10%** of user's earned ad reward
  - **Level 5**: **5%** of user's earned ad reward
- Implemented in `backend/routes/ads.js` (`adCommissionRates = { 1: 0.25, 2: 0.20, 3: 0.15, 4: 0.10, 5: 0.05 }`).
- DO NOT change or revert these commission rates.

## STRICT INVARIANT: Codebase Stabilization & Modification Lock (PERMANENT)
- The core platform architecture, business calculations, reward equations, package motivations, theme toggle, and UI styling decisions are permanently finalized.
- Assistants must NOT make speculative, unsolicited, or automated modifications to working features.
- Any change to existing functionality, commission rates, or layouts requires explicit, direct user instructions.
- Auto-reverting or resetting working code is strictly prohibited.

## STRICT INVARIANT: First Page (HomePage.jsx) PERMANENT LOCK
- **`src/pages/HomePage.jsx` is COMPLETELY FINALIZED AND PERMANENTLY LOCKED.**
- **NO CHANGES, MODIFICATIONS, OR REVISIONS** are allowed to the first page (`src/pages/HomePage.jsx`).
- All text content, headings, floating cards, buttons, daily allocation labels ("ads/day"), motivation texts for packages, and visual layouts are finalized per the user's explicit approval.
- Every assistant, turn, or task MUST keep `src/pages/HomePage.jsx` strictly unchanged.


