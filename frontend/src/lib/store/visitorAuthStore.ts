import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Visitor Authentication Store
 * Manages OTP verification and visitor session
 */

interface VisitorAuthState {
  // Authentication state
  isAuthenticated: boolean;
  phoneNumber: string | null;
  
  // Visitor data (after lookup)
  visitorData: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    designation?: string;
    state?: string;
    city?: string;
    pincode?: string;
    address?: string;
  } | null;
  
  // Past registrations for current exhibition
  hasExistingRegistration: boolean;
  existingRegistrationId: string | null;
  
  // Actions
  setAuthenticated: (phone: string, visitorData?: any, registrations?: any[]) => void;
  clearAuthentication: () => void;
  setExistingRegistration: (registrationId: string) => void;
}

export const useVisitorAuthStore = create<VisitorAuthState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      phoneNumber: null,
      visitorData: null,
      hasExistingRegistration: false,
      existingRegistrationId: null,

      // Set authenticated after OTP verification
      setAuthenticated: (phone, visitorData, registrations) => {
        set({
          isAuthenticated: true,
          phoneNumber: phone,
          visitorData: visitorData || null,
          hasExistingRegistration: false, // Will be checked per exhibition
          existingRegistrationId: null,
        });
      },

      // Clear authentication (logout)
      clearAuthentication: () => {
        set({
          isAuthenticated: false,
          phoneNumber: null,
          visitorData: null,
          hasExistingRegistration: false,
          existingRegistrationId: null,
        });
        
        // Also clear localStorage to ensure old data is completely removed
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('visitor-auth-storage');
          } catch (e) {
            console.error('Failed to clear visitor auth storage:', e);
          }
        }
      },

      // Set existing registration for this exhibition
      setExistingRegistration: (registrationId) => {
        set({
          hasExistingRegistration: true,
          existingRegistrationId: registrationId,
        });
      },
    }),
    {
      name: 'visitor-auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        phoneNumber: state.phoneNumber,
        visitorData: state.visitorData,
      }),
    }
  )
);

