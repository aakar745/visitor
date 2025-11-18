import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';
import type {
  UpdateSettingRequest,
  BulkUpdateSettingsRequest,
  SettingsFilters,
  SettingsExportRequest,
  SettingsImportRequest,
  RestoreSettingsRequest,
  SettingCategory as SettingCategoryType,
  PaginationParams
} from '../types';

// Query Keys
export const settingsQueryKeys = {
  all: ['settings'] as const,
  categories: () => [...settingsQueryKeys.all, 'categories'] as const,
  category: (category: SettingCategoryType) => [...settingsQueryKeys.categories(), category] as const,
  setting: (key: string) => [...settingsQueryKeys.all, 'setting', key] as const,
  search: (query: string, filters?: SettingsFilters) => [...settingsQueryKeys.all, 'search', query, filters] as const,
  dashboard: () => [...settingsQueryKeys.all, 'dashboard'] as const,
  backups: () => [...settingsQueryKeys.all, 'backups'] as const,
  history: (key?: string) => [...settingsQueryKeys.all, 'history', key] as const,
  health: () => [...settingsQueryKeys.all, 'health'] as const,
  migrations: () => [...settingsQueryKeys.all, 'migrations'] as const,
  cache: () => [...settingsQueryKeys.all, 'cache'] as const,
  maintenance: () => [...settingsQueryKeys.all, 'maintenance'] as const,
};

// Get all settings grouped by category
export const useSettings = () => {
  return useQuery({
    queryKey: settingsQueryKeys.categories(),
    queryFn: settingsService.getSettings,
  });
};

// Get settings by category
export const useSettingsByCategory = (category: SettingCategoryType) => {
  return useQuery({
    queryKey: settingsQueryKeys.category(category),
    queryFn: () => settingsService.getSettingsByCategory(category),
    enabled: !!category,
  });
};

// Get single setting
export const useSetting = (key: string) => {
  return useQuery({
    queryKey: settingsQueryKeys.setting(key),
    queryFn: () => settingsService.getSetting(key),
    enabled: !!key,
  });
};

// Search settings
export const useSettingsSearch = (query: string, filters?: SettingsFilters) => {
  return useQuery({
    queryKey: settingsQueryKeys.search(query, filters),
    queryFn: () => settingsService.searchSettings(query, filters),
    enabled: !!query && query.length >= 2,
  });
};

// Get settings dashboard data
export const useSettingsDashboard = () => {
  return useQuery({
    queryKey: settingsQueryKeys.dashboard(),
    queryFn: settingsService.getSettingsDashboard,
  });
};

// Get settings backups
export const useSettingsBackups = (params?: PaginationParams) => {
  return useQuery({
    queryKey: settingsQueryKeys.backups(),
    queryFn: () => settingsService.getBackups(params),
  });
};

// Get settings history
export const useSettingsHistory = (key?: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: settingsQueryKeys.history(key),
    queryFn: () => settingsService.getSettingHistory(key, params),
  });
};

// Get system health
export const useSystemHealth = () => {
  return useQuery({
    queryKey: settingsQueryKeys.health(),
    queryFn: settingsService.checkSystemHealth,
    refetchInterval: 30000,
  });
};

// Get migrations
export const useSettingsMigrations = () => {
  return useQuery({
    queryKey: settingsQueryKeys.migrations(),
    queryFn: settingsService.getMigrations,
  });
};

// Get cache stats
export const useCacheStats = () => {
  return useQuery({
    queryKey: settingsQueryKeys.cache(),
    queryFn: settingsService.getCacheStats,
    refetchInterval: 10000,
  });
};

// Get maintenance status
export const useMaintenanceStatus = () => {
  return useQuery({
    queryKey: settingsQueryKeys.maintenance(),
    queryFn: settingsService.getMaintenanceStatus,
    refetchInterval: 5000,
  });
};

// Settings mutations
export const useSettingsMutations = () => {
  const queryClient = useQueryClient();

  // Update single setting
  const updateSetting = useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateSettingRequest }) =>
      settingsService.updateSetting(key, data),
    onSuccess: (updatedSetting) => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.setting(updatedSetting?.key) });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Bulk update settings
  const bulkUpdateSettings = useMutation({
    mutationFn: (data: BulkUpdateSettingsRequest) => settingsService.bulkUpdateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Reset setting
  const resetSetting = useMutation({
    mutationFn: (key: string) => settingsService.resetSetting(key),
    onSuccess: (updatedSetting) => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.setting(updatedSetting?.key) });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Reset multiple settings
  const resetSettings = useMutation({
    mutationFn: (keys: string[]) => settingsService.resetSettings(keys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Create backup
  const createBackup = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      settingsService.createBackup(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.backups() });
    },
  });

  // Delete backup
  const deleteBackup = useMutation({
    mutationFn: (backupId: string) => settingsService.deleteBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.backups() });
    },
  });

  // Restore from backup
  const restoreFromBackup = useMutation({
    mutationFn: (data: RestoreSettingsRequest) => settingsService.restoreFromBackup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Export settings
  const exportSettings = useMutation({
    mutationFn: (data: SettingsExportRequest) => settingsService.exportSettings(data),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export.${variables?.format || 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  // Import settings
  const importSettings = useMutation({
    mutationFn: (data: SettingsImportRequest) => settingsService.importSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.dashboard() });
    },
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'logo' | 'favicon' | 'image' }) =>
      settingsService.uploadFile(file, type),
  });

  // Test integration
  const testIntegration = useMutation({
    mutationFn: ({ type, settings }: { type: string; settings: { [key: string]: any } }) =>
      settingsService.testIntegration(type, settings),
  });

  // Apply migration
  const applyMigration = useMutation({
    mutationFn: (migrationId: string) => settingsService.applyMigration(migrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.migrations() });
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.categories() });
    },
  });

  // Clear cache
  const clearCache = useMutation({
    mutationFn: (cacheKeys?: string[]) => settingsService.clearCache(cacheKeys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.cache() });
    },
  });

  // Enable maintenance mode
  const enableMaintenanceMode = useMutation({
    mutationFn: ({ message, duration }: { message?: string; duration?: number }) =>
      settingsService.enableMaintenanceMode(message, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.maintenance() });
    },
  });

  // Disable maintenance mode
  const disableMaintenanceMode = useMutation({
    mutationFn: () => settingsService.disableMaintenanceMode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.maintenance() });
    },
  });

  return {
    // Mutations
    updateSetting,
    bulkUpdateSettings,
    resetSetting,
    resetSettings,
    createBackup,
    deleteBackup,
    restoreFromBackup,
    exportSettings,
    importSettings,
    uploadFile,
    testIntegration,
    applyMigration,
    clearCache,
    enableMaintenanceMode,
    disableMaintenanceMode,
    
    // Loading states
    isUpdating: updateSetting.isPending,
    isBulkUpdating: bulkUpdateSettings.isPending,
    isResetting: resetSetting.isPending || resetSettings.isPending,
    isCreatingBackup: createBackup.isPending,
    isDeletingBackup: deleteBackup.isPending,
    isRestoring: restoreFromBackup.isPending,
    isExporting: exportSettings.isPending,
    isImporting: importSettings.isPending,
    isUploading: uploadFile.isPending,
    isTesting: testIntegration.isPending,
    isApplyingMigration: applyMigration.isPending,
    isClearingCache: clearCache.isPending,
    isTogglingMaintenance: enableMaintenanceMode.isPending || disableMaintenanceMode.isPending,
  };
};

// Specific category hooks for convenience
export const useGeneralSettings = () => useSettingsByCategory('general');
export const useSecuritySettings = () => useSettingsByCategory('security');
export const useVisitorSettings = () => useSettingsByCategory('visitor');
export const useExhibitionSettings = () => useSettingsByCategory('exhibition');
export const useNotificationSettings = () => useSettingsByCategory('notification');
export const useSystemSettings = () => useSettingsByCategory('system');
export const useIntegrationSettings = () => useSettingsByCategory('integration');
