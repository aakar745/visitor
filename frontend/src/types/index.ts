// Exhibition Types
export interface Exhibition {
  id: string;
  _id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  venue: string;
  registrationStartDate: string;
  registrationEndDate: string;
  onsiteStartDate: string;
  onsiteEndDate: string;
  status: ExhibitionStatus;
  logoUrl?: string;
  exhibitionLogo?: string;
  badgeLogo?: string;
  bannerImage?: string;
  bannerImageUrl?: string;
  isPaid: boolean;
  paidStartDate?: string;
  paidEndDate?: string;
  pricingTiers?: PricingTier[];
  allowedCategories?: string[];
  customFields?: CustomField[];
  interestOptions?: InterestOption[];
  features?: string[];
  allowGuests: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ExhibitionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  REGISTRATION_OPEN = 'registration_open',
  LIVE_EVENT = 'live_event',
  COMPLETED = 'completed',
}

export interface PricingTier {
  id?: string; // Optional for compatibility
  _id?: string | any; // MongoDB subdocument ID (can be ObjectId)
  name: string;
  description?: string;
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  currentCount: number;
  ticketType: 'full_access' | 'day_wise';
  dayPrices?: DayPriceOption[];
  allSessionsPrice?: number;
}

export interface DayPriceOption {
  dayNumber: number;
  dayName: string;
  date: string;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface InterestOption {
  _id?: string; // MongoDB subdocument ID
  id?: string; // Optional frontend ID
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export interface CustomField {
  _id?: string; // MongoDB subdocument ID
  id?: string; // Optional frontend ID
  name: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  validation?: Record<string, any>;
  order: number;
  apiConfig?: Record<string, any>;
  displayMode?: string;
}

export type CustomFieldType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'api_select' // API-driven dropdown (dynamic options from backend)
  | 'date'
  | 'file';

// Exhibitor Types
export interface Exhibitor {
  id: string;
  _id: string;
  exhibitionId: string;
  name: string;
  companyName?: string;
  slug: string;
  boothNumber?: string;
  stallNumber?: string;
  logo?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  referralCode?: string;
  isActive: boolean;
  totalRegistrations?: number;
  createdAt: string;
  updatedAt: string;
}

// Registration Types
export interface VisitorRegistration {
  name: string;
  email: string;
  phone: string;
  company?: string;
  designation?: string;
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
  registrationCategory: string;
  selectedInterests?: string[];
  customFieldData?: Record<string, any>;
  referralSource: 'direct' | 'exhibitor';
  exhibitorId?: string;
  exhibitorSlug?: string;
  pricingTierId?: string;
  selectedDays?: number[];
}

export interface RegistrationResponse {
  registration: {
    _id: string;
    registrationNumber: string; // Unique human-readable registration number
    visitorId: string;
    exhibitionId: string;
    registrationDate: string;
    registrationCategory: string;
    status: string;
    paymentStatus?: string;
    amountPaid?: number;
  };
  visitor: {
    _id: string;
    name?: string; // Optional for dynamic forms
    email?: string; // Optional for dynamic forms
    phone?: string; // Optional for dynamic forms
    company?: string;
    designation?: string;
    state?: string;
    city?: string;
  };
  exhibition: {
    _id: string;
    name: string;
    slug: string;
    venue: string;
    onsiteStartDate: string;
    onsiteEndDate: string;
    isPaid: boolean;
  };
  qrCode?: string;
  badgeUrl?: string;
}

// Form Data Type
export interface RegistrationFormData {
  // Personal Info
  email: string;
  name: string;
  phone: string;
  company?: string;
  designation?: string;
  
  // Address
  state: string;
  city: string;
  pincode: string;
  address?: string;
  
  // Exhibition specific
  exhibitionId: string;
  registrationCategory: string;
  selectedInterests?: string[];
  customFieldData?: Record<string, any>;
  pricingTierId?: string;
  selectedDays?: number[]; // For day-wise tickets: array of selected day numbers
  exhibitorId?: string;
  referralCode?: string;
}

// Location Types
export interface State {
  name: string;
  code: string;
}

export interface City {
  name: string;
  stateCode: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Form State Types
export interface FormDraft {
  data: Partial<VisitorRegistration>;
  timestamp: string;
  exhibitionSlug: string;
}

