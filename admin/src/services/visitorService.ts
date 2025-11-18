import api from './api';
import type { Visitor, PaginationParams, PaginatedResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export const visitorService = {
  // Get all visitors with pagination
  async getVisitors(params: PaginationParams): Promise<PaginatedResponse<Visitor>> {
    const response = await api.get(API_ENDPOINTS.VISITORS.LIST, { params });
    return response.data.data;
  },

  // Get visitor by ID
  async getVisitor(id: string): Promise<Visitor> {
    const response = await api.get(`${API_ENDPOINTS.VISITORS.LIST}/${id}`);
    return response.data.data;
  },

  // Create new visitor
  async createVisitor(data: Omit<Visitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Visitor> {
    const response = await api.post(API_ENDPOINTS.VISITORS.CREATE, data);
    return response.data.data;
  },

  // Update visitor
  async updateVisitor(id: string, data: Partial<Visitor>): Promise<Visitor> {
    const response = await api.put(`${API_ENDPOINTS.VISITORS.UPDATE}/${id}`, data);
    return response.data.data;
  },

  // Delete visitor
  async deleteVisitor(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.VISITORS.DELETE}/${id}`);
  },

  // Check in visitor
  async checkInVisitor(id: string): Promise<Visitor> {
    const response = await api.post(`${API_ENDPOINTS.VISITORS.CHECK_IN}/${id}`);
    return response.data.data;
  },

  // Check out visitor
  async checkOutVisitor(id: string): Promise<Visitor> {
    const response = await api.post(`${API_ENDPOINTS.VISITORS.CHECK_OUT}/${id}`);
    return response.data.data;
  },

  // Get visitor statistics
  async getVisitorStats(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/visitors/stats', { params });
    return response.data.data;
  },

  // Export visitors data
  async exportVisitors(params: PaginationParams & { format: 'csv' | 'excel' }): Promise<Blob> {
    const response = await api.get('/visitors/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
