import { apiClient } from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PincodeLookupResult {
  found: boolean;
  pincode?: string;
  area?: string;
  city?: {
    id: string;
    name: string;
  };
  state?: {
    id: string;
    name: string;
    code: string;
  };
  country?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface PincodeSearchResult {
  _id: string;
  pincode: string;
  area?: string;
  cityId: {
    name: string;
    stateId: {
      name: string;
      code: string;
    };
  };
}

// ============================================================================
// LOCATION API SERVICE
// ============================================================================

class LocationsApi {
  private readonly baseUrl = '/locations';

  /**
   * Lookup location by PIN code
   * Returns complete hierarchy: Country → State → City → PIN
   */
  async lookupByPincode(pincode: string): Promise<PincodeLookupResult> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/pincode/${pincode}`);
      // Response is double-wrapped: response.data.data contains {found, data}
      const result = response.data.data;
      
      // If found, extract the nested data
      if (result.found && result.data) {
        return {
          found: true,
          pincode: result.data.pincode,
          area: result.data.area,
          city: result.data.city,
          state: result.data.state,
          country: result.data.country,
        };
      }
      
      return { found: false };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { found: false };
      }
      throw error;
    }
  }

  /**
   * Search PIN codes with autocomplete
   * For frontend registration form suggestion dropdown
   */
  async searchPincodes(query: string, limit: number = 10): Promise<PincodeSearchResult[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/search/pincodes`, {
        params: { q: query, limit },
      });
      return response.data.data.data;
    } catch (error) {
      console.error('Error searching pincodes:', error);
      return [];
    }
  }

  /**
   * Get all active countries
   * For frontend registration form country dropdown (public endpoint)
   */
  async getCountries(): Promise<Array<{_id: string; name: string; code: string; isActive: boolean}>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/countries`, {
        params: { isActive: true },
      });
      // Response is double-wrapped: response.data.data.data contains the array
      return response.data.data.data || [];
    } catch (error: any) {
      console.error('[LocationsApi] Error fetching countries:', error);
      return [];
    }
  }

  /**
   * Fast autocomplete search for PIN codes using Meilisearch
   * Returns results in < 20ms with highlighting
   */
  async autocompletePincodes(query: string, limit: number = 10): Promise<{
    hits: Array<{
      id: string;
      pincode: string;
      area?: string;
      cityName: string;
      stateName: string;
      stateCode: string;
      countryName: string;
      countryCode: string;
      _formatted?: any;
    }>;
    estimatedTotalHits: number;
    processingTimeMs: number;
  }> {
    try {
      if (!query || query.length < 2) {
        return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
      }

      const response = await apiClient.get(`${this.baseUrl}/search/pincodes/autocomplete`, {
        params: { q: query, limit },
      });

      // Response structure: response.data.data contains { data, estimatedTotalHits, processingTimeMs }
      const result = response.data.data;
      return {
        hits: result.data || [],
        estimatedTotalHits: result.estimatedTotalHits || 0,
        processingTimeMs: result.processingTimeMs || 0,
      };
    } catch (error: any) {
      console.error('[LocationsApi] Autocomplete error:', error);
      return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0 };
    }
  }
}

export const locationsApi = new LocationsApi();
