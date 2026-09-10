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
- **Button Auth Navigation Invariant**:
  - Navbar "Open your wallet" (`#btn-nav-getstarted`) -> Sign In page (`login`, `signin`).
  - Navbar "Sign Up" (`#btn-nav-signup`) -> Hidden.
  - Hero "Start with TAEMRY" (`#btn-hero-start`) -> Sign Up page (`login`, `signup`).
- Assistants must NOT make speculative, unsolicited, or automated modifications to working features.
- Any change to existing functionality, commission rates, or layouts requires explicit, direct user instructions.
- Auto-reverting or resetting working code is strictly prohibited.
- **TOTAL CODEBASE FREEZE**: As instructed by the user ("all coding ko lock karo taky khud ba khud changing na hojay"), the entire codebase across frontend, backend, routes, config, and components is under permanent lock. No file shall be modified or altered without clear, explicit, word-for-word instructions from the user.

## STRICT INVARIANT: Footer Navigation & Layout Rules (PERMANENT)
- **Footer Navigation Links & Copyright**:
  - Visible ONLY on First Page (`home`) and Dashboard Page (`dashboard`).
  - Completely hidden on all other pages (`login`, `support`, `whitepaper`, etc.).
  - Footer Auth Button: displays `My Dashboard` when logged in, or `Sign In` when logged out.
- **Hero Section Layout Invariant**:
  - Floating Preview Card is placed above the trust points.
  - Trust points ("Guaranteed Daily Ad Returns", "Secure Session Architecture") are placed below the card.

## STRICT INVARIANT: First Page (HomePage.jsx) PERMANENT LOCK
- **`src/pages/HomePage.jsx` is COMPLETELY FINALIZED AND PERMANENTLY LOCKED.**
- **NO CHANGES, MODIFICATIONS, OR REVISIONS** are allowed to the first page (`src/pages/HomePage.jsx`).
- All text content, headings, floating cards, buttons, daily allocation labels ("ads/day"), motivation texts for packages, and visual layouts are finalized per the user's explicit approval.
- Every assistant, turn, or task MUST keep `src/pages/HomePage.jsx` strictly unchanged.

## STRICT INVARIANT: Dashboard Eligibility Gating Rules (PERMANENT)
- **New User Access Limit**: Users without an active package (`stats.currentPackage === 'None'` or falsy) are only eligible for **Deposit** and **Buy Package** (along with the overview page).
- **Ineligible Feature Shield**: When a user without a package clicks any other feature (Watch Ads, Withdraw, Referrals, Team Rewards, Transactions, Settings), an **Ineligible** gate component must be displayed indicating that the feature requires package activation, with buttons to buy a package or deposit funds.
- **Full Eligibility Upon Purchase**: Once an advertising package is purchased, all features, ads, withdrawal gateway, and team rewards immediately become 100% eligible and fully accessible.
- **Package Labeling**: Display "No Package" or "No Active Package" instead of "None".
- **Stat Cards Layout**: Wallet balance and package status are consolidated into a unified section, and lifetime ads feature daily progress tracking.

## STRICT INVARIANT: Clean New User Accounts & Zero Pre-seed (PERMANENT)
- Every new user and admin account MUST start completely clean with:
  - `walletBalance`: 0.00
  - `currentPackage`: 'None'
  - `lifetimeAds`: 0
  - `dailyAdCount`: 0
  - `teamAdsCount`: 0
  - `referralCount`: 0
  - `totalEarned`: 0.00
  - `isEligible`: false
- No account shall ever be pre-seeded with fake balances (e.g. $2500, $5000) or fake packages (e.g. Apex, Gold) upon refresh or update. Package activation and wallet balances must only change through actual deposits and genuine package purchases.

## STRICT INVARIANT: Navigation Drawer Layout Rules (PERMANENT)
- **User Profile Info Div**: Positioned at the top of the drawer right beneath the header logo & close button.
- **Sign Out Button**: Hidden (`#btn-drawer-signout`).
- **Settings & Profile Link**: Removed from drawer navigation menu items.




