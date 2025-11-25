// 🔥 COMPAT MODE - Production-proven for Next.js + React 18
// Fixes: "auth/invalid-app-credential" and token attachment issues
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// 🔥 Firebase configuration - Load from environment variables
// Note: NEXT_PUBLIC_ vars are replaced at build time by Next.js
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase (singleton pattern - CLIENT-SIDE ONLY!)
if (typeof window !== 'undefined' && !firebase.apps.length) {
  // 🔒 Validate configuration before initializing
  const missingFields = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration fields:', missingFields);
    console.error('📋 Make sure these environment variables are set in .env.local:');
    console.error('   - NEXT_PUBLIC_FIREBASE_API_KEY');
    console.error('   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    console.error('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    console.error('   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    console.error('   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    console.error('   - NEXT_PUBLIC_FIREBASE_APP_ID');
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  firebase.initializeApp(firebaseConfig);
      
      if (process.env.NODE_ENV === 'development') {
    console.log('🔥 Firebase initialized (COMPAT MODE):', {
          hasApiKey: !!firebaseConfig.apiKey,
          apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + '...',
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
        });
      }
}

// Export auth instance (compat mode)
export const auth = typeof window !== 'undefined' ? firebase.auth() : null;

// Set language
if (auth) {
    auth.languageCode = 'en';
    
    if (process.env.NODE_ENV === 'development') {
    console.log('✅ Firebase Auth initialized (COMPAT MODE)');
    console.log('📱 Phone Auth with invisible reCAPTCHA');
    }
  }

// Export firebase instance for direct access
export default firebase;

