import apiClient from './client';
import { API_ENDPOINTS } from '../constants';
import type { RegistrationFormData, RegistrationResponse } from '@/types';

/**
 * Registration API service
 */
export const registrationsApi = {
  /**
   * Create a new registration
   * This endpoint will:
   * 1. Create or lookup visitor by email
   * 2. Create exhibition registration
   * 3. Generate QR code and badge
   * 4. Return registration details
   */
  async createRegistration(data: RegistrationFormData): Promise<RegistrationResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: RegistrationResponse;
      message: string;
    }>(API_ENDPOINTS.registrations.create, data);
    
    return response.data.data;
  },

  /**
   * Verify registration by ID
   * Used on the success page to fetch registration details
   */
  async verifyRegistration(registrationId: string): Promise<RegistrationResponse> {
    const response = await apiClient.get<{
      success: boolean;
      data: RegistrationResponse;
    }>(`${API_ENDPOINTS.registrations.verify}/${registrationId}`);
    return response.data.data;
  },

  /**
   * Lookup visitor by email or phone
   * Returns visitor profile if exists, null otherwise
   */
  async lookupVisitorByEmail(email: string) {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          visitor: any;
          registrations: any[];
        } | null;
      }>(`${API_ENDPOINTS.registrations.create}/lookup`, {
        params: { email },
      });
      // Handle null data (visitor not found)
      return response.data.data || null;
    } catch (error: any) {
      // If 404, visitor doesn't exist (not an error)
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Lookup visitor by phone number
   * Returns visitor profile if exists, null otherwise
   */
  async lookupVisitorByPhone(phone: string) {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          visitor: any;
          registrations: any[];
        } | null;
      }>(`${API_ENDPOINTS.registrations.create}/lookup`, {
        params: { phone },
      });
      // Handle null data (visitor not found)
      return response.data.data || null;
    } catch (error: any) {
      // If 404, visitor doesn't exist (not an error)
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  },
};

