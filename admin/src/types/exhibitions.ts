// Exhibition Status
export const ExhibitionStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active', 
  REGISTRATION_OPEN: 'registration_open',
  LIVE_EVENT: 'live_event',
  COMPLETED: 'completed',
} as const;

export type ExhibitionStatus = typeof ExhibitionStatus[keyof typeof ExhibitionStatus];

// Day Price Option (within a pricing tier)
export interface DayPriceOption {
  dayNumber: number;
  dayName: string;
  date: string;
  price: number;
  description?: string;
  isActive: boolean;
}

// Pricing Tier Types
export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  price: number; // Full access price or base price
  currency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  currentCount?: number;
  
  // Ticket Type
  ticketType: 'full_access' | 'day_wise';
  dayPrices?: DayPriceOption[]; // Only if ticketType is 'day_wise'
  allSessionsPrice?: number; // Price for all days combined (optional)
}

// Registration Category Types
export const RegistrationCategory = {
  GENERAL: 'general',
  VIP: 'vip',
  MEDIA: 'media',
  EXHIBITOR: 'exhibitor',
  SPEAKER: 'speaker',
  GUEST: 'guest',
  VISITOR: 'visitor',
} as const;

export type RegistrationCategory = typeof RegistrationCategory[keyof typeof RegistrationCategory];

// Interest/Looking For Category Types
export const InterestCategory = {
  PRODUCTS: 'products',
  SERVICES: 'services',
  PARTNERSHIPS: 'partnerships',
  INVESTMENT: 'investment',
  TECHNOLOGY: 'technology',
  SUPPLIERS: 'suppliers',
  DISTRIBUTORS: 'distributors',
  LICENSING: 'licensing',
  JOINT_VENTURES: 'joint_ventures',
  MANUFACTURING: 'manufacturing',
  EXPORT_OPPORTUNITIES: 'export_opportunities',
  IMPORT_OPPORTUNITIES: 'import_opportunities',
  FRANCHISE: 'franchise',
  NETWORKING: 'networking',
  KNOWLEDGE_SHARING: 'knowledge_sharing',
  OTHER: 'other'
} as const;

export type InterestCategory = typeof InterestCategory[keyof typeof InterestCategory];

export interface InterestOption {
  id: string;
  name: string;
  category: InterestCategory;
  description?: string;
  isActive: boolean;
  required?: boolean; // ✅ NEW: Whether selecting this interest is mandatory
  order: number;
}

// Badge Overlay Configuration
export interface BadgeOverlayConfig {
  // Text overlays
  visitorName?: {
    x: number; // X position in pixels
    y: number; // Y position in pixels
    fontSize: number;
    fontFamily?: string;
    color: string; // Hex color
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    textAlign?: 'left' | 'center' | 'right';
    maxWidth?: number; // Max width before text wraps
  };
  
  visitorType?: {
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color: string;
    backgroundColor?: string; // Background color for badge type
    padding?: number; // Padding around text
    borderRadius?: number; // Rounded corners
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  };
  
  company?: {
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  };
  
  location?: {
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  };
  
  // QR Code overlay
  qrCode?: {
    x: number;
    y: number;
    size: number; // QR code size in pixels
    backgroundColor?: string; // Background color
    foregroundColor?: string; // QR code color
  };
  
  // Additional custom fields
  customTextFields?: Array<{
    fieldName: string; // References CustomField.name
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    color: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  }>;
  
  // Badge dimensions (for validation)
  badgeWidth?: number; // Width in pixels
  badgeHeight?: number; // Height in pixels
}

// Custom Field Types for Registration Form
export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'api_select';
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  order: number;
  // API configuration for dynamic dropdowns
  apiConfig?: {
    endpoint: string;        // API endpoint to fetch options from
    valueField: string;      // Field name for the option value
    labelField: string;      // Field name for the option label
    dependsOn?: string;      // Field name this depends on (e.g., city depends on state)
    searchable?: boolean;    // Enable search/autocomplete
    cacheKey?: string;       // Cache key for API responses
  };
  // Display mode: 'input' for text input, 'select' for dropdown
  displayMode?: 'input' | 'select';
}

// File Upload Types  
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Main Exhibition Interface
export interface Exhibition {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  tagline: string; // "Looking For You" field
  description?: string;
  venue: string;
  
  // Dates
  registrationStartDate: string;
  registrationEndDate: string;
  onsiteStartDate: string;
  onsiteEndDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Status
  status: ExhibitionStatus;
  
  // Files (stored as URLs)
  exhibitionLogo?: string;
  badgeLogo?: string; // Base badge template image
  bannerImage?: string;
  
  // Badge Configuration (overlay positions for dynamic data)
  badgeConfig?: BadgeOverlayConfig;
  
  // Pricing Configuration
  isPaid: boolean;
  paidStartDate?: string;
  paidEndDate?: string;
  pricingTiers: PricingTier[];
  
  // Registration Configuration
  allowedCategories: RegistrationCategory[];
  customFields: CustomField[];
  currentRegistrations?: number;
  
  // Interest Categories - What visitors are looking for
  interestOptions: InterestOption[];
  
  // Features
  allowGuests: boolean;
  requiresApproval: boolean;
  
  // Statistics
  stats?: {
    totalRegistrations: number;
    preRegistrations: number;
    onsiteRegistrations: number;
    paidRegistrations: number;
    freeRegistrations: number;
    checkedInCount: number;
  };
}

// Exhibition Creation/Update Request
export interface ExhibitionRequest {
  name: string;
  tagline: string;
  description?: string;
  venue: string;
  registrationStartDate: string;
  registrationEndDate: string;
  onsiteStartDate: string;
  onsiteEndDate: string;
  isPaid: boolean;
  paidStartDate?: string;
  paidEndDate?: string;
  pricingTiers: Omit<PricingTier, 'id' | 'currentCount'>[];
  allowedCategories: RegistrationCategory[];
  customFields: Omit<CustomField, 'id'>[];
  interestOptions: Omit<InterestOption, 'id'>[];
  allowGuests: boolean;
  requiresApproval: boolean;
  exhibitionLogo?: string | null;
  badgeLogo?: string | null;
  bannerImage?: string | null;
  badgeConfig?: BadgeOverlayConfig;
}

// API Response Types
export interface ExhibitionListResponse {
  data: Exhibition[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Options for Exhibition List
export interface ExhibitionFilters {
  status?: ExhibitionStatus[];
  isPaid?: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  search?: string;
}

// Exhibition Statistics
export interface ExhibitionAnalytics {
  exhibitionId: string;
  registrationTrend: Array<{
    date: string;
    count: number;
    type: 'pre' | 'onsite';
  }>;
  categoryBreakdown: Record<RegistrationCategory, number>;
  pricingTierStats: Array<{
    tierId: string;
    name: string;
    revenue: number;
    count: number;
    conversionRate: number;
  }>;
  dailyCheckins: Array<{
    date: string;
    count: number;
  }>;
}
