import api from './api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Country {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  stateCount: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface State {
  _id: string;
  countryId: string | Country;
  name: string;
  code: string;
  isActive: boolean;
  cityCount: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  _id: string;
  stateId: string | State;
  name: string;
  isActive: boolean;
  pincodeCount: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pincode {
  _id: string;
  cityId: string | City;
  pincode: string;
  area?: string;
  isActive: boolean;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface BulkImportResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
  details: {
    countriesCreated: number;
    statesCreated: number;
    citiesCreated: number;
    pincodesCreated: number;
    pincodesSkipped: number;
  };
}

export interface BulkImportData {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  pincode: string;
  area?: string;
}

// ============================================================================
// LOCATION SERVICE
// ============================================================================

class LocationService {
  private readonly baseUrl = '/locations';

  // ==========================================================================
  // COUNTRY OPERATIONS
  // ==========================================================================

  async getCountries(filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Country[]; pagination: any }> {
    try {
      const response = await api.get(`${this.baseUrl}/countries`, { params: filters });
      
      // Handle different response formats for backward compatibility
      if (response.data.pagination) {
        // Direct pagination format: response.data.pagination
        return {
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
        // Triple-nested format: response.data.data.data and response.data.data.pagination
        const innerData = response.data.data;
        return {
          data: innerData.data || [],
          pagination: innerData.pagination || {
            total: innerData.data?.length || 0,
            page: 1,
            limit: innerData.data?.length || 0,
            totalPages: 1,
          },
        };
      } else {
        // Old format (array only) - create pagination wrapper
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  async getCountryById(id: string): Promise<Country> {
    const response = await api.get(`${this.baseUrl}/countries/${id}`);
    return response.data.data.data;
  }

  async createCountry(data: { name: string; code: string; isActive?: boolean }): Promise<Country> {
    const response = await api.post(`${this.baseUrl}/countries`, data);
    return response.data.data.data;
  }

  async updateCountry(id: string, data: Partial<Country>): Promise<Country> {
    const response = await api.put(`${this.baseUrl}/countries/${id}`, data);
    return response.data.data.data;
  }

  async deleteCountry(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number; message: string }> {
    const response = await api.delete(`${this.baseUrl}/countries/${id}`);
    return {
      ...response.data.data,
      message: response.data.message,
    };
  }

  // ==========================================================================
  // STATE OPERATIONS
  // ==========================================================================

  async getStates(filters?: {
    page?: number;
    limit?: number;
    countryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: State[]; pagination: any }> {
    try {
      const response = await api.get(`${this.baseUrl}/states`, { params: filters });
      
      // Handle different response formats
      if (response.data.pagination) {
        // New paginated format
        return {
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
        // Triple-nested response
        const innerData = response.data.data;
        return {
          data: innerData.data || [],
          pagination: innerData.pagination || {
            total: innerData.data?.length || 0,
            page: 1,
            limit: innerData.data?.length || 0,
            totalPages: 1,
          },
        };
      } else {
        // Old format (array)
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      throw error;
    }
  }

  async getStateById(id: string): Promise<State> {
    const response = await api.get(`${this.baseUrl}/states/${id}`);
    return response.data.data.data;
  }

  async createState(data: { countryId: string; name: string; code: string; isActive?: boolean }): Promise<State> {
    const response = await api.post(`${this.baseUrl}/states`, data);
    return response.data.data.data;
  }

  async updateState(id: string, data: Partial<State>): Promise<State> {
    const response = await api.put(`${this.baseUrl}/states/${id}`, data);
    return response.data.data.data;
  }

  async deleteState(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number; message: string }> {
    const response = await api.delete(`${this.baseUrl}/states/${id}`);
    return {
      ...response.data.data,
      message: response.data.message,
    };
  }

  // ==========================================================================
  // CITY OPERATIONS
  // ==========================================================================

  async getCities(filters?: {
    page?: number;
    limit?: number;
    stateId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: City[]; pagination: any }> {
    try {
      const response = await api.get(`${this.baseUrl}/cities`, { params: filters });
      
      // Handle different response formats
      if (response.data.pagination) {
        // New paginated format
        return {
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
        // Triple-nested response
        const innerData = response.data.data;
        return {
          data: innerData.data || [],
          pagination: innerData.pagination || {
            total: innerData.data?.length || 0,
            page: 1,
            limit: innerData.data?.length || 0,
            totalPages: 1,
          },
        };
      } else {
        // Old format (array)
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  }

  async getCityById(id: string): Promise<City> {
    const response = await api.get(`${this.baseUrl}/cities/${id}`);
    return response.data.data.data;
  }

  async createCity(data: { stateId: string; name: string; isActive?: boolean }): Promise<City> {
    const response = await api.post(`${this.baseUrl}/cities`, data);
    return response.data.data.data;
  }

  async updateCity(id: string, data: Partial<City>): Promise<City> {
    const response = await api.put(`${this.baseUrl}/cities/${id}`, data);
    return response.data.data.data;
  }

  async deleteCity(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number; message: string }> {
    const response = await api.delete(`${this.baseUrl}/cities/${id}`);
    return {
      ...response.data.data,
      message: response.data.message,
    };
  }

  // ==========================================================================
  // PINCODE OPERATIONS
  // ==========================================================================

  async getPincodes(filters?: {
    page?: number;
    limit?: number;
    cityId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Pincode[]; pagination: any }> {
    try {
      const response = await api.get(`${this.baseUrl}/pincodes`, { params: filters });
      
      // Handle different response formats
      if (response.data.pagination) {
        // New paginated format
        return {
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
        // Triple-nested response
        const innerData = response.data.data;
        return {
          data: innerData.data || [],
          pagination: innerData.pagination || {
            total: innerData.data?.length || 0,
            page: 1,
            limit: innerData.data?.length || 0,
            totalPages: 1,
          },
        };
      } else {
        // Old format (array)
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        return {
          data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching pincodes:', error);
      throw error;
    }
  }

  async getPincodeById(id: string): Promise<Pincode> {
    const response = await api.get(`${this.baseUrl}/pincodes/${id}`);
    return response.data.data.data;
  }

  async createPincode(data: { cityId: string; pincode: string; area?: string; isActive?: boolean }): Promise<Pincode> {
    const response = await api.post(`${this.baseUrl}/pincodes`, data);
    return response.data.data.data;
  }

  async updatePincode(id: string, data: Partial<Pincode>): Promise<Pincode> {
    const response = await api.put(`${this.baseUrl}/pincodes/${id}`, data);
    return response.data.data.data;
  }

  async deletePincode(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number; message: string }> {
    const response = await api.delete(`${this.baseUrl}/pincodes/${id}`);
    return {
      ...response.data.data,
      message: response.data.message,
    };
  }

  // ==========================================================================
  // LOOKUP & SEARCH (PUBLIC)
  // ==========================================================================

  /**
   * Lookup location by PIN code
   * Returns complete hierarchy: Country → State → City → PIN
   */
  async lookupByPincode(pincode: string): Promise<PincodeLookupResult> {
    try {
      const response = await api.get(`${this.baseUrl}/pincode/${pincode}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { found: false };
      }
      throw error;
    }
  }

  /**
   * Search PIN codes with autocomplete
   * For frontend registration form
   */
  async searchPincodes(query: string, limit: number = 10): Promise<Pincode[]> {
    try {
      const response = await api.get(`${this.baseUrl}/search/pincodes`, {
        params: { q: query, limit },
      });
      return response.data.data.data;
    } catch (error) {
      console.error('Error searching pincodes:', error);
      return [];
    }
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Bulk import locations from CSV/JSON data
   * Format: { data: BulkImportData[], format: 'csv' | 'json' }
   */
  async bulkImport(data: BulkImportData[]): Promise<BulkImportResult> {
    const response = await api.post(`${this.baseUrl}/bulk-import`, {
      locations: data,
    });
    
    // The response is triple-nested!
    // response.data = { success: true, data: {...}, message: '...', timestamp: '...' }
    // response.data.data = { success: true, message: 'Bulk import completed', data: {...} }
    // response.data.data.data = The ACTUAL result { success: 123, skipped: 456, ... }
    const result = response.data.data.data;
    
    console.log('[bulkImport] Extracted result:', result);
    
    // Ensure we return the correct structure with proper number types
    return {
      success: Number(result.success) || 0,
      skipped: Number(result.skipped) || 0,
      failed: Number(result.failed) || 0,
      errors: Array.isArray(result.errors) ? result.errors : [],
      details: result.details || {
        countriesCreated: 0,
        statesCreated: 0,
        citiesCreated: 0,
        pincodesCreated: 0,
        pincodesSkipped: 0,
      },
    };
  }

  /**
   * Export all locations as CSV
   */
  async exportLocations(): Promise<void> {
    const response = await api.get(`${this.baseUrl}/export`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `locations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Parse CSV file to bulk import format
   * Properly handles quoted fields with commas and newlines
   */
  parseCSV(csvContent: string): BulkImportData[] {
    const data: BulkImportData[] = [];
    
    // Split by newlines but handle quoted fields that may contain newlines
    const lines = csvContent.split(/\r?\n/);
    if (lines.length === 0) return data;

    // Skip header row
    let currentLine = 1;
    
    while (currentLine < lines.length) {
      const line = lines[currentLine].trim();
      if (!line) {
        currentLine++;
        continue;
      }

      // Parse CSV line with proper handling of quoted fields
      const values = this.parseCSVLine(line);
      
      // Expected format: Country,CountryCode,State,StateCode,City,Pincode,Area
      if (values.length >= 6) {
        data.push({
          country: values[0] || '',
          countryCode: values[1] || '',
          state: values[2] || '',
          stateCode: values[3] || '',
          city: values[4] || '',
          pincode: values[5] || '',
          area: values[6] || '', // Area is optional
        });
      }
      
      currentLine++;
    }

    return data;
  }

  /**
   * Parse a single CSV line, handling quoted fields properly
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator (only when not inside quotes)
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current.trim());
    
    return result;
  }

  /**
   * Generate CSV template for bulk import
   */
  downloadCSVTemplate(): void {
    const template = `Country,Country Code,State,State Code,City,PIN Code,Area
India,IN,Gujarat,GJ,Ahmedabad,380001,Ellis Bridge
India,IN,Gujarat,GJ,Ahmedabad,380004,Navrangpura
India,IN,Maharashtra,MH,Mumbai,400001,Fort`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'location_import_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Validate bulk import data
   */
  validateBulkData(data: BulkImportData[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    data.forEach((item, index) => {
      if (!item.country) errors.push(`Row ${index + 1}: Country is required`);
      if (!item.countryCode) errors.push(`Row ${index + 1}: Country Code is required`);
      if (!item.state) errors.push(`Row ${index + 1}: State is required`);
      if (!item.stateCode) errors.push(`Row ${index + 1}: State Code is required`);
      if (!item.city) errors.push(`Row ${index + 1}: City is required`);
      if (!item.pincode) errors.push(`Row ${index + 1}: PIN Code is required`);
      if (item.pincode && !/^\d{6}$/.test(item.pincode)) {
        errors.push(`Row ${index + 1}: Invalid PIN Code format (must be 6 digits)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==========================================================================
  // MAINTENANCE
  // ==========================================================================

  /**
   * Recalculate pincode usage counts based on actual registrations
   */
  async recalculatePincodeUsage(): Promise<{
    totalPincodes: number;
    updated: number;
    errors: number;
  }> {
    const response = await api.post(`${this.baseUrl}/pincodes/recalculate-usage`);
    return response.data.data;
  }

  /**
   * Recalculate country usage counts based on actual registrations
   */
  async recalculateCountryUsage(): Promise<{
    totalCountries: number;
    updated: number;
    errors: number;
  }> {
    const response = await api.post(`${this.baseUrl}/countries/recalculate-usage`);
    return response.data.data;
  }

  /**
   * Recalculate state usage counts based on actual registrations
   */
  async recalculateStateUsage(): Promise<{
    totalStates: number;
    updated: number;
    errors: number;
  }> {
    const response = await api.post(`${this.baseUrl}/states/recalculate-usage`);
    return response.data.data;
  }

  /**
   * Recalculate city usage counts based on actual registrations
   */
  async recalculateCityUsage(): Promise<{
    totalCities: number;
    updated: number;
    errors: number;
  }> {
    const response = await api.post(`${this.baseUrl}/cities/recalculate-usage`);
    return response.data.data;
  }

  /**
   * Recalculate ALL location usage counts at once
   */
  async recalculateAllUsage(): Promise<{
    countries: { totalCountries: number; updated: number; errors: number };
    states: { totalStates: number; updated: number; errors: number };
    cities: { totalCities: number; updated: number; errors: number };
    pincodes: { totalPincodes: number; updated: number; errors: number };
  }> {
    const response = await api.post(`${this.baseUrl}/recalculate-all-usage`);
    return response.data.data;
  }

  // ==========================================================================
  // BULK DELETE
  // ==========================================================================

  /**
   * Bulk delete cities
   */
  async bulkDeleteCities(ids: string[]): Promise<{
    deleted: number;
    softDeleted: number;
    failed: number;
    errors: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/cities/bulk-delete`, { ids });
    return response.data.data;
  }

  /**
   * Bulk delete pincodes
   */
  async bulkDeletePincodes(ids: string[]): Promise<{
    deleted: number;
    softDeleted: number;
    failed: number;
    errors: string[];
  }> {
    const response = await api.post(`${this.baseUrl}/pincodes/bulk-delete`, { ids });
    return response.data.data;
  }
}

export const locationService = new LocationService();
export default locationService;
