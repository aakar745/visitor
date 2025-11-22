import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

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

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Config Loaded:', {
    hasApiKey: !!firebaseConfig.apiKey,
    apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + '...',
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
  
  // DEBUG: Log all Firebase env variables
  console.log('🔍 [DEBUG] All Firebase Environment Variables:');
  console.log('  NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 20) + '...');
  console.log('  NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('  NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY:', process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY);
  
  if (!firebaseConfig.apiKey) {
    console.error('❌ Firebase configuration is missing! Please copy env.example.txt to .env.local and add your Firebase credentials.');
  }
}

// Initialize Firebase (singleton pattern to prevent multiple instances)
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  auth = getAuth(app);
  
  // Set language to English (or you can set to user's preferred language)
  auth.languageCode = 'en';
  
  // Initialize App Check with reCAPTCHA Enterprise
  // Required for Identity Platform phone authentication
  // Make sure to add debug token to Firebase Console for localhost testing
  
  if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY) {
    try {
      // DEBUG: Log the App Check key being used
      console.log('🔑 [DEBUG] App Check Enterprise Key from env:', process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY);
      console.log('🔑 [DEBUG] Full key:', process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY);
      
      // Enable debug mode for localhost
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        // Use the existing registered debug token from Firebase Console
        // This prevents generating a new token every time
        // @ts-ignore
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
        console.log('🔧 App Check Debug Mode: Using registered debug token');
      }

      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      
      console.log('✅ App Check initialized with reCAPTCHA Enterprise');
      console.log('🔑 [DEBUG] App Check provider key:', process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY);
    } catch (error: any) {
      console.error('❌ App Check error:', error.message);
    }
  } else {
    console.warn('⚠️ [DEBUG] NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY is not set!');
  }
}

export { app, auth };

