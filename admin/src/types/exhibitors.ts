// Exhibitor Management Types

export interface Exhibitor {
  id: string;
  exhibitionId: string; // Links to specific exhibition
  name: string;
  companyName: string;
  slug: string; // URL-friendly unique identifier (e.g., xyz-company)
  logo?: string; // Company logo URL
  boothNumber?: string; // Optional booth/stall number
  isActive: boolean;
  
  // Stats
  totalRegistrations: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateExhibitorRequest {
  exhibitionId: string;
  name: string;
  companyName: string;
  slug?: string; // Auto-generated if not provided
  logo?: string;
  boothNumber?: string;
  isActive?: boolean;
}

export interface UpdateExhibitorRequest {
  name?: string;
  companyName?: string;
  slug?: string;
  logo?: string;
  boothNumber?: string;
  isActive?: boolean;
}

export interface ExhibitorListResponse {
  data: Exhibitor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExhibitorFilters {
  exhibitionId?: string;
  search?: string;
  isActive?: boolean;
}

export interface ExhibitorStats {
  exhibitorId: string;
  exhibitorName: string;
  companyName: string;
  totalRegistrations: number;
  recentRegistrations: Array<{
    visitorId: string;
    visitorName: string;
    visitorEmail: string;
    registrationDate: string;
  }>;
  linkClicks?: number;
  conversionRate?: number;
}

// For registration tracking
export interface RegistrationSource {
  type: 'direct' | 'exhibitor';
  exhibitorId?: string;
  exhibitorName?: string;
  referralCode?: string;
}

