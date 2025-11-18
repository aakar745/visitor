import apiClient from './client';
import { API_ENDPOINTS } from '../constants';
import type { Exhibitor } from '@/types';

/**
 * Exhibitor API service
 */
export const exhibitorsApi = {
  /**
   * Get exhibitor by slug within an exhibition
   */
  async getExhibitorBySlug(
    exhibitionId: string,
    exhibitorSlug: string
  ): Promise<Exhibitor> {
    const response = await apiClient.get<{
      success: boolean;
      data: Exhibitor;
    }>(`${API_ENDPOINTS.exhibitions.list}/${exhibitionId}/exhibitors/by-slug/${exhibitorSlug}`);
    return response.data.data;
  },

  /**
   * Get all exhibitors for an exhibition
   */
  async getExhibitorsByExhibition(exhibitionId: string): Promise<Exhibitor[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        exhibitors: Exhibitor[];
      };
    }>(`${API_ENDPOINTS.exhibitions.list}/${exhibitionId}/exhibitors`, {
      params: {
        isActive: true,
        limit: 500,
      },
    });
    return response.data.data.exhibitors;
  },
};

