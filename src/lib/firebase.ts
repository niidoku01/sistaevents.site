// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9tLpt7zJCLxchiy0lKdQOEp7aLYtTmEw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sistaer.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sistaer",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sistaer.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "603971068408",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:603971068408:web:586f0d1f157ef4a1e8b60d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;
