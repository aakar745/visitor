// Global Visitor Profile - Core information that persists across all exhibitions
export interface GlobalVisitorProfile {
  _id?: string; // MongoDB ID
  id: string;
  email: string; // Unique identifier for visitor
  name: string;
  phone: string;
  company?: string;
  designation?: string;
  
  // Address Information
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
  
  // Profile metadata
  createdAt: string;
  updatedAt: string;
  totalRegistrations: number;
  lastRegistrationDate?: string;
}

// Exhibition-specific registration data
export interface ExhibitionRegistration {
  id: string;
  visitorId: string; // References GlobalVisitorProfile.id
  exhibitionId: string;
  registrationNumber: string; // Unique registration number (e.g., REG-10112025-000001)
  
  // Registration specific data
  registrationCategory: RegistrationCategory;
  selectedInterests: string[]; // Array of InterestOption IDs
  customFieldData: Record<string, any>; // Dynamic custom field values
  
  // Payment information (if exhibition is paid)
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  pricingTierId?: string;
  amountPaid?: number;
  paymentDate?: string;
  
  // Registration metadata
  registrationDate: string;
  registrationSource: 'online' | 'onsite' | 'admin';
  status: 'registered' | 'confirmed' | 'cancelled' | 'waitlisted';
  
  // Exhibitor tracking
  referralSource: 'direct' | 'exhibitor'; // Direct (main exhibition link) or Exhibitor link
  exhibitorId?: string; // ID of exhibitor if referred by exhibitor
  exhibitorName?: string; // Name of exhibitor for quick reference
  referralCode?: string; // The 'ref' parameter from URL (exhibitor slug)
  
  // Visit tracking (for when they actually attend)
  checkInTime?: string;
  checkOutTime?: string;
  visitStatus?: 'scheduled' | 'checked-in' | 'checked-out' | 'no-show';
  
  // Additional data
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Combined view for displaying visitor data with exhibition context
export interface VisitorWithRegistration extends GlobalVisitorProfile {
  registration: ExhibitionRegistration;
  exhibitionName: string;
  exhibitionDates: {
    registrationStart: string;
    registrationEnd: string;
    eventStart: string;
    eventEnd: string;
  };
}

// For form prefilling - visitor data without exhibition-specific fields
export interface VisitorFormData {
  email: string;
  name: string;
  phone: string;
  company?: string;
  designation?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
}

// Registration form data - includes exhibition-specific selections
export interface RegistrationFormData extends VisitorFormData {
  selectedInterests: string[];
  registrationCategory: RegistrationCategory;
  pricingTierId?: string;
  customFieldData: Record<string, any>;
}

// Exhibition registration statistics
export interface ExhibitionRegistrationStats {
  exhibitionId: string;
  totalRegistrations: number;
  preRegistrations: number;
  preRegCheckIns: number;
  onSpotRegistrations: number;
  onSpotCheckIns: number;
  confirmedRegistrations: number;
  paidRegistrations: number;
  freeRegistrations: number;
  cancelledRegistrations: number;
  waitlistedRegistrations: number;
  checkInCount: number;
  notCheckedInCount: number;
  noShowCount: number;
  revenue: number;
  registrationsByCategory: Record<RegistrationCategory, number>;
  registrationsByCity?: Array<{ _id: string; count: number }>;
  registrationsByState?: Array<{ _id: string; count: number }>;
  registrationsByCountry?: Array<{ _id: string; count: number }>;
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
}

// Visitor analytics across all exhibitions
export interface GlobalVisitorAnalytics {
  totalUniqueVisitors: number;
  returningVisitors: number;
  newVisitors: number;
  totalRegistrations: number;
  averageRegistrationsPerVisitor: number;
  topCompanies: Array<{
    company: string;
    visitorCount: number;
  }>;
  locationBreakdown: Array<{
    state: string;
    city: string;
    count: number;
  }>;
}

// API Response types
export interface VisitorLookupResponse {
  found: boolean;
  visitor?: GlobalVisitorProfile;
  previousRegistrations?: Array<{
    exhibitionId: string;
    exhibitionName: string;
    registrationDate: string;
  }>;
}

// Import registration category from exhibitions
import type { RegistrationCategory } from './exhibitions';
