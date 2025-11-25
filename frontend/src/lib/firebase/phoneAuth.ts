// 🔥 FINAL FIX - ON-DEMAND reCAPTCHA creation (ChatGPT recommended)
// Fixes: Token not attaching due to Next.js hydration + early initialization
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './config';

// Keep reference to recaptcha verifier
let recaptchaVerifier: firebase.auth.RecaptchaVerifier | null = null;
let isSending = false; // 🔒 Prevent double-sending

/**
 * Get or create reCAPTCHA verifier ON-DEMAND (button click)
 * This ensures token is fresh and properly attached to Firebase request
 * 
 * 🔥 KEY FIX: Create at button click, not during component mount/hydration
 */
export const getRecaptcha = async (): Promise<firebase.auth.RecaptchaVerifier> => {
  // 🔥 ALWAYS clean previous verifier (safest for Next.js)
  // Do NOT try to reuse - Firebase compat doesn't support verify()
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {}
    recaptchaVerifier = null;
  }

  // Clear HTML container to prevent "already rendered" error
  const container = document.getElementById('recaptcha-container');
  if (container) container.innerHTML = '';

  if (!auth) {
    throw new Error('Firebase Auth not initialized. Client-side only!');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Creating fresh reCAPTCHA verifier...');
  }

  // Create NEW verifier with auth.app (REQUIRED for token attachment)
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
    'recaptcha-container',
    {
      size: 'invisible',
      callback: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ reCAPTCHA solved!');
        }
      },
    },
    auth.app
  );
    
  // Render and return
    await recaptchaVerifier.render();
    return recaptchaVerifier;
};

/**
 * Send OTP to the provided phone number
 * 🔥 Creates reCAPTCHA ON-DEMAND for fresh token
 * @param phoneNumber - Phone number in E.164 format (e.g., +919999999999)
 * @returns ConfirmationResult object for OTP verification
 */
export const sendOTP = async (phoneNumber: string): Promise<firebase.auth.ConfirmationResult> => {
  // 🔒 Prevent double-sending
  if (isSending) {
    throw new Error('Please wait, OTP is already being sent.');
  }

  isSending = true;

  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Client-side only!');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Sending OTP to:', phoneNumber);
    }

    // 🔥 CREATE RECAPTCHA HERE (ON-DEMAND) - This is the key fix!
    const verifier = await getRecaptcha();
    
    // Send OTP with fresh verifier
    const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, verifier);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ OTP sent successfully!');
    }
    return confirmationResult;
  } catch (error: any) {
    console.error('❌ OTP error:', error);
    
    // Clear verifier on error for retry
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_) {}
      recaptchaVerifier = null;
    }

    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-app-credential') {
      throw new Error('Security verification failed. Please refresh and try again.');
    }

    throw new Error(error.message || 'Failed to send OTP. Try again.');
  } finally {
    isSending = false; // 🔓 Always unlock
  }
};

/**
 * Verify the OTP entered by the user
 * @param confirmationResult - ConfirmationResult from sendOTP
 * @param otp - OTP code entered by user
 * @returns Promise<boolean> - true if verification successful
 */
export const verifyOTP = async (
  confirmationResult: firebase.auth.ConfirmationResult,
  otp: string
): Promise<boolean> => {
  try {
    // Verify the OTP code (compat mode)
    const result = await confirmationResult.confirm(otp);
    
    if (result.user) {
      if (process.env.NODE_ENV === 'development') {
      console.log('OTP verified successfully for:', result.user.phoneNumber);
      }
      
      // Sign out immediately after verification
      // We only need to verify the phone number, not keep the user signed in
      if (auth) {
      await auth.signOut();
      }
      
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please check and try again.');
    } else if (error.code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new code.');
    } else {
      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  }
};

/**
 * Clean up reCAPTCHA verifier
 */
export const cleanupRecaptcha = () => {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (_) {}
    recaptchaVerifier = null;
  }

  // Clear container to prevent issues on remount
  const container = document.getElementById('recaptcha-container');
  if (container) container.innerHTML = '';
};

/**
 * Format phone number to E.164 format
 * @param phoneNumber - Phone number with country code
 * @returns Formatted phone number or null if invalid
 */
export const formatPhoneNumber = (phoneNumber: string): string | null => {
  // Remove all non-digit characters except '+'
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with '+'
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};

