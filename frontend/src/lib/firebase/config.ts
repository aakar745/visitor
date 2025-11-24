import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration from environment variables
// These are loaded from .env.local (development) or .env.production (production)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (singleton pattern - CLIENT-SIDE ONLY!)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

// Function to get Firebase app instance (lazy initialization)
export const getFirebaseApp = (): FirebaseApp => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side!');
  }
  
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 Firebase App Initialized:', {
          hasApiKey: !!firebaseConfig.apiKey,
          apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + '...',
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
        });
      }
    } else {
      app = getApps()[0];
    }
  }
  
  return app;
};

// Function to get Firebase Auth instance (lazy initialization)
export const getFirebaseAuth = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be initialized on the client side!');
  }
  
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
    auth.languageCode = 'en';
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Firebase Auth initialized (Standard reCAPTCHA)');
      console.log('📱 Phone Auth will use Firebase auto-provisioned reCAPTCHA');
    }
  }
  
  return auth;
};

// Legacy exports for backward compatibility (use functions above instead!)
export { app, auth };

