// Import the functions you need from the SDKs you need
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirestore, type Firestore } from "firebase/firestore";

const getRequiredEnv = (name: keyof ImportMetaEnv) => {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  if (!value) {
    return null;
  }
  return value;
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let db: Firestore | null = null;
let initError: Error | null = null;

try {
  // Validate required Firebase environment variables
  const apiKey = getRequiredEnv("VITE_FIREBASE_API_KEY");
  const authDomain = getRequiredEnv("VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = getRequiredEnv("VITE_FIREBASE_PROJECT_ID");
  const storageBucket = getRequiredEnv("VITE_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = getRequiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID");
  const appId = getRequiredEnv("VITE_FIREBASE_APP_ID");

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error("Missing required Firebase environment variables");
  }

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  db = getFirestore(app);
} catch (error) {
  initError = error instanceof Error ? error : new Error("Failed to initialize Firebase");
  console.error("Firebase initialization error:", initError.message);
}

export { auth, storage, db, initError };
export default app;
