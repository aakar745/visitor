import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { importApi } from '../services/importApi';
import { DuplicateStrategy } from '../types/import.types';

export const importQueryKeys = {
  progress: (importId: string) => ['import', 'progress', importId],
  myHistory: () => ['import', 'history', 'me'],
  allHistory: () => ['import', 'history', 'all'],
  stats: () => ['visitor-imports', 'stats'],
};

/**
 * Upload visitors mutation
 */
export const useUploadVisitors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      duplicateStrategy,
    }: {
      file: File;
      duplicateStrategy: DuplicateStrategy;
    }) => importApi.uploadVisitors(file, duplicateStrategy),
    onSuccess: () => {
      // ✅ Don't show success message here - the import is just STARTING, not complete!
      // The modal will show live progress and completion status
      queryClient.invalidateQueries({ queryKey: importQueryKeys.myHistory() });
      queryClient.invalidateQueries({ queryKey: importQueryKeys.allHistory() });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to upload file');
    },
  });
};

/**
 * Get import progress query
 */
export const useImportProgress = (importId: string | null, enabled = true) => {
  return useQuery({
    queryKey: importQueryKeys.progress(importId || ''),
    queryFn: async () => {
      console.log('[useImportProgress] Fetching progress for:', importId);
      const result = await importApi.getProgress(importId!);
      console.log('[useImportProgress] Progress response:', result);
      return result;
    },
    enabled: enabled && !!importId,
    // ✅ Fetch immediately when enabled (no stale time for progress)
    staleTime: 0,
    // ✅ Don't use cache for progress data
    gcTime: 0,
    // ✅ Refetch on mount to get latest progress
    refetchOnMount: 'always',
    // ✅ Refetch when window regains focus
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // Stop polling if import is completed or failed
      const data = query.state.data as any;
      const status = data?.data?.status || data?.status;
      console.log('[useImportProgress] Polling check - status:', status);
      if (
        status === 'completed' ||
        status === 'failed' ||
        status === 'partially_completed'
      ) {
        console.log('[useImportProgress] Stopping polling - import complete');
        return false;
      }
      // ✅ Poll every 1 second for more responsive UI
      return 1000;
    },
  });
};

/**
 * Get my import history query
 */
export const useMyImportHistory = (limit = 20) => {
  return useQuery({
    queryKey: [...importQueryKeys.myHistory(), limit],
    queryFn: () => importApi.getMyHistory(limit),
  });
};

/**
 * Get all import history query (super admin)
 */
export const useAllImportHistory = (limit = 50) => {
  return useQuery({
    queryKey: [...importQueryKeys.allHistory(), limit],
    queryFn: () => importApi.getAllHistory(limit),
  });
};

/**
 * Rollback import mutation
 */
export const useRollbackImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importId: string) => importApi.rollbackImport(importId),
    onSuccess: (data) => {
      message.success(data.message);
      queryClient.invalidateQueries({ queryKey: importQueryKeys.myHistory() });
      queryClient.invalidateQueries({ queryKey: importQueryKeys.allHistory() });
      queryClient.invalidateQueries({ queryKey: importQueryKeys.stats() });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'Failed to rollback import',
      );
    },
  });
};

/**
 * Download template mutation
 */
export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: () => importApi.downloadTemplate(),
    onSuccess: () => {
      message.success('Template downloaded successfully');
    },
    onError: () => {
      message.error('Failed to download template');
    },
  });
};

/**
 * Get global visitor stats query
 */
export const useGlobalVisitorStats = () => {
  return useQuery({
    queryKey: importQueryKeys.stats(),
    queryFn: () => importApi.getStats(),
  });
};

