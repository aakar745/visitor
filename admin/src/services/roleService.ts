import api from './api';
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  RoleStats,
  RoleFilters,
  RoleListResponse,
  PermissionGroup,
  RoleTemplate,
  RoleAuditLog,
  BulkRoleOperation,
  BulkRoleOperationResult,
  RoleComparison,
  RoleAssignment,
  PaginationParams
} from '../types';
import { API_ENDPOINTS } from '../constants';

class RoleService {
  // Get roles with pagination and filtering
  async getRoles(params: PaginationParams & RoleFilters): Promise<RoleListResponse> {
    const response = await api.get(API_ENDPOINTS.ROLES.BASE, { params });
    return response.data.data;
  }

  // Get single role by ID
  async getRole(id: string): Promise<Role> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/${id}`);
    return response.data.data;
  }

  // Create new role
  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    const response = await api.post(API_ENDPOINTS.ROLES.BASE, roleData);
    return response.data.data;
  }

  // Update role
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    const response = await api.put(`${API_ENDPOINTS.ROLES.BASE}/${id}`, roleData);
    return response.data.data;
  }

  // Delete role
  async deleteRole(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.ROLES.BASE}/${id}`);
  }

  // Toggle role status
  async toggleRoleStatus(id: string, isActive: boolean): Promise<Role> {
    const response = await api.put(`${API_ENDPOINTS.ROLES.BASE}/${id}/status`, { isActive });
    return response.data.data;
  }

  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await api.get(API_ENDPOINTS.ROLES.PERMISSIONS);
    return response.data.data;
  }

  // Get permissions grouped by category
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.PERMISSIONS}/groups`);
    return response.data.data;
  }

  // Get role statistics
  async getRoleStats(): Promise<RoleStats> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/stats`);
    return response.data.data;
  }

  // Get role templates
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/templates`);
    return response.data.data;
  }

  // Create role from template
  async createFromTemplate(templateId: string, roleData: Partial<CreateRoleRequest>): Promise<Role> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/templates/${templateId}`, roleData);
    return response.data.data;
  }

  // Get role audit log
  async getRoleAuditLog(roleId: string, params?: PaginationParams): Promise<RoleAuditLog[]> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/${roleId}/audit`, { params });
    return response.data.data;
  }

  // Assign role to user
  async assignRole(userId: string, roleId: string, expiresAt?: string): Promise<RoleAssignment> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/assign`, {
      userId,
      roleId,
      expiresAt
    });
    return response.data.data;
  }

  // Remove role from user
  async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.ROLES.BASE}/assign`, {
      data: { userId, roleId }
    });
  }

  // Get role assignments for user
  async getUserRoles(userId: string): Promise<RoleAssignment[]> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/assignments/user/${userId}`);
    return response.data.data;
  }

  // Get users assigned to role
  async getRoleUsers(roleId: string, params?: PaginationParams): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/${roleId}/users`, { params });
    return response.data.data;
  }

  // Bulk operations on roles
  async bulkOperation(operation: BulkRoleOperation): Promise<BulkRoleOperationResult> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/bulk`, operation);
    return response.data.data;
  }

  // Compare roles
  async compareRoles(roleIds: string[]): Promise<RoleComparison> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/compare`, { roleIds });
    return response.data.data;
  }

  // Duplicate role
  async duplicateRole(roleId: string, newName: string): Promise<Role> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/${roleId}/duplicate`, { name: newName });
    return response.data.data;
  }

  // Export roles
  async exportRoles(filters?: RoleFilters, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const response = await api.post(
      `${API_ENDPOINTS.ROLES.BASE}/export`,
      { filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Import roles
  async importRoles(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`${API_ENDPOINTS.ROLES.BASE}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Validate role permissions
  async validatePermissions(permissionIds: string[]): Promise<{
    valid: string[];
    invalid: string[];
    conflicts: { permissionId: string; conflict: string }[];
  }> {
    const response = await api.post(`${API_ENDPOINTS.ROLES.PERMISSIONS}/validate`, { permissionIds });
    return response.data.data;
  }

  // Get effective permissions for user (combined from all roles)
  async getUserEffectivePermissions(userId: string): Promise<Permission[]> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/user/${userId}/effective-permissions`);
    return response.data.data;
  }

  // Check if user has specific permission
  async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/user/${userId}/check-permission`, {
      params: { permission }
    });
    return response.data.data.hasPermission;
  }

  // Get role hierarchy (for future implementation)
  async getRoleHierarchy(): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/hierarchy`);
    return response.data.data;
  }
}

export const roleService = new RoleService();
