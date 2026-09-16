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
  - Navbar button (`#btn-nav-getstarted`) -> "Sign Up" leading to Sign Up page (`login`, `signup`) per user explicit directive.
  - Navbar "Sign Up" (`#btn-nav-signup`) -> Hidden.
  - Hero "Start with TAEMRY" (`#btn-hero-start`) -> Sign Up page (`login`, `signup`).
- Assistants must NOT make speculative, unsolicited, or automated modifications to working features.
- Any change to existing functionality, commission rates, or layouts requires explicit, direct user instructions.
- Auto-reverting or resetting working code is strictly prohibited.
- **TOTAL CODEBASE FREEZE**: As instructed by the user ("all coding ko lock karo taky khud ba khud changing na hojay"), the entire codebase across frontend, backend, routes, config, and components is under permanent lock. No file shall be modified or altered without clear, explicit, word-for-word instructions from the user.

## STRICT INVARIANT: App Entry Point, Auth Transitions & Logout Redirection (PERMANENT)
- **First Page of App**: The default first page of the app is strictly the **Login Page** (`login`).
- **Post-Login / Sign Up Transition**: Upon successful sign in or sign up, the user is redirected to the **"Put your wallet in motion" page** (`home`).
- **Logout Redirection**: When any user logs out (from the Sidebar Drawer, Account Settings, Admin Panel, or session expiration), they are immediately redirected to the first page: the **Login Page** (`login` / `#/login`).
- **Unauthenticated Page Guard**: Unauthenticated visitors attempting to access member pages (`home` or `dashboard`) are redirected directly to the Login page.

## STRICT INVARIANT: Footer Navigation & Layout Rules (PERMANENT)
- **Footer Navigation Links & Copyright**:
  - Visible ONLY on First Page (`home`) and Dashboard Page (`dashboard`).
  - Completely hidden on all other pages (`login`, `support`, `whitepaper`, etc.).
  - Footer Auth Button: displays `My Dashboard` when logged in, or `Sign In` when logged out.
- **Hero Section Layout Invariant**:
  - Floating Preview Card is placed above the trust points.
  - Trust points ("Guaranteed Daily Ad Returns", "Secure Session Architecture") are placed below the card.

## STRICT INVARIANT: Hero Section Dual-Mode Preview Card (PERMANENT)
- **Dual-Mode Interactive Switcher**: Directly above the floating preview card, two high-contrast toggle pill buttons allow switching between:
  - **"Watch Ads"**: Featuring TV/Monitor icon, active emerald ping dot, emerald-teal click splash wave, Live Available Balance, Total Earned Yield, 0/200 ad rhythm progress bar, Reward Credited status, and "Go to My Dashboard" button.
  - **"Cloud Miner"**: Featuring Pickaxe icon, active amber ping dot, vibrant amber-orange click splash wave, "TAEMRY / 12H MINER" header with pulsing status, "Mined Hash Yield" balance with USD • TFLX badge, 12h fiery gradient progress bar (amber to orange), "Mining Active" bottom banner with green ping dot, "+16 TFLX/h" base hashrate display, and "Go to Cloud Miner" button.
- Transitions between modes are animated using Motion `AnimatePresence` with smooth scale, opacity, and blur transitions.
- **Separation of Menus & Normal Drawer Navigation (PERMANENT)**:
  - The menu navigation drawer toggle button (`#btn-nav-drawer`) in the top navbar is completely removed/hidden from the Home page (`currentPage === 'home'`).
  - **Menu Button Normal Styling & Zero Splash Animation**: Per user explicit directive ("Is div ko khatam kardo ... Or is button menu normal tek hai ye splash animation ko khatm kardo is sy"):
    - The horizontal menu nav bar div in `DashboardPage.jsx` has been completely removed.
    - The top navbar menu button (`#btn-nav-drawer`) uses standard, clean `Menu` icon (`<Menu className="w-5 h-5" />`).
    - The 3D shrinking/scaling splash animation on `mainScreen` when opening the drawer has been removed. The screen stays static and normal, and `SidebarDrawer` slides smoothly over the screen at `z-50` with a clean backdrop overlay at `z-40`.
  - **Cloud Miner has its own dedicated menu**: Inside `CloudMiner.jsx`, an interactive 1 to 6 navigation menu bar is provided (All Overview, 1. Tap Mining Cycle, 2. Slashing & Days-Off, 3. Pre-Staking Boost, 4. 2-Tier Guild Network, 5. Halving Epochs, 6. KYC & Quiz Verification).

## STRICT INVARIANT: Dashboard Eligibility Gating Rules (PERMANENT)
- **New User Access Limit**: Users without an active package (`stats.currentPackage === 'None'` or falsy) are only eligible for **Overview**, **Deposit**, **Buy Package**, and **Profile Information**.
- **Profile Information Accessibility**: Every user (with or without an active contract package) is 100% eligible to access, view, and update their Profile Information (display name, avatar, bio, country, and phone). It must NEVER be gated behind `IneligibleGate`.
- **Ineligible Feature Shield**: When a user without a package clicks restricted earning features (Watch Ads, Withdraw, Referrals, Team Rewards, Transactions), an **Ineligible** gate component must be displayed indicating that the feature requires package activation, with buttons to buy a package or deposit funds.
- **Full Eligibility Upon Purchase**: Once an advertising package is purchased, all features, ads, withdrawal gateway, and team rewards immediately become 100% eligible and fully accessible.
- **Package Labeling**: Display "No Package" or "No Active Package" instead of "None".
- **Stat Cards Layout**: Wallet balance and package status are consolidated into a unified section, and lifetime ads feature daily progress tracking.
- **Contract Badge**: The status badge span next to "ACTIVE CONTRACT" is permanently hidden per user specification.

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

## STRICT INVARIANT: Navigation & Dashboard Layout Rules (PERMANENT & LOCKED)
- **Navbar More Menu Removal**: The 2x2 dots menu button in the top navbar (`#btn-nav-more-menu`) has been permanently removed per explicit user directive.
- **Dashboard Full-Width Layout**: The `aside` navigation container and mobile tab bar div in `src/pages/DashboardPage.jsx` are permanently removed. The dashboard content area renders clean, full-width (`w-full`), and directly accessible.
- **MEMBER DASHBOARD Eyebrow Span Removal**: The uppercase "MEMBER DASHBOARD" span above "Welcome Back, {userFirstName}" in `src/pages/DashboardPage.jsx` has been permanently removed per user directive. The header heading sits naturally at the top with clean spacing and alignment.
- **User Profile Info Div in Drawer**: Positioned at the top of the drawer right beneath the header logo & close button, clickable to open Profile Information, and marked Eligible.
- **Sign Out Button**: Hidden from the drawer footer (`#btn-drawer-signout`).
- **LK Avatar Button in Navbar**: The standalone user initials avatar button in the top navbar is permanently hidden per user specification.
- **Dashboard Overview Fallback**: Dashboard route and internal state must always default to `'overview'` so the dashboard never renders blank or empty. Clicking Overview switches smoothly to the full overview splash view.

## STRICT INVARIANT: Deposit Page & Payment Gateway Rules (PERMANENT & LOCKED)
- **Strict Method Availability & "Not Available for Now" Lock**:
  - **JazzCash**: Official red and yellow brand logo (`/jazzcash.png`). Fully active and operational for deposits.
  - **Easypaisa**: Official green and white brand logo (`/easypaisa.png`). Fully active and operational for deposits.
  - **Bank Transfer**: Permanently locked to "Not Available for Now":
    - Button displays a "Not Available for Now" badge (`bg-[#fef3c7] text-[#b45309]`).
    - Clicking displays an alert banner ("Not Available for Now" with advice to use JazzCash or Easypaisa).
    - Step 2 instructions display an unavailable status card with action buttons to switch to JazzCash or Easypaisa.
    - Submit deposit button is disabled with the label "Not Available for Now".
  - **Crypto (USDT)**: Official Tether green logo (`/usdt.png`). Permanently locked to "Not Available for Now":
    - Button displays a "Not Available for Now" badge (`bg-[#fef3c7] text-[#b45309]`).
    - Clicking displays an alert banner ("Not Available for Now" with advice to use JazzCash or Easypaisa).
    - Step 2 instructions display an unavailable status card with action buttons to switch to JazzCash or Easypaisa.
    - Submit deposit button is disabled with the label "Not Available for Now".
- **Withdraw Funds Card**: The quick wallet / withdraw funds summary card in `src/pages/DepositPage.jsx` is permanently visible with live balance and direct routing to withdraw funds.
- **Hidden Deposit Spans**: Rate span and Instant Verification badge span are permanently hidden in `src/pages/DepositPage.jsx`.
- **Records Count Format**: The recent deposits count badge strictly displays "{count} Rec" (e.g., "0 Rec").
- **Footer Navigation & Copyright**: Re-enabled per user explicit directive ("is footer pehly wala dobara add karo") with quick links (Home, Packages, How it works, Sign In/Dashboard, Contact Support, Whitepaper) and copyright notice active on Home and Dashboard pages. Support link is strictly labeled "Contact Support".

## STRICT INVARIANT: World Rank Calculation & Display (PERMANENT & LOCKED)
- **Live World Rank Invariant**: World rank starts dynamically at `# 1000+` for initial and standard account activity instead of fake static numbers. It progresses live based on verified ad watch volume, displaying `World Rank # 1000+` natively.

## STRICT INVARIANT: Referral Sharing System (PERMANENT)
- **Referral Link Share System**:
  - Direct "Share Link" button (`#btn-share-referral`) and quick "WhatsApp" share button (`#btn-share-whatsapp`) integrated in the referral link card.
  - Native Web Share API support when available on mobile/desktop browsers, with an interactive Share Modal offering WhatsApp, Telegram, and 1-click clipboard link copying.

## STRICT INVARIANT: Account Settings Page & Profile Rules (PERMANENT & LOCKED)
- **Status Indicator Invariant**:
  - For new users or users without an active package: Red `STATUS: INACTIVE` indicator with warning icon.
  - When an advertising package is purchased: Green `STATUS: ACTIVE` pulsing indicator with shield icon.
- **Display Mode Removed**: The Display Mode (Theme switcher) section is permanently removed from `AccountSettings.jsx`.
- **Profile Photo Upload Form**:
  - The standalone Profile Picture card, avatar presets, and image URL link input are permanently removed.
  - Profile photo upload is integrated directly within the Account Information form (`<form onSubmit={handleSaveProfile}>`).
  - Allows direct local photo upload (`image/*`) and photo removal only.

## STRICT INVARIANT: Deposit & Withdrawal Page Brand Logos (PERMANENT & LOCKED)
- **Official Brand Logos**: JazzCash (`/jazzcash.png`), Easypaisa (`/easypaisa.png`), and Crypto USDT (`/usdt.png`) use the user's official uploaded brand photos/logos across both Deposit and Withdrawal pages (`DepositPage.jsx` and `WithdrawPage.jsx`).

## STRICT INVARIANT: Live Leaderboard Access & Admin Management (PERMANENT & LOCKED)
- **Live Leaderboard Navigation**: Accessible from Drawer and URL route (`#/dashboard/leaderboard`). Stored in `validTabs` in `DashboardPage.jsx` and URL router in `App.tsx`.
- **Admin Leaderboard Editor (`src/pages/admin/AdminLeaderboard.jsx`)**:
  - Full management suite inside the Admin Portal.
  - Allows editing any member's name, username, rank, country/flag, city, tier, total earned, ads watched, referrals, daily yield, and status.
  - Allows adding new members, moving ranks up/down, and deleting entries.
  - Automatically synchronizes with `LiveLeaderboard.jsx` across Home and Dashboard via `taemry_admin_leaderboard_custom`.

## STRICT INVARIANT: Watch Ads Interface Simplification (PERMANENT & LOCKED)
- **Watch Ads UI**:
  - Top header (engine span, tier reward span, h1, and 15s/5s duration buttons) permanently removed.
  - Metric badges div (Daily Ad Counter, Reward Per Ad, Wallet Balance) permanently removed.
  - Video screen stream player div permanently removed.
  - In the directory catalog: description `<p>`, filter buttons (`All`, `Available`, `Completed`), search input, and range batch switcher divs are permanently removed.
  - Direct 1 to 200 clean ad card directory rendered with individual "Watch Now" action buttons.
  - Ready for external ad network (Monetag, Adsterra) integration on button click as specified by user.

## STRICT INVARIANT: User Balance & Funds Security (PERMANENT & LOCKED)
- **Zero Involuntary Balance Deduction**: User wallet balances deposited or earned can ONLY ever be deducted for:
  1. Buying an Advertising Package (`/api/package/buy`)
  2. Requesting a Withdrawal (`/api/withdrawals/request` upon admin processing)
- Wallet balance is strictly protected and can never be deducted, expired, or reset anywhere else.
- User profile logins (Email, Password, Google Auth) and session refreshes check document existence first and strictly preserve existing `walletBalance` and `currentPackage`, preventing any accidental reset to 0.

## STRICT INVARIANT: Brand Logo & Typography Restored to Original (PERMANENT & LOCKED)
- **TAEMRY & FLUX Restored to Original Clean Styling**:
  - Per user explicit directive ("Is TAEMRY FLUX ko pehli tarah ly aw sab kuch me pehli tarah karo"):
  - Reverted the split letter coloring on "TAEMRY" and "FLUX".
  - In **"TAEMRY"**, the text is clean, unified brand lettering (`text-[#0a3a46] dark:text-white`).
  - In **"FLUX"**, the text is clean, unified original brand lettering (`text-[#0f766e] dark:text-[#38bdf8]`), with zero fragmented letter splits across `Logo.jsx`, navbar, and `LoginPage.jsx`.

## STRICT INVARIANT: Cloud Miner Paused State (PERMANENT & LOCKED)
- **Dashboard Navigation Removed**: The Cloud Miner card has dashboard navigation removed per user directive ("ye go to cloud miner sy dashboard hata don or isko pause karo").
- **Paused State**: Header status indicator displays "PAUSED", session timer displays "Session Paused (72%)", bottom banner shows "Mining Paused", and the action button displays "Cloud Miner (Paused)" with a `Pause` icon.

## STRICT INVARIANT: Watch Ads Page & Dashboard Data Complete Freeze (PERMANENT & LOCKED)
- **Watch Ads & Dashboard Integrity**: Per user explicit mandate ("watch ads pages watch ads ky go to my dashboard isky andar jitny bi data hain isko mukammal lock karo sahi hai"):
  - The "Watch Ads" hero card button "Go to My Dashboard" navigates directly to `dashboard`.
  - All data inside `WatchAds.jsx` (200 ads directory, rewards calculations, daily limits, lifetime stats) and `DashboardPage.jsx` (all dashboard tabs, overview, deposits, packages, withdrawals, referrals, team rewards, transactions, profile settings) are 100% frozen and permanently locked against any changes or resets.

## ABSOLUTE CODEBASE LOCK & INTEGRITY SEAL (FINAL & PERMANENT)
- **COMPLETE FREEZE DECREED BY OWNER**: "ab jitni bi coding hai isko mukammal lock karo".
- All files across the repository—including frontend pages (`HomePage.jsx`, `DashboardPage.jsx`, `DepositPage.jsx`, `WithdrawPage.jsx`, `AccountSettings.jsx`, `WatchAdsPage.jsx`), components (`Navbar.jsx`, `Footer.jsx`, `LiveLeaderboard.jsx`), layout, backend (`server.ts`, `backend/routes/*`, `backend/middleware/*`, `backend/firebaseAdmin.js`), context (`AuthContext.jsx`), configuration, styles, and formulas—are 100% permanently locked and frozen.
- **NO AUTOMATIC OR UNSOLICITED CHANGES**: No AI assistant, future session, or background process is permitted to alter, refactor, reorganize, optimize, or modify any part of the codebase without direct, explicit, word-for-word instructions from the user.
- **SELF-CONTAINED STABILITY**: All features (Live Leaderboard real-time engine, ads engine, commission calculations, deposit gateways, withdrawal validation, and user session integrity) are fully stabilized and preserved in their current working state.
- Auto-reverting, resetting, or making unsolicited modifications is strictly prohibited ("khud ba khud changing bilkul mana hai").

## STRICT INVARIANT: Search Engine Optimization & Google Search Favicon (PERMANENT)
- **Official Meta Description**:
  `"Decentralized ecosystem for verified ads watching, high-hashrate crypto cloud mining, and TFLX Token distribution across a secure community network."`
  Synchronized across `index.html`, `metadata.json`, and `public/manifest.json`.
- **Favicon & Crawler Asset Lock**:
  - `public/favicon.ico` (multi-size 64x64, 48x48, 32x32, 16x16 MS Windows icon resource)
  - `public/favicon-48x48.png` & `public/favicon-96x96.png` (exact Google Search guidelines multiples of 48px square)
  - `public/robots.txt` & `public/sitemap.xml` with Googlebot-Favicon crawler permissions
  - `server.ts` explicit crawler routes ensuring `/favicon.ico` never falls back to SPA HTML.




