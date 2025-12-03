/**
 * Standardized Error Messages
 * 
 * This file contains all error message constants used throughout the application.
 * Using constants ensures consistency and makes internationalization easier.
 * 
 * Naming Convention:
 * - ERR_<CATEGORY>_<SPECIFIC_ERROR>
 * - All messages end with a period for consistency
 * - Use clear, user-friendly language
 */

// =============================================================================
// AUTHENTICATION ERRORS
// =============================================================================

export const ERR_AUTH = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Please contact the administrator.',
  ACCOUNT_LOCKED: (remainingMinutes: number) =>
    `Your account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
  USER_NOT_FOUND: 'User not found.',
  TOKEN_INVALID: 'Invalid or expired authentication token.',
  TOKEN_REQUIRED: 'Authentication token is required.',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token.',
  REFRESH_TOKEN_USED: 'This refresh token has already been used.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// =============================================================================
// PERMISSION ERRORS
// =============================================================================

export const ERR_PERMISSION = {
  NOT_AUTHENTICATED: 'User is not authenticated.',
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation.',
} as const;

// =============================================================================
// VALIDATION ERRORS
// =============================================================================

export const ERR_VALIDATION = {
  REQUIRED_FIELD: (fieldName: string) => `${fieldName} is required.`,
  INVALID_FORMAT: (fieldName: string) => `Invalid ${fieldName} format.`,
  INVALID_ID: (entityName: string) => `Invalid ${entityName} ID.`,
  ALREADY_EXISTS: (entityName: string) => `A ${entityName} with this identifier already exists.`,
  CANNOT_BE_EMPTY: (fieldName: string) => `${fieldName} cannot be empty.`,
  MUST_BE_NUMBER: 'Value must be a number.',
  MUST_BE_BOOLEAN: 'Value must be a boolean.',
  MUST_BE_EMAIL: 'Value must be a valid email address.',
  MUST_BE_URL: 'Value must be a valid URL.',
  MUST_BE_COLOR: 'Value must be a valid hex color (e.g., #1890ff).',
  MIN_VALUE: (min: number) => `Value must be at least ${min}.`,
  MAX_VALUE: (max: number) => `Value must be at most ${max}.`,
} as const;

// =============================================================================
// RESOURCE ERRORS
// =============================================================================

export const ERR_RESOURCE = {
  NOT_FOUND: (entityName: string, id?: string) =>
    id ? `${entityName} with ID ${id} not found.` : `${entityName} not found.`,
  CANNOT_DELETE: (entityName: string, reason: string) =>
    `Cannot delete ${entityName}: ${reason}`,
  CANNOT_UPDATE: (entityName: string, reason: string) =>
    `Cannot update ${entityName}: ${reason}`,
  READONLY: 'This resource is read-only and cannot be modified.',
  SYSTEM_PROTECTED: 'System resources cannot be modified or deleted.',
} as const;

// =============================================================================
// OTP ERRORS
// =============================================================================

export const ERR_OTP = {
  INVALID_PHONE: 'Invalid phone number.',
  INVALID_FORMAT: 'Invalid OTP format. Must be 6 digits.',
  PHONE_AND_CODE_REQUIRED: 'Phone number and OTP code are required.',
  NOT_FOUND: 'OTP not found or expired. Please request a new OTP.',
  EXPIRED: 'OTP has expired. Please request a new OTP.',
  MAX_ATTEMPTS: 'Maximum verification attempts exceeded. Please request a new OTP.',
  REMAINING_ATTEMPTS: (remaining: number) =>
    `Invalid OTP code. ${remaining} attempt(s) remaining.`,
  RATE_LIMITED: (seconds: number) =>
    `OTP already sent. Please wait ${seconds} seconds before requesting again.`,
  REQUEST_IN_PROGRESS: 'An OTP request is already in progress. Please wait.',
  SEND_FAILED: (reason: string) => `Failed to send OTP: ${reason}`,
} as const;

// =============================================================================
// REGISTRATION ERRORS
// =============================================================================

export const ERR_REGISTRATION = {
  EXHIBITION_NOT_FOUND: 'Exhibition not found.',
  REGISTRATION_CLOSED: 'Registration is not currently open for this exhibition.',
  NOT_ACCEPTING: 'This exhibition is not accepting registrations.',
  EMAIL_OR_PHONE_REQUIRED: 'Either email or phone number is required.',
  INVALID_EXHIBITOR: 'Invalid exhibitor reference.',
  ALREADY_REGISTERED: 'You are already registered for this exhibition.',
  NOT_FOUND: 'Registration not found.',
  CANCELLED: 'This registration has been cancelled.',
  INVALID_DATA: 'Invalid registration data.',
  NO_IDS_PROVIDED: 'No registration IDs provided.',
} as const;

// =============================================================================
// FILE ERRORS
// =============================================================================

export const ERR_FILE = {
  NO_FILE: 'No file provided.',
  INVALID_TYPE: (allowed: string) => `Invalid file type. Allowed types: ${allowed}.`,
  TOO_LARGE: (maxSize: string) => `File is too large. Maximum size: ${maxSize}.`,
  UPLOAD_FAILED: 'Failed to upload file.',
  EMPTY_FILE: 'File is empty.',
} as const;

// =============================================================================
// IMPORT ERRORS
// =============================================================================

export const ERR_IMPORT = {
  NOT_FOUND: 'Import not found.',
  ALREADY_ROLLED_BACK: 'This import has already been rolled back.',
  EMPTY_FILE: 'The imported file is empty.',
  INVALID_FORMAT: 'Invalid file format.',
  MISSING_COLUMNS: (columns: string[]) =>
    `Missing required columns: ${columns.join(', ')}.`,
} as const;

// =============================================================================
// PASSWORD ERRORS
// =============================================================================

export const ERR_PASSWORD = {
  MISMATCH: 'New password and confirmation do not match.',
  CURRENT_INCORRECT: 'Current password is incorrect.',
  SAME_AS_CURRENT: 'New password must be different from your current password.',
  CANNOT_UPDATE_VIA_ENDPOINT: 'Password cannot be updated via this endpoint. Use the change password feature.',
} as const;

// =============================================================================
// USER ERRORS
// =============================================================================

export const ERR_USER = {
  EMAIL_CANNOT_UPDATE: 'Email cannot be updated. Please contact the administrator.',
  ROLE_CANNOT_CHANGE: 'Cannot change role of this user.',
  CANNOT_DEACTIVATE_SELF: 'You cannot deactivate your own account.',
  CANNOT_DELETE_SELF: 'You cannot delete your own account.',
} as const;

// =============================================================================
// EXHIBITION ERRORS
// =============================================================================

export const ERR_EXHIBITION = {
  INVALID_TAGLINE: 'Invalid exhibition tagline.',
  TAGLINE_REQUIRED: 'Exhibition tagline is required for registration.',
  TAGLINE_ALPHANUMERIC: 'Exhibition tagline must contain alphanumeric characters.',
} as const;

