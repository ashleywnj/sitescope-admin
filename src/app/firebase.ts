import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBj5YaBDql8x2T4GeR4zmFFMeFqRksO_18",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "photonotes-992da.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "photonotes-992da",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "photonotes-992da.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "800345140472",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:800345140472:web:b920145c9221a9d05e5f0d",
};

// Initialize Firebase only if we have valid config and we're in the browser
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Only initialize if we have valid configuration and we're on the client side
if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export { app, auth, db, storage };