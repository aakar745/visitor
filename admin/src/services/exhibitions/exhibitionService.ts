import api from '../api';
import type { 
  Exhibition, 
  ExhibitionRequest, 
  ExhibitionListResponse, 
  ExhibitionFilters,
  ExhibitionAnalytics,
  ExhibitionStatus 
} from '../../types/exhibitions';
import { API_ENDPOINTS } from '../../constants';

export const exhibitionService = {
  // Get all exhibitions with filters and pagination
  async getExhibitions(params: {
    page: number;
    limit: number;
    filters?: ExhibitionFilters;
  }): Promise<ExhibitionListResponse> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });

    if (params.filters?.search) {
      queryParams.append('search', params.filters.search);
    }

    if (params.filters?.status && params.filters.status.length > 0) {
      params.filters.status.forEach(status => queryParams.append('status', status));
    }

    if (params.filters?.isPaid !== undefined) {
      queryParams.append('isPaid', params.filters.isPaid.toString());
    }

    if (params.filters?.dateRange) {
      queryParams.append('startDate', params.filters.dateRange.startDate);
      queryParams.append('endDate', params.filters.dateRange.endDate);
    }

    const response = await api.get(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}?${queryParams.toString()}`);
    
    // Backend TransformInterceptor wraps response in { success, data, message, timestamp }
    // The actual data is in response.data.data which contains { exhibitions, pagination }
    const responseData = response.data.data;
    
    // Transform _id to id for frontend compatibility
    const exhibitions = (responseData?.exhibitions || []).map((ex: any) => ({
      ...ex,
      id: ex._id || ex.id,
    }));
    
    return {
      data: exhibitions,
      pagination: responseData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };

    
  },

  // Get single exhibition by ID
  async getExhibition(id: string): Promise<Exhibition> {
    const response = await api.get(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}`);
    const data = response.data.data;
    // Transform _id to id for frontend compatibility
    return {
      ...data,
      id: data._id || data.id,
    };
  },

  // Create new exhibition
  async createExhibition(data: ExhibitionRequest): Promise<Exhibition> {
    const response = await api.post(API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions', data);
    const result = response.data.data;
    // Transform _id to id for frontend compatibility
    return {
      ...result,
      id: result._id || result.id,
    };
  },

  // Update existing exhibition
  async updateExhibition(id: string, data: Partial<ExhibitionRequest>): Promise<Exhibition> {
    const response = await api.put(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}`, data);
    const result = response.data.data;
    // Transform _id to id for frontend compatibility
    return {
      ...result,
      id: result._id || result.id,
    };
  },

  // Delete exhibition
  async deleteExhibition(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}`);
  },

  // Update exhibition status
  async updateExhibitionStatus(id: string, status: ExhibitionStatus): Promise<Exhibition> {
    const response = await api.patch(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}/status`, { 
      status 
    });
    const result = response.data.data;
    // Transform _id to id for frontend compatibility
    return {
      ...result,
      id: result._id || result.id,
    };
  },

  // Upload exhibition files (logo, banner)
  async uploadFile(file: File, type: 'logo' | 'badge-logo' | 'banner'): Promise<{
    id: string;
    url: string;
    filename: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Don't manually set Content-Type for FormData
    // The browser will set it automatically with the correct boundary
    // The interceptor handles removing the default Content-Type header
    const response = await api.post('/exhibitions/upload', formData);
    return response.data.data;
  },

  // Get exhibition analytics
  async getExhibitionAnalytics(id: string): Promise<ExhibitionAnalytics> {
    const response = await api.get(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}/analytics`);
    return response.data.data;
  },

  // Duplicate exhibition
  async duplicateExhibition(id: string, newName: string): Promise<Exhibition> {
    const response = await api.post(`${API_ENDPOINTS.EXHIBITIONS?.BASE || '/exhibitions'}/${id}/duplicate`, {
      name: newName
    });
    return response.data.data;
  }
};
