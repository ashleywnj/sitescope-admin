import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase - avoid conditional rendering for hydration
const isValidConfig = firebaseConfig.apiKey && 
                     firebaseConfig.authDomain && 
                     firebaseConfig.projectId &&
                     firebaseConfig.apiKey !== 'undefined';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Only initialize on client side with valid config
if (typeof window !== 'undefined' && isValidConfig) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, storage }; 