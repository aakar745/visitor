import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exhibitorService } from '../services/exhibitorService';
import { queryKeys } from '../utils/reactQuery';
import { useMessage } from './useMessage';
import type {
  CreateExhibitorRequest,
  UpdateExhibitorRequest,
  PaginationParams
} from '../types';

// Get exhibitors by exhibition
export const useExhibitorsByExhibition = (exhibitionId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.exhibitors.byExhibition(exhibitionId),
    queryFn: () => exhibitorService.getExhibitorsByExhibition(exhibitionId, params),
    enabled: !!exhibitionId,
  });
};

// Get single exhibitor
export const useExhibitor = (id: string) => {
  return useQuery({
    queryKey: queryKeys.exhibitors.detail(id),
    queryFn: () => exhibitorService.getExhibitor(id),
    enabled: !!id,
  });
};

// Get exhibitor stats
export const useExhibitorStats = (exhibitorId: string) => {
  return useQuery({
    queryKey: queryKeys.exhibitors.stats(exhibitorId),
    queryFn: () => exhibitorService.getExhibitorStats(exhibitorId),
    enabled: !!exhibitorId,
  });
};

// Exhibitor mutations
export const useExhibitorMutations = () => {
  const queryClient = useQueryClient();
  const message = useMessage();

  // Create exhibitor
  const createExhibitor = useMutation({
    mutationFn: (data: CreateExhibitorRequest) => exhibitorService.createExhibitor(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.byExhibition(data.exhibitionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.lists() });
      message.success('Exhibitor created successfully');
    },
    onError: () => {
      message.error('Failed to create exhibitor');
    },
  });

  // Update exhibitor
  const updateExhibitor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExhibitorRequest }) =>
      exhibitorService.updateExhibitor(id, data),
    onSuccess: (updatedExhibitor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.byExhibition(updatedExhibitor.exhibitionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.detail(updatedExhibitor.id) });
      message.success('Exhibitor updated successfully');
    },
    onError: () => {
      message.error('Failed to update exhibitor');
    },
  });

  // Delete exhibitor
  const deleteExhibitor = useMutation({
    mutationFn: (id: string) => exhibitorService.deleteExhibitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.all });
      message.success('Exhibitor deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete exhibitor');
    },
  });

  // Toggle exhibitor status
  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      exhibitorService.toggleExhibitorStatus(id, isActive),
    onSuccess: (updatedExhibitor) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.byExhibition(updatedExhibitor.exhibitionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.detail(updatedExhibitor.id) });
      message.success(`Exhibitor ${updatedExhibitor.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: () => {
      message.error('Failed to update exhibitor status');
    },
  });

  // Upload logo
  const uploadLogo = useMutation({
    mutationFn: (file: File) => exhibitorService.uploadLogo(file),
    onSuccess: () => {
      message.success('Logo uploaded successfully');
    },
    onError: () => {
      message.error('Failed to upload logo');
    },
  });

  // Generate QR code
  const generateQRCode = useMutation({
    mutationFn: (exhibitorId: string) => exhibitorService.generateQRCode(exhibitorId),
    onSuccess: (blob, exhibitorId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exhibitor-${exhibitorId}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('QR code downloaded successfully');
    },
    onError: () => {
      message.error('Failed to generate QR code');
    },
  });

  // Bulk toggle status
  const bulkToggleStatus = useMutation({
    mutationFn: ({ exhibitorIds, isActive }: { exhibitorIds: string[]; isActive: boolean }) =>
      exhibitorService.bulkToggleStatus(exhibitorIds, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.all });
      message.success('Exhibitor statuses updated successfully');
    },
    onError: () => {
      message.error('Failed to update exhibitor statuses');
    },
  });

  // Bulk delete
  const bulkDelete = useMutation({
    mutationFn: (exhibitorIds: string[]) => exhibitorService.bulkDelete(exhibitorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exhibitors.all });
      message.success('Exhibitors deleted successfully');
    },
    onError: () => {
      message.error('Failed to delete exhibitors');
    },
  });

  // Export exhibitors
  const exportExhibitors = useMutation({
    mutationFn: ({ exhibitionId, format }: { exhibitionId: string; format: 'csv' | 'excel' }) =>
      exhibitorService.exportExhibitors(exhibitionId, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exhibitors-export.${variables.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Exhibitors exported successfully');
    },
    onError: () => {
      message.error('Failed to export exhibitors');
    },
  });

  return {
    // Mutations
    createExhibitor,
    updateExhibitor,
    deleteExhibitor,
    toggleStatus,
    uploadLogo,
    generateQRCode,
    bulkToggleStatus,
    bulkDelete,
    exportExhibitors,
    
    // Loading states
    isCreating: createExhibitor.isPending,
    isUpdating: updateExhibitor.isPending,
    isDeleting: deleteExhibitor.isPending,
    isTogglingStatus: toggleStatus.isPending,
    isUploadingLogo: uploadLogo.isPending,
    isGeneratingQR: generateQRCode.isPending,
    isBulkOperating: bulkToggleStatus.isPending || bulkDelete.isPending,
    isExporting: exportExhibitors.isPending,
  };
};

