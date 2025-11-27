import api from './api';
import type {
  Exhibitor,
  CreateExhibitorRequest,
  UpdateExhibitorRequest,
  ExhibitorListResponse,
  ExhibitorFilters,
  ExhibitorStats,
} from '../types/exhibitors';
import type { PaginationParams } from '../types';

class ExhibitorService {
  /**
   * Get all exhibitors with pagination and filtering
   */
  async getExhibitors(params: PaginationParams & ExhibitorFilters): Promise<ExhibitorListResponse> {
    const response = await api.get('/exhibitors', { params });
    return response.data.data;
  }

  /**
   * Get single exhibitor by ID
   */
  async getExhibitor(id: string): Promise<Exhibitor> {
    const response = await api.get(`/exhibitors/${id}`);
    return response.data.data;
  }

  /**
   * Get exhibitors by exhibition ID
   */
  async getExhibitorsByExhibition(exhibitionId: string, params?: PaginationParams): Promise<ExhibitorListResponse> {
    const response = await api.get(`/exhibitions/${exhibitionId}/exhibitors`, { params });
    // Backend TransformInterceptor wraps response in { success, data, message, timestamp }
    const responseData = response.data.data || response.data;
    return {
      data: responseData?.exhibitors || [],
      pagination: responseData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  /**
   * Create new exhibitor
   */
  async createExhibitor(data: CreateExhibitorRequest): Promise<Exhibitor> {
    const response = await api.post('/exhibitors', data);
    return response.data.data;
  }

  /**
   * Update exhibitor
   */
  async updateExhibitor(id: string, data: UpdateExhibitorRequest): Promise<Exhibitor> {
    const response = await api.put(`/exhibitors/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete exhibitor
   */
  async deleteExhibitor(id: string): Promise<void> {
    await api.delete(`/exhibitors/${id}`);
  }

  /**
   * Toggle exhibitor status (active/inactive)
   */
  async toggleExhibitorStatus(id: string, isActive: boolean): Promise<Exhibitor> {
    const response = await api.patch(`/exhibitors/${id}/status`, { isActive });
    return response.data.data;
  }

  /**
   * Get exhibitor statistics
   */
  async getExhibitorStats(exhibitorId: string): Promise<ExhibitorStats> {
    const response = await api.get(`/exhibitors/${exhibitorId}/stats`);
    return response.data.data;
  }

  /**
   * Generate exhibitor registration link
   * Format: /[exhibition-slug]/[exhibitor-slug]
   */
  generateExhibitorLink(exhibitionSlug: string, exhibitorSlug: string): string {
    const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
    return `${baseUrl}/${exhibitionSlug}/${exhibitorSlug}`;
  }

  /**
   * Generate QR code for exhibitor link
   */
  async generateQRCode(exhibitorId: string): Promise<Blob> {
    const response = await api.get(`/exhibitors/${exhibitorId}/qr-code`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get exhibitor by slug (for frontend registration)
   */
  async getExhibitorBySlug(exhibitionId: string, slug: string): Promise<Exhibitor | null> {
    try {
      const response = await api.get(`/exhibitions/${exhibitionId}/exhibitors/by-slug/${slug}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if slug is available
   */
  async checkSlugAvailability(exhibitionId: string, slug: string, excludeId?: string): Promise<boolean> {
    const response = await api.get('/exhibitors/check-slug', {
      params: { exhibitionId, slug, excludeId },
    });
    return response.data.data.available;
  }

  /**
   * Upload exhibitor logo
   */
  async uploadLogo(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'exhibitor-logo');

    // Don't manually set Content-Type for FormData
    // The browser will set it automatically with the correct boundary
    const response = await api.post('/upload', formData);
    return response.data.data;
  }

  /**
   * Bulk toggle exhibitor status
   */
  async bulkToggleStatus(exhibitorIds: string[], isActive: boolean): Promise<void> {
    await api.post('/exhibitors/bulk/toggle-status', { exhibitorIds, isActive });
  }

  /**
   * Bulk delete exhibitors
   */
  async bulkDelete(exhibitorIds: string[]): Promise<void> {
    await api.post('/exhibitors/bulk/delete', { exhibitorIds });
  }

  /**
   * Export exhibitors list
   */
  async exportExhibitors(exhibitionId: string, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const response = await api.get(`/exhibitions/${exhibitionId}/exhibitors/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const exhibitorService = new ExhibitorService();

