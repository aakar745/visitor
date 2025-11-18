import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exhibitionService } from '../services/exhibitions/exhibitionService';
import { queryKeys } from '../utils/reactQuery';
import { useMessage } from './useMessage';
import type { PaginationParams } from '../types';
import type {
  ExhibitionRequest,
  ExhibitionFilters,
  ExhibitionStatus
} from '../types/exhibitions';

// Get all exhibitions with pagination and filtering
export const useExhibitions = (params: PaginationParams & { filters?: ExhibitionFilters }) => {
  return useQuery({
    queryKey: queryKeys.exhibitions.list(params),
    queryFn: () => exhibitionService.getExhibitions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single exhibition by ID
export const useExhibition = (id: string) => {
  return useQuery({
    queryKey: queryKeys.exhibitions.detail(id),
    queryFn: () => exhibitionService.getExhibition(id),
    enabled: !!id,
  });
};

// Get exhibition analytics
export const useExhibitionAnalytics = (exhibitionId: string) => {
  return useQuery({
    queryKey: queryKeys.exhibitions.analytics(exhibitionId),
    queryFn: () => exhibitionService.getExhibitionAnalytics(exhibitionId),
    enabled: !!exhibitionId,
  });
};

// Exhibition mutations
export const useExhibitionMutations = () => {
  const queryClient = useQueryClient();
  const message = useMessage();

  // Create exhibition
  const createExhibition = useMutation({
    mutationFn: (data: ExhibitionRequest) => exhibitionService.createExhibition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.lists() });
      message.success('Exhibition created successfully');
    },
    onError: () => {
      message.error('Failed to create exhibition');
    },
  });

  // Update exhibition
  const updateExhibition = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExhibitionRequest> }) =>
      exhibitionService.updateExhibition(id, data),
    onSuccess: (updatedExhibition) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.detail(updatedExhibition.id) });
      message.success('Exhibition updated successfully');
    },
    onError: () => {
      message.error('Failed to update exhibition');
    },
  });

  // Delete exhibition
  const deleteExhibition = useMutation({
    mutationFn: (id: string) => exhibitionService.deleteExhibition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.all });
      message.success('Exhibition deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete exhibition');
    },
  });

  // Update exhibition status
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExhibitionStatus }) =>
      exhibitionService.updateExhibitionStatus(id, status),
    onSuccess: (updatedExhibition) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.detail(updatedExhibition.id) });
      message.success('Exhibition status updated successfully');
    },
    onError: () => {
      message.error('Failed to update exhibition status');
    },
  });

  // Duplicate exhibition
  const duplicateExhibition = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      exhibitionService.duplicateExhibition(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitions.lists() });
      message.success('Exhibition duplicated successfully');
    },
    onError: () => {
      message.error('Failed to duplicate exhibition');
    },
  });

  // Upload file
  const uploadFile = useMutation({
    mutationFn: ({ file, type }: { file: File; type: 'banner' | 'logo' | 'badge-logo' }) =>
      exhibitionService.uploadFile(file, type),
    onSuccess: () => {
      message.success('File uploaded successfully');
    },
    onError: () => {
      message.error('Failed to upload file');
    },
  });

  return {
    // Mutations
    createExhibition,
    updateExhibition,
    deleteExhibition,
    updateStatus,
    duplicateExhibition,
    uploadFile,

    // Loading states
    isCreating: createExhibition.isPending,
    isUpdating: updateExhibition.isPending,
    isDeleting: deleteExhibition.isPending,
    isUpdatingStatus: updateStatus.isPending,
    isDuplicating: duplicateExhibition.isPending,
    isUploading: uploadFile.isPending,
  };
};

