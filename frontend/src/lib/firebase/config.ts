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
  // Provides additional security against abuse and bots
  // Key must be configured in Google Cloud Console with authorized domains
  if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('✅ Firebase App Check initialized with reCAPTCHA Enterprise');
      console.log('🔒 Key:', process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('❌ App Check initialization failed:', error.message);
      console.error('💡 Make sure the key is configured for localhost in Google Cloud Console');
    }
  } else {
    console.warn('⚠️ NEXT_PUBLIC_FIREBASE_APPCHECK_ENTERPRISE_KEY not set');
    console.log('💡 App Check provides additional security - configure it for production');
  }
}

export { app, auth };

