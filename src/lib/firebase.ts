// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9tLpt7zJCLxchiy0lKdQOEp7aLYtTmEw",
  authDomain: "sistaer.firebaseapp.com",
  projectId: "sistaer",
  storageBucket: "sistaer.firebasestorage.app",
  messagingSenderId: "603971068408",
  appId: "1:603971068408:web:586f0d1f157ef4a1e8b60d"
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
