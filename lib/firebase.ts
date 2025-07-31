// NOTE:
// – In production you must set the NEXT_PUBLIC_FIREBASE_* variables in Vercel.
// – During local preview the code falls back to Firebase Emulator to avoid
//   “Firebase: Error (auth/invalid-api-key).”

import { initializeApp, getApps } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// Reuse the app if it’s already been initialized (Next.js Fast Refresh, tests, etc.)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const functions = getFunctions(app)

// ---------- LOCAL / PREVIEW FALLBACK ----------
// Only fall back to the emulator when running in development AND the API key is missing
if (
  process.env.NODE_ENV === 'development' &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
) {
  console.warn(
    "[firebase] NEXT_PUBLIC_FIREBASE_API_KEY is missing – connecting to the Auth Emulator instead."
  );
  // Runs on localhost:9099 by default (`firebase emulators:start`)
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
} else if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  // In production, log an error if the API key is missing
  console.error(
    "[firebase] CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is missing in production environment. Firebase will not work properly."
  );
}
