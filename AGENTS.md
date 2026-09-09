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
