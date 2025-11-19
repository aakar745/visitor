import apiClient from './client';
import { API_ENDPOINTS } from '../constants';
import type { Exhibition } from '@/types';

/**
 * Exhibition API service
 */
export const exhibitionsApi = {
  /**
   * Get all active exhibitions
   */
  async getActiveExhibitions(): Promise<Exhibition[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        exhibitions: Exhibition[];
      };
    }>(API_ENDPOINTS.exhibitions.list, {
      params: {
        status: ['active', 'registration_open'],
        sortBy: 'registrationStartDate',
        sortOrder: 'desc',
        limit: 100,
      },
    });
    return response.data.data.exhibitions;
  },

  /**
   * Get exhibition by slug
   */
  async getExhibitionBySlug(slug: string): Promise<Exhibition> {
    const response = await apiClient.get<{
      success: boolean;
      data: Exhibition;
    }>(`${API_ENDPOINTS.exhibitions.bySlug}/${slug}`);
    return response.data.data;
  },

  /**
   * Get exhibition by ID
   */
  async getExhibitionById(id: string): Promise<Exhibition> {
    const response = await apiClient.get<{
      success: boolean;
      data: Exhibition;
    }>(`${API_ENDPOINTS.exhibitions.list}/${id}`);
    return response.data.data;
  },

  /**
   * Check if registration is open for an exhibition
   */
  isRegistrationOpen(exhibition: Exhibition): boolean {
    const now = new Date();
    const startDate = new Date(exhibition.registrationStartDate);
    const endDate = new Date(exhibition.registrationEndDate);

    return (
      (exhibition.status === 'active' || exhibition.status === 'registration_open') &&
      now >= startDate &&
      now <= endDate
    );
  },

  /**
   * Get active pricing tiers for an exhibition
   * Filters tiers based on current date/time and isActive flag
   */
  getActivePricingTiers(exhibition: Exhibition) {
    if (!exhibition.isPaid || !exhibition.pricingTiers) {
      return [];
    }

    const now = new Date();
    const activeTiers = exhibition.pricingTiers
      .filter(tier => {
        if (!tier.isActive) return false;
        
        // Parse dates from ISO strings
        const tierStart = new Date(tier.startDate);
        const tierEnd = new Date(tier.endDate);
        
        // Tier is active if current time is between start and end
        // Use <= for start (inclusive) and <= for end (inclusive until end of day)
        return now >= tierStart && now <= tierEnd;
      })
      .sort((a, b) => a.price - b.price);
    
    console.log('[PricingTiers] Total tiers:', exhibition.pricingTiers.length);
    console.log('[PricingTiers] Active tiers:', activeTiers.length);
    console.log('[PricingTiers] Current time:', now.toISOString());
    exhibition.pricingTiers.forEach(tier => {
      console.log(`[PricingTiers] Tier "${tier.name}": ${tier.startDate} to ${tier.endDate}, isActive: ${tier.isActive}`);
    });
    
    return activeTiers;
  },

  /**
   * Get active interest options
   */
  getActiveInterestOptions(exhibition: Exhibition) {
    if (!exhibition.interestOptions) {
      return [];
    }

    return exhibition.interestOptions
      .filter((option) => option.isActive)
      .sort((a, b) => a.order - b.order);
  },

  /**
   * Get custom fields sorted by order
   */
  getCustomFields(exhibition: Exhibition) {
    if (!exhibition.customFields) {
      return [];
    }

    return exhibition.customFields.sort((a, b) => a.order - b.order);
  },
};

