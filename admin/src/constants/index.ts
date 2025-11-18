// Backend Base URL
// IMPORTANT: Set VITE_API_BASE_URL in .env file for production (without /api/v1)
// Example: http://localhost:3000 or https://api.yourdomain.com
// The fallback is only for development - never deploy with hardcoded URL
export const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API Base URL (for API calls) - adds /api/v1 to backend URL
export const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1`;

// Frontend URL for registration links and QR codes
// IMPORTANT: Set VITE_FRONTEND_URL in .env file for production
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001';

// Warn if using fallback URL in production
if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
  console.warn('⚠️  WARNING: Using fallback API URL. Set VITE_API_BASE_URL in production environment.');
}

if (import.meta.env.PROD && !import.meta.env.VITE_FRONTEND_URL) {
  console.warn('⚠️  WARNING: Using fallback Frontend URL. Set VITE_FRONTEND_URL in production environment.');
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  VISITORS: {
    LIST: '/visitors',
    CREATE: '/visitors',
    UPDATE: '/visitors',
    DELETE: '/visitors',
    CHECK_IN: '/visitors/check-in',
    CHECK_OUT: '/visitors/check-out',
    // Global Visitor System
    GLOBAL: '/visitors/global',
    LOOKUP: '/visitors/lookup',
    ANALYTICS: '/visitors/analytics',
    SEARCH: '/visitors/search',
    MERGE: '/visitors/merge',
  },
  REGISTRATIONS: {
    BASE: '/registrations',
    CHECK_IN: '/registrations/check-in',
    CHECK_OUT: '/registrations/check-out',
    CANCEL: '/registrations/cancel',
  },
  EXHIBITIONS: {
    BASE: '/exhibitions',
    LIST: '/exhibitions',
    CREATE: '/exhibitions',
    UPDATE: '/exhibitions',
    DELETE: '/exhibitions',
    UPLOAD: '/exhibitions/upload',
    ANALYTICS: '/exhibitions/analytics',
  },
  EXHIBITORS: {
    BASE: '/exhibitors',
    LIST: '/exhibitors',
    CREATE: '/exhibitors',
    UPDATE: '/exhibitors',
    DELETE: '/exhibitors',
    BY_EXHIBITION: '/exhibitions',  // /exhibitions/:exhibitionId/exhibitors
    BY_SLUG: '/exhibitors/by-slug',
    CHECK_SLUG: '/exhibitors/check-slug',
    STATS: '/exhibitors/stats',
    QR_CODE: '/exhibitors/qr-code',
    UPLOAD_LOGO: '/exhibitors/upload',
    BULK_TOGGLE: '/exhibitors/bulk/toggle-status',
    BULK_DELETE: '/exhibitors/bulk/delete',
    EXPORT: '/exhibitors/export',
  },
  USERS: {
    BASE: '/users',
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users',
    DELETE: '/users',
    STATS: '/users/stats',
    PERMISSIONS: '/users/permissions',
    BULK: '/users/bulk',
    EXPORT: '/users/export',
    IMPORT: '/users/import',
    INVITE: '/users/invite',
  },
  ROLES: {
    BASE: '/roles',
    LIST: '/roles',
    CREATE: '/roles',
    UPDATE: '/roles',
    DELETE: '/roles',
    STATS: '/roles/stats',
    PERMISSIONS: '/roles/permissions',
    TEMPLATES: '/roles/templates',
    ASSIGNMENTS: '/roles/assignments',
    BULK: '/roles/bulk',
    EXPORT: '/roles/export',
    IMPORT: '/roles/import',
    COMPARE: '/roles/compare',
  },
  SETTINGS: {
    BASE: '/settings',
    BACKUP: '/settings/backups',
    EXPORT: '/settings/export',
    IMPORT: '/settings/import',
    BULK: '/settings/bulk',
    HISTORY: '/settings/history',
    HEALTH: '/settings/health',
    MIGRATIONS: '/settings/migrations',
    UPLOAD: '/settings/upload',
    TEST: '/settings/test',
    ENV: '/settings/env',
    CACHE: '/settings/cache',
    MAINTENANCE: '/settings/maintenance',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_VISITORS: '/dashboard/recent-visitors',
  },
} as const;

// Local Storage Keys
// NOTE: Tokens are stored in httpOnly cookies, not localStorage
// Only non-sensitive data like user info and preferences are in localStorage
export const STORAGE_KEYS = {
  USER: 'user', // Non-sensitive user data (name, email, role)
  THEME: 'theme', // User theme preference
  // Tokens removed - now in httpOnly cookies for security
  // ACCESS_TOKEN and REFRESH_TOKEN are managed by backend cookies
} as const;

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'Visitor Management System',
  VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
} as const;

// Visitor Status Options
export const VISITOR_STATUS = {
  CHECKED_IN: 'checked-in',
  CHECKED_OUT: 'checked-out',
  SCHEDULED: 'scheduled',
} as const;

// Registration Referral Sources
export const REFERRAL_SOURCE = {
  DIRECT: 'direct',
  EXHIBITOR: 'exhibitor',
} as const;

// Exhibitor Status
export const EXHIBITOR_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  SECURITY: 'security',
} as const;

// Theme Colors (to complement Ant Design)
export const THEME_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  text: {
    primary: 'rgba(0, 0, 0, 0.88)',
    secondary: 'rgba(0, 0, 0, 0.65)',
    disabled: 'rgba(0, 0, 0, 0.25)',
  },
} as const;
