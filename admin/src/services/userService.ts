import api from './api';
import type {
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserStats,
  UserActivity,
  UserFilters,
  UserListResponse,
  Permission,
  RolePermissions,
  BulkUserOperation,
  BulkOperationResult,
  PaginationParams
} from '../types';
import { API_ENDPOINTS } from '../constants';

class UserService {
  // Get users with pagination and filtering
  async getUsers(params: PaginationParams & UserFilters): Promise<UserListResponse> {
    const response = await api.get(API_ENDPOINTS.USERS.BASE, { params });
    return response.data.data;
  }

  // Get single user by ID
  async getUser(id: string): Promise<UserProfile> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data.data;
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<UserProfile> {
    const response = await api.post(API_ENDPOINTS.USERS.BASE, userData);
    return response.data.data;
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserRequest): Promise<UserProfile> {
    const response = await api.put(`${API_ENDPOINTS.USERS.BASE}/${id}`, userData);
    return response.data.data;
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`);
  }

  // Reset user password (Admin only - no current password required)
  async resetUserPassword(id: string, passwordData: { newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
    const response = await api.patch(`${API_ENDPOINTS.USERS.BASE}/${id}/reset-password`, passwordData);
    return response.data;
  }

  // Change user password
  async changeUserPassword(id: string, passwordData: ChangePasswordRequest): Promise<void> {
    await api.put(`${API_ENDPOINTS.USERS.BASE}/${id}/password`, passwordData);
  }

  // Activate/Deactivate user
  async toggleUserStatus(id: string, status: 'active' | 'inactive'): Promise<UserProfile> {
    const response = await api.put(`${API_ENDPOINTS.USERS.BASE}/${id}/status`, { status });
    return response.data.data;
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE}/stats`);
    return response.data.data;
  }

  // Get user activity log
  async getUserActivity(userId: string, params?: PaginationParams): Promise<UserActivity[]> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE}/${userId}/activity`, { params });
    return response.data.data;
  }

  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE}/permissions`);
    return response.data.data;
  }

  // Get role permissions
  async getRolePermissions(role: string): Promise<RolePermissions> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE}/roles/${role}/permissions`);
    return response.data.data;
  }

  // Update user permissions
  async updateUserPermissions(id: string, permissions: string[]): Promise<UserProfile> {
    const response = await api.put(`${API_ENDPOINTS.USERS.BASE}/${id}/permissions`, { permissions });
    return response.data.data;
  }

  // Bulk operations
  async bulkOperation(operation: BulkUserOperation): Promise<BulkOperationResult> {
    const response = await api.post(`${API_ENDPOINTS.USERS.BASE}/bulk`, operation);
    return response.data.data;
  }

  // Export users
  async exportUsers(filters?: UserFilters, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const response = await api.post(
      `${API_ENDPOINTS.USERS.BASE}/export`,
      { filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Import users
  async importUsers(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`${API_ENDPOINTS.USERS.BASE}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Send invitation email
  async sendInvitation(email: string, role: string): Promise<void> {
    await api.post(`${API_ENDPOINTS.USERS.BASE}/invite`, { email, role });
  }

  // Resend invitation
  async resendInvitation(userId: string): Promise<void> {
    await api.post(`${API_ENDPOINTS.USERS.BASE}/${userId}/resend-invitation`);
  }
}

export const userService = new UserService();
