import api from './api';
import type {
  Setting,
  SettingsCategory,
  UpdateSettingRequest,
  BulkUpdateSettingsRequest,
  SettingsValidationResult,
  SettingsBackup,
  RestoreSettingsRequest,
  SettingsExportRequest,
  SettingsImportRequest,
  SettingHistory,
  SettingsDashboard,
  SettingsFilters,
  SettingsSearchResult,
  SettingsMigration,
  SettingCategory as SettingCategoryType,
  PaginationParams
} from '../types';
import { API_ENDPOINTS } from '../constants';

class SettingsService {
  // Get all settings grouped by category
  async getSettings(): Promise<SettingsCategory[]> {
    const response = await api.get(API_ENDPOINTS.SETTINGS.BASE);
    return response.data.data;
  }

  // Get settings by category
  async getSettingsByCategory(category: SettingCategoryType): Promise<SettingsCategory> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/category/${category}`);
    return response.data.data;
  }

  // Get single setting by key
  async getSetting(key: string): Promise<Setting> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/key/${key}`);
    return response.data.data;
  }

  // Update single setting
  async updateSetting(key: string, data: UpdateSettingRequest): Promise<Setting> {
    const response = await api.put(`${API_ENDPOINTS.SETTINGS.BASE}/key/${key}`, data);
    return response.data.data;
  }

  // Bulk update settings
  async bulkUpdateSettings(data: BulkUpdateSettingsRequest): Promise<Setting[]> {
    const response = await api.put(`${API_ENDPOINTS.SETTINGS.BULK}`, data);
    return response.data.data;
  }

  // Reset setting to default value
  async resetSetting(key: string): Promise<Setting> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/key/${key}/reset`);
    return response.data.data;
  }

  // Reset multiple settings to default values
  async resetSettings(keys: string[]): Promise<Setting[]> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/reset`, { keys });
    return response.data.data;
  }

  // Validate settings
  async validateSettings(settings: { key: string; value: any }[]): Promise<SettingsValidationResult> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/validate`, { settings });
    return response.data.data;
  }

  // Search settings
  async searchSettings(query: string, filters?: SettingsFilters): Promise<SettingsSearchResult[]> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/search`, {
      params: { query, ...filters }
    });
    return response.data.data;
  }

  // Get settings dashboard data
  async getSettingsDashboard(): Promise<SettingsDashboard> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/dashboard`);
    return response.data.data;
  }

  // Backup Settings
  async createBackup(name: string, description?: string): Promise<SettingsBackup> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BACKUP}`, { name, description });
    return response.data.data;
  }

  async getBackups(params?: PaginationParams): Promise<{ backups: SettingsBackup[]; total: number }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BACKUP}`, { params });
    return response.data.data;
  }

  async deleteBackup(backupId: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.SETTINGS.BACKUP}/${backupId}`);
  }

  async restoreFromBackup(data: RestoreSettingsRequest): Promise<Setting[]> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/restore`, data);
    return response.data.data;
  }

  // Import/Export Settings
  async exportSettings(data: SettingsExportRequest): Promise<Blob> {
    const response = await api.post(
      `${API_ENDPOINTS.SETTINGS.EXPORT}`,
      data,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async importSettings(data: SettingsImportRequest): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: { key: string; error: string }[];
  }> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.overwrite) formData.append('overwrite', 'true');
    if (data.skipValidation) formData.append('skipValidation', 'true');

    const response = await api.post(`${API_ENDPOINTS.SETTINGS.IMPORT}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  }

  // Settings History
  async getSettingHistory(
    key?: string, 
    params?: PaginationParams
  ): Promise<{ history: SettingHistory[]; total: number }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/history`, {
      params: { key, ...params }
    });
    return response.data.data;
  }

  // System Health Check
  async checkSystemHealth(): Promise<{
    database: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    cache: 'healthy' | 'warning' | 'error';
    integrations: 'healthy' | 'warning' | 'error';
    details: { [key: string]: any };
  }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/health`);
    return response.data.data;
  }

  // Settings Migrations
  async getMigrations(): Promise<SettingsMigration[]> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/migrations`);
    return response.data.data;
  }

  async applyMigration(migrationId: string): Promise<void> {
    await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/migrations/${migrationId}/apply`);
  }

  // File Upload (for logos, images, etc.)
  async uploadFile(file: File, type: 'logo' | 'favicon' | 'image'): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  }

  // Test Integration Settings
  async testIntegration(type: string, settings: { [key: string]: any }): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    const response = await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/test-integration`, {
      type,
      settings
    });
    return response.data.data;
  }

  // Environment Variables
  async getEnvironmentVariables(): Promise<{ [key: string]: string }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/env`);
    return response.data.data;
  }

  async updateEnvironmentVariable(key: string, value: string): Promise<void> {
    await api.put(`${API_ENDPOINTS.SETTINGS.BASE}/env/${key}`, { value });
  }

  // Cache Management
  async clearCache(cacheKeys?: string[]): Promise<void> {
    await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/cache/clear`, { keys: cacheKeys });
  }

  async getCacheStats(): Promise<{
    hitRate: number;
    missRate: number;
    totalKeys: number;
    memoryUsage: number;
    uptime: number;
  }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/cache/stats`);
    return response.data.data;
  }

  // Maintenance Mode
  async enableMaintenanceMode(message?: string, duration?: number): Promise<void> {
    await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/maintenance/enable`, { message, duration });
  }

  async disableMaintenanceMode(): Promise<void> {
    await api.post(`${API_ENDPOINTS.SETTINGS.BASE}/maintenance/disable`);
  }

  async getMaintenanceStatus(): Promise<{
    enabled: boolean;
    message?: string;
    enabledAt?: string;
    enabledBy?: string;
    estimatedDuration?: number;
  }> {
    const response = await api.get(`${API_ENDPOINTS.SETTINGS.BASE}/maintenance/status`);
    return response.data.data;
  }

  // Specific Setting Type Helpers
  async getGeneralSettings(): Promise<any> {
    return this.getSettingsByCategory('general');
  }

  async getSecuritySettings(): Promise<any> {
    return this.getSettingsByCategory('security');
  }

  async getVisitorSettings(): Promise<any> {
    return this.getSettingsByCategory('visitor');
  }

  async getExhibitionSettings(): Promise<any> {
    return this.getSettingsByCategory('exhibition');
  }

  async getNotificationSettings(): Promise<any> {
    return this.getSettingsByCategory('notification');
  }

  async getSystemSettings(): Promise<any> {
    return this.getSettingsByCategory('system');
  }

  async getIntegrationSettings(): Promise<any> {
    return this.getSettingsByCategory('integration');
  }
}

export const settingsService = new SettingsService();
