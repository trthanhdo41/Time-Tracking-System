import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Log env check (only in development)
if (import.meta.env.DEV) {
  console.log('🔍 Firebase ENV Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId
  });
}

// Validate required fields
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase Config Missing! Check environment variables:', {
    apiKey: firebaseConfig.apiKey ? 'OK' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'OK' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'OK' : 'MISSING',
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Note: We use imgbb for image storage instead of Firebase Storage
// See IMGBB_SETUP.md for configuration

export default app;

