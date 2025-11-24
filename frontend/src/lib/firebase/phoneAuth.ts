import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './config';

// Declare global for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    recaptchaWidgetId: number | undefined;
    recaptchaEnterpriseKey: string | undefined;
  }
}

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * @param containerId - ID of the HTML element where reCAPTCHA will be rendered
 * @param onSuccess - Callback when reCAPTCHA is solved
 * @param onError - Callback when reCAPTCHA encounters an error
 */
export const initializeRecaptcha = async (
  containerId: string = 'recaptcha-container',
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<RecaptchaVerifier> => {
  // Clear existing verifier if any
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = undefined;
  }

  try {
    console.log('🔒 Initializing reCAPTCHA (standard) for phone authentication...');
    
    // Get Firebase Auth instance (client-side only)
    const auth = getFirebaseAuth();
    
    // Firebase will automatically use its standard reCAPTCHA
    // No site key needed - it's auto-provisioned by Firebase
    // Note: Firebase v9 API - container first, then options, then auth
    const recaptchaVerifier = new RecaptchaVerifier(containerId, {
      size: 'normal', // Visible reCAPTCHA for better reliability
      callback: () => {
        console.log('✅ reCAPTCHA solved successfully');
        onSuccess?.();
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA expired');
        const error = new Error('reCAPTCHA expired. Please try again.');
        onError?.(error);
      },
      'error-callback': (error: Error) => {
        console.error('❌ reCAPTCHA error:', error);
        onError?.(error);
      },
    }, auth);

    window.recaptchaVerifier = recaptchaVerifier;
    
    // Render the reCAPTCHA widget
    await recaptchaVerifier.render();
    
    console.log('✅ reCAPTCHA initialized and ready');
    return recaptchaVerifier;
  } catch (error: any) {
    console.error('❌ Error initializing reCAPTCHA:', error);
    
    // Provide helpful debugging info
    if (error.message?.includes('reCAPTCHA')) {
      const auth = getFirebaseAuth();
      console.error('');
      console.error('📋 FIREBASE CONSOLE SETUP REQUIRED:');
      console.error('   1. Go to: https://console.firebase.google.com/');
      console.error('   2. Select project:', auth.app.options.projectId);
      console.error('   3. Authentication → Settings → Phone Number Sign-in');
      console.error('   4. Select "reCAPTCHA (Standard)" - NOT Enterprise');
      console.error('   5. Authorized domains → Add "localhost"');
      console.error('   6. Wait 5 minutes, clear cache, refresh');
      console.error('');
    }
    
    throw error;
  }
};

/**
 * Send OTP to the provided phone number
 * @param phoneNumber - Phone number in E.164 format (e.g., +919999999999)
 * @returns ConfirmationResult object for OTP verification
 */
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    console.log('📱 [DEBUG] Attempting to send OTP...');
    console.log('📱 [DEBUG] Phone number:', phoneNumber);
    console.log('📱 [DEBUG] reCAPTCHA verifier exists:', !!window.recaptchaVerifier);
    
    // Ensure reCAPTCHA is initialized
    if (!window.recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized. Please refresh and try again.');
    }

    console.log('📱 [DEBUG] Calling signInWithPhoneNumber...');
    
    // Get Firebase Auth instance (client-side only)
    const auth = getFirebaseAuth();
    
    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      window.recaptchaVerifier
    );

    console.log('✅ OTP sent successfully to:', phoneNumber);
    console.log('📱 [DEBUG] Confirmation result received');
    return confirmationResult;
  } catch (error: any) {
    console.error('❌ [DEBUG] Error sending OTP:', error);
    console.error('❌ [DEBUG] Error code:', error.code);
    console.error('❌ [DEBUG] Error message:', error.message);
    console.error('❌ [DEBUG] Full error:', JSON.stringify(error, null, 2));
    
    // Clear reCAPTCHA on error to allow retry
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please check and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded. Please contact support.');
    } else {
      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }
};

/**
 * Verify the OTP entered by the user
 * @param confirmationResult - ConfirmationResult from sendOTP
 * @param otp - OTP code entered by user
 * @returns Promise<boolean> - true if verification successful
 */
export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<boolean> => {
  try {
    // Verify the OTP code
    const result = await confirmationResult.confirm(otp);
    
    if (result.user) {
      console.log('OTP verified successfully for:', result.user.phoneNumber);
      
      // Sign out immediately after verification
      // We only need to verify the phone number, not keep the user signed in
      const auth = getFirebaseAuth();
      await auth.signOut();
      
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
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (error) {
      console.error('Error clearing reCAPTCHA:', error);
    }
    window.recaptchaVerifier = undefined;
  }
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

