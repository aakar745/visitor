import api from './api';
import { API_ENDPOINTS } from '../constants';

export interface Role {
  _id: string;
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystemRole: boolean;
  isActive: boolean;
  permissions?: any[];
}

export const roleService = {
  // Get all roles (simple list for Users page)
  async getRoles(): Promise<Role[]> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles`);
    const roles = response.data.data.roles || [];
    return roles.map((role: any) => ({
      ...role,
      id: role._id || role.id,
    }));
  },

  // Get paginated roles (for Roles page)
  async getPaginatedRoles(params: any): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles`, { params });
    return response.data.data;
  },

  async getPermissionGroups(): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles/permissions/groups`);
    return response.data.data;
  },

  async getRoleTemplates(): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles/templates`);
    return response.data.data;
  },

  async getRoleStats(): Promise<any> {
    const response = await api.get(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles/stats`);
    return response.data.data;
  },

  async createRole(data: any): Promise<Role> {
    const response = await api.post(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles`, data);
    return response.data.data;
  },

  async updateRole(id: string, data: any): Promise<Role> {
    const response = await api.put(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles/${id}`, data);
    return response.data.data;
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.USERS.BASE.replace('/users', '')}/roles/${id}`);
  },
};
