// API Configuration
// In production, always use the public API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

// Log API URL for debugging
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  console.log('[API Config] Using API Base URL:', API_BASE_URL);
}

// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Visitor Registration',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  env: process.env.NEXT_PUBLIC_ENV || 'development',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  exhibitions: {
    bySlug: '/exhibitions/by-slug',
    list: '/exhibitions',
  },
  exhibitors: {
    bySlug: '/exhibitors/by-slug',
    list: '/exhibitors',
  },
  registrations: {
    create: '/registrations',
    verify: '/registrations/verify',
  },
  locations: {
    states: '/locations/states',
    cities: '/locations/cities',
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  registration: 'visitor_registration',
  formDraft: 'registration_draft',
} as const;

// Form Validation
export const VALIDATION = {
  phone: {
    min: 10,
    max: 15,
    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
  },
  email: {
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  },
  pincode: {
    pattern: /^[0-9]{6}$/,
  },
  name: {
    min: 2,
    max: 100,
  },
  company: {
    min: 2,
    max: 200,
  },
} as const;

