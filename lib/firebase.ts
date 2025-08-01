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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const functions = getFunctions(app)

if (
  process.env.NODE_ENV === 'development' &&
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY
) {
  console.warn(
    "[firebase] NEXT_PUBLIC_FIREBASE_API_KEY is missing – connecting to the Auth Emulator instead."
  );
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
} else if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error(
    "[firebase] CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is missing in production environment. Firebase will not work properly."
  );
}
