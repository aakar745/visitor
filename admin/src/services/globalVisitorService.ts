import api from './api';
import type { 
  GlobalVisitorProfile, 
  ExhibitionRegistration, 
  VisitorWithRegistration,
  VisitorLookupResponse,
  RegistrationFormData,
  ExhibitionRegistrationStats,
  GlobalVisitorAnalytics,
  PaginationParams, 
  PaginatedResponse 
} from '../types';

export const globalVisitorService = {
  // Check if visitor exists by email and return their profile
  async lookupVisitorByEmail(email: string): Promise<VisitorLookupResponse> {
    try {
      const response = await api.get(`/visitors/lookup?email=${encodeURIComponent(email)}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { found: false };
      }
      throw error;
    }
  },

  // Create new global visitor profile
  async createGlobalVisitor(data: Omit<GlobalVisitorProfile, 'id' | 'createdAt' | 'updatedAt' | 'totalRegistrations' | 'lastRegistrationDate'>): Promise<GlobalVisitorProfile> {
    const response = await api.post('/visitors/global', data);
    return response.data.data;
  },

  // Update global visitor profile
  async updateGlobalVisitor(id: string, data: Partial<GlobalVisitorProfile>): Promise<GlobalVisitorProfile> {
    const response = await api.put(`/visitors/global/${id}`, data);
    return response.data.data;
  },

  // Get global visitor profile by ID
  async getGlobalVisitor(id: string): Promise<GlobalVisitorProfile> {
    const response = await api.get(`/visitors/${id}`);
    // Backend returns: { success, data: visitor }
    return response.data.data ? response.data.data : response.data;
  },

  // Get all global visitors with pagination
  async getGlobalVisitors(params: PaginationParams): Promise<PaginatedResponse<GlobalVisitorProfile>> {
    const response = await api.get('/visitors', { params });
    // Backend returns: { success, data: { data, pagination, message } }
    return response.data.data ? response.data.data : response.data;
  },

  // Register visitor for exhibition (create or update profile + create registration)
  async registerVisitorForExhibition(
    exhibitionId: string, 
    registrationData: RegistrationFormData
  ): Promise<{
    visitor: GlobalVisitorProfile;
    registration: ExhibitionRegistration;
  }> {
    const response = await api.post(`/exhibitions/${exhibitionId}/register`, registrationData);
    return response.data.data;
  },

  // Get exhibition registration by ID
  async getExhibitionRegistration(registrationId: string): Promise<ExhibitionRegistration> {
    const response = await api.get(`/registrations/${registrationId}`);
    return response.data.data;
  },

  // Update exhibition registration
  async updateExhibitionRegistration(
    registrationId: string, 
    data: Partial<ExhibitionRegistration>
  ): Promise<ExhibitionRegistration> {
    const response = await api.put(`/registrations/${registrationId}`, data);
    return response.data.data;
  },

  // Cancel exhibition registration
  async cancelExhibitionRegistration(registrationId: string): Promise<void> {
    await api.post(`/registrations/${registrationId}/cancel`);
  },

  // Get all registrations for a specific exhibition
  async getExhibitionRegistrations(
    exhibitionId: string, 
    params: PaginationParams & {
      status?: string;
      category?: string;
      paymentStatus?: string;
      registrationType?: 'free' | 'paid';
      registrationTiming?: 'pre-registration' | 'on-spot';
      checkInStatus?: 'checked-in' | 'not-checked-in';
      dateRange?: { start: string; end: string };
    }
  ): Promise<PaginatedResponse<VisitorWithRegistration>> {
    // ✅ FIX: Transform dateRange object to startDate/endDate query params
    const { dateRange, ...otherParams } = params;
    const queryParams: any = { ...otherParams };
    
    if (dateRange?.start && dateRange?.end) {
      queryParams.startDate = dateRange.start;
      queryParams.endDate = dateRange.end;
    }
    
    const response = await api.get(`/exhibitions/${exhibitionId}/registrations`, { params: queryParams });
    return response.data.data;
  },

  // Get all registrations for a specific visitor
  async getVisitorRegistrations(
    visitorId: string, 
    params?: PaginationParams
  ): Promise<PaginatedResponse<ExhibitionRegistration>> {
    const response = await api.get(`/visitors/${visitorId}/registrations`, { params });
    // Backend returns: { success, data: { data, message } }
    return response.data.data ? response.data.data : response.data;
  },

  // Check in visitor for exhibition
  async checkInVisitor(registrationId: string): Promise<ExhibitionRegistration> {
    const response = await api.post(`/registrations/${registrationId}/check-in`);
    return response.data.data;
  },

  // Check out visitor from exhibition
  async checkOutVisitor(registrationId: string): Promise<ExhibitionRegistration> {
    const response = await api.post(`/registrations/${registrationId}/check-out`);
    return response.data.data;
  },

  // Get exhibition registration statistics
  async getExhibitionStats(exhibitionId: string): Promise<ExhibitionRegistrationStats> {
    const response = await api.get(`/exhibitions/${exhibitionId}/stats`);
    return response.data.data;
  },

  // Get global visitor analytics
  async getGlobalVisitorAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GlobalVisitorAnalytics> {
    try {
      const response = await api.get('/visitors/statistics', { params });
      // Backend returns: { success, data: { data: stats, message } }
      const stats = response.data.data?.data || response.data.data || response.data;
      
      // Map backend response to frontend expected format
      return {
        totalUniqueVisitors: stats.total || 0,
        returningVisitors: 0,
        newVisitors: 0,
        totalRegistrations: stats.totalRegistrations || 0,
        averageRegistrationsPerVisitor: stats.averageRegistrationsPerVisitor || 0,
        topCompanies: [],
        locationBreakdown: [],
      };
    } catch (error) {
      // Return default values if analytics endpoint fails
      return {
        totalUniqueVisitors: 0,
        returningVisitors: 0,
        newVisitors: 0,
        totalRegistrations: 0,
        averageRegistrationsPerVisitor: 0,
        topCompanies: [],
        locationBreakdown: [],
      };
    }
  },

  // Search visitors across all exhibitions
  async searchVisitors(params: {
    query: string;
    exhibitionId?: string;
    registrationStatus?: string;
    dateRange?: { start: string; end: string };
  } & PaginationParams): Promise<PaginatedResponse<VisitorWithRegistration>> {
    const response = await api.get('/visitors/search', { params });
    return response.data.data;
  },

  // ✅ FAST AUTOCOMPLETE SEARCH with MeiliSearch
  // Instant search as you type - results in < 50ms
  async searchVisitorsAutocomplete(
    query: string,
    exhibitionId?: string,
    limit: number = 20
  ): Promise<{
    hits: Array<{
      id: string;
      name: string;
      phone: string;
      email: string;
      company?: string;
      designation?: string;
      city?: string;
      state?: string;
      totalRegistrations: number;
      _formatted?: any;
    }>;
    estimatedTotalHits: number;
    processingTimeMs: number;
  }> {
    try {
      if (!query || query.length < 2) {
        return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
      }

      const params: any = { q: query, limit };
      if (exhibitionId) {
        params.exhibitionId = exhibitionId;
      }

      const response = await api.get('/visitors/search/autocomplete', { params });
      
      // ✅ Backend returns MeiliSearch results wrapped by interceptor
      // response.data = { success: true, data: { hits, estimatedTotalHits, processingTimeMs }, ... }
      const meilisearchResults = response.data.data;
      
      console.log('[MeiliSearch] Search results:', meilisearchResults);
      
      // ✅ Validate response structure
      if (!meilisearchResults || !Array.isArray(meilisearchResults.hits)) {
        console.error('[MeiliSearch] Invalid response structure:', meilisearchResults);
        return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
      }
      
      return meilisearchResults;
    } catch (error) {
      console.error('[MeiliSearch] Visitor autocomplete error:', error);
      return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
    }
  },

  // Export exhibition registrations
  async exportExhibitionRegistrations(
    exhibitionId: string,
    format: 'csv' | 'excel',
    filters?: {
      registrationType?: 'free' | 'paid'; // Changed from status to registrationType
      registrationTiming?: 'pre-registration' | 'on-spot'; // Pre-Reg vs On-Spot
      checkInStatus?: 'checked-in' | 'not-checked-in'; // Check-in status
      category?: string;
      paymentStatus?: string;
      dateRange?: { start: string; end: string };
    }
  ): Promise<Blob> {
    const params: any = { format };
    
    // ✅ FIX: Transform dateRange object to startDate/endDate query params
    if (filters?.registrationType) params.registrationType = filters.registrationType;
    if (filters?.registrationTiming) params.registrationTiming = filters.registrationTiming;
    if (filters?.checkInStatus) params.checkInStatus = filters.checkInStatus;
    if (filters?.category) params.category = filters.category;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.dateRange?.start) params.startDate = filters.dateRange.start;
    if (filters?.dateRange?.end) params.endDate = filters.dateRange.end;
    
    console.log('📤 Export API Params:', params);
    
    const response = await api.get(`/exhibitions/${exhibitionId}/export`, {
      params,
      responseType: 'blob',
      timeout: 300000, // 5 minutes for large exports (100k+ records)
    });
    return response.data;
  },

  // Export global visitor data
  async exportGlobalVisitors(
    format: 'csv' | 'excel',
    filters?: {
      search?: string;
      state?: string;
      city?: string;
      minRegistrations?: number;
    }
  ): Promise<Blob> {
    const response = await api.get('/visitors/export', {
      params: { format, ...filters },
      responseType: 'blob',
      timeout: 300000, // 5 minutes for large exports (100k+ records)
    });
    return response.data;
  },

  // Merge duplicate visitor profiles
  async mergeVisitorProfiles(primaryVisitorId: string, duplicateVisitorId: string): Promise<GlobalVisitorProfile> {
    const response = await api.post(`/visitors/global/${primaryVisitorId}/merge`, {
      duplicateVisitorId
    });
    return response.data.data;
  },

  // Get visitor dashboard data (for individual visitor view)
  async getVisitorDashboard(visitorId: string): Promise<{
    profile: GlobalVisitorProfile;
    recentRegistrations: ExhibitionRegistration[];
    upcomingEvents: ExhibitionRegistration[];
    visitHistory: ExhibitionRegistration[];
    totalSpent: number;
  }> {
    // Fetch visitor profile and registrations
    const [profileResponse, registrationsResponse] = await Promise.all([
      api.get(`/visitors/${visitorId}`),
      api.get(`/visitors/${visitorId}/registrations`)
    ]);
    
    // Handle nested data structure from TransformInterceptor
    const profile = profileResponse.data.data ? profileResponse.data.data : profileResponse.data;
    const registrations = registrationsResponse.data.data?.data || registrationsResponse.data.data || registrationsResponse.data || [];
    
    return {
      profile,
      recentRegistrations: registrations,
      upcomingEvents: [],
      visitHistory: registrations,
      totalSpent: 0,
    };
  },

  // Get all registrations with visitor details (Admin)
  async getAllRegistrationsWithVisitors(params: PaginationParams): Promise<PaginatedResponse<any>> {
    const response = await api.get('/registrations/all-with-visitors', { params });
    return response.data.data ? response.data.data : response.data;
  },

  // Delete a registration (Admin)
  async deleteRegistration(registrationId: string): Promise<void> {
    await api.delete(`/registrations/${registrationId}`);
  },

  // Bulk delete registrations (Admin)
  async bulkDeleteRegistrations(registrationIds: string[]): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    const response = await api.post('/registrations/bulk-delete', { ids: registrationIds });
    return response.data.data ? response.data.data : response.data;
  },

  // Delete a visitor (Admin)
  async deleteVisitor(visitorId: string): Promise<void> {
    await api.delete(`/visitors/${visitorId}`);
  },

  // Bulk delete visitors (Admin)
  async bulkDeleteVisitors(visitorIds: string[]): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    const response = await api.post('/visitors/bulk-delete', { ids: visitorIds });
    return response.data.data ? response.data.data : response.data;
  },

  // Delete ALL visitors (Super Admin Only)
  // ⚠️ DANGEROUS: This deletes ALL visitors and their registrations!
  async deleteAllVisitors(): Promise<{
    message: string;
    visitorsDeleted: number;
    registrationsDeleted: number;
  }> {
    const response = await api.delete('/visitors/delete-all');
    return response.data.data ? response.data.data : response.data;
  },
};

// Hook for visitor lookup and form prefilling
export const useVisitorLookup = () => {
  const lookupAndPrefillForm = async (email: string, form: any) => {
    if (!email || !email.includes('@')) return null;
    
    try {
      const result = await globalVisitorService.lookupVisitorByEmail(email);
      
      if (result.found && result.visitor) {
        // Prefill form with existing visitor data (excluding exhibition-specific fields)
        form.setFieldsValue({
          name: result.visitor.name,
          phone: result.visitor.phone,
          company: result.visitor.company,
          designation: result.visitor.designation,
          state: result.visitor.state,
          city: result.visitor.city,
          pincode: result.visitor.pincode,
          address: result.visitor.address,
          // Note: selectedInterests and other exhibition-specific fields are NOT prefilled
        });
        
        return {
          visitor: result.visitor,
          previousRegistrations: result.previousRegistrations || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error looking up visitor:', error);
      return null;
    }
  };

  return { lookupAndPrefillForm };
};
