import api from './api';
import type { LoginRequest, LoginResponse, User } from '../types';
import { API_ENDPOINTS } from '../constants';

export const authService = {
  // Login user - Real API call
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data.data;
  },

  /**
   * Logout user - Real API call
   * 
   * SECURITY FIX (BUG-009):
   * Now properly handles logout failures:
   * - If API succeeds: Session cleared on server + client
   * - If API fails: Throws error so UI can show warning
   * 
   * Important: Local state should STILL be cleared even on API failure,
   * but user should be warned that server-side session might still be active.
   */
  async logout(): Promise<{ serverLogoutSuccess: boolean; error?: string }> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return { serverLogoutSuccess: true };
    } catch (error: any) {
      // Log error for debugging
      console.error('Logout API error:', error);
      
      // Return error info instead of swallowing it
      return {
        serverLogoutSuccess: false,
        error: error?.response?.data?.message || error?.message || 'Logout request failed',
      };
    }
  },

  // Refresh access token - Real API call
  // NOTE: Refresh token is in httpOnly cookie, sent automatically by browser
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string; user?: any }> {
    // No need to pass refresh token, it's in httpOnly cookie
    const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, {});
    return response.data.data;
  },

  // Get user profile - Real API call
  async getProfile(): Promise<User> {
    const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data.data;
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put(API_ENDPOINTS.AUTH.PROFILE, data);
    return response.data.data;
  },

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.post('/auth/change-password', data);
  },
};
