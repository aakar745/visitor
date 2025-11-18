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
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  _id: string;
  stateId: string | State;
  name: string;
  isActive: boolean;
  pincodeCount: number;
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
  failed: number;
  errors: string[];
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

  async getCountries(filters?: { isActive?: boolean; search?: string }): Promise<Country[]> {
    try {
      const response = await api.get(`${this.baseUrl}/countries`, { params: filters });
      // Backend response is double-wrapped: response.data.data.data contains the actual array
      return response.data.data.data;
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

  async deleteCountry(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/countries/${id}`);
  }

  // ==========================================================================
  // STATE OPERATIONS
  // ==========================================================================

  async getStates(filters?: { countryId?: string; isActive?: boolean; search?: string }): Promise<State[]> {
    try {
      const response = await api.get(`${this.baseUrl}/states`, { params: filters });
      return response.data.data.data;
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

  async deleteState(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/states/${id}`);
  }

  // ==========================================================================
  // CITY OPERATIONS
  // ==========================================================================

  async getCities(filters?: { stateId?: string; isActive?: boolean; search?: string }): Promise<City[]> {
    try {
      const response = await api.get(`${this.baseUrl}/cities`, { params: filters });
      return response.data.data.data;
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

  async deleteCity(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/cities/${id}`);
  }

  // ==========================================================================
  // PINCODE OPERATIONS
  // ==========================================================================

  async getPincodes(filters?: { cityId?: string; isActive?: boolean; search?: string }): Promise<Pincode[]> {
    try {
      const response = await api.get(`${this.baseUrl}/pincodes`, { params: filters });
      return response.data.data.data;
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

  async deletePincode(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/pincodes/${id}`);
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
      data,
      format: 'json',
    });
    return response.data.data.data;
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
   */
  parseCSV(csvContent: string): BulkImportData[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const data: BulkImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        data.push({
          country: values[0] || '',
          countryCode: values[1] || '',
          state: values[2] || '',
          stateCode: values[3] || '',
          city: values[4] || '',
          pincode: values[5] || '',
          area: values[6] || '',
        });
      }
    }

    return data;
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
}

export const locationService = new LocationService();
export default locationService;
