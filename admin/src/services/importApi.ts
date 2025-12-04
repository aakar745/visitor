import apiClient from './api';
import type {
  ImportProgress,
  ImportHistoryItem,
} from '../types/import.types';
import { DuplicateStrategy } from '../types/import.types';

export const importApi = {
  /**
   * Upload CSV file and initiate import
   */
  uploadVisitors: async (
    file: File,
    duplicateStrategy: DuplicateStrategy = DuplicateStrategy.SKIP,
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('duplicateStrategy', duplicateStrategy);

    // Don't set Content-Type manually - let the browser set it with the correct boundary
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { importId: string; totalRows: number; status: string };
    }>('/visitor-imports/upload', formData);

    return response.data;
  },

  /**
   * Get import progress
   */
  getProgress: async (importId: string) => {
    const response = await apiClient.get<{
      success: boolean;
      data: ImportProgress;
      message: string;
      timestamp: string;
    }>(`/visitor-imports/progress/${importId}`);

    console.log('[importApi.getProgress] Raw response:', response.data);
    
    // TransformInterceptor wraps response as { success, data, message, timestamp }
    return response.data;
  },

  /**
   * Get my import history
   */
  getMyHistory: async (limit: number = 20) => {
    const response = await apiClient.get<{
      success: boolean;
      data: ImportHistoryItem[];
    }>('/visitor-imports/history/me', {
      params: { limit },
    });

    return response.data;
  },

  /**
   * Get all import history (super admin)
   */
  getAllHistory: async (limit: number = 50) => {
    const response = await apiClient.get<{
      success: boolean;
      data: ImportHistoryItem[];
    }>('/visitor-imports/history/all', {
      params: { limit },
    });

    return response.data;
  },

  /**
   * Rollback an import
   */
  rollbackImport: async (importId: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      data: { deletedCount: number };
    }>(`/visitor-imports/rollback/${importId}`);

    return response.data;
  },

  /**
   * Download CSV template
   */
  downloadTemplate: async () => {
    const response = await apiClient.get('/visitor-imports/template/download', {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv',
      },
    });

    // Create download link
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'visitor-import-template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get global visitor statistics
   */
  getStats: async () => {
    const response = await apiClient.get<{
      success: boolean;
      data: {
        totalVisitors: number;
        visitorsWithEmail: number;
        visitorsWithCompany: number;
        emailPercentage: string;
        companyPercentage: string;
        topCities: Array<{ city: string; count: number }>;
        topStates: Array<{ state: string; count: number }>;
        registrationDistribution: Array<{ registrations: number; count: number }>;
      };
    }>('/visitor-imports/stats');

    return response.data;
  },
};

