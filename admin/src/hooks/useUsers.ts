import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserFilters,
  BulkUserOperation,
  PaginationParams
} from '../types';

// Query Keys
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: PaginationParams & UserFilters) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
  stats: () => [...userQueryKeys.all, 'stats'] as const,
  permissions: () => [...userQueryKeys.all, 'permissions'] as const,
  activity: (userId: string) => [...userQueryKeys.all, 'activity', userId] as const,
};

// Get users with pagination and filtering
export const useUsers = (params: PaginationParams & UserFilters) => {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => userService.getUsers(params),
    placeholderData: (previousData) => previousData,
  });
};

// Get single user
export const useUser = (id: string) => {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  });
};

// Get user statistics
export const useUserStats = () => {
  return useQuery({
    queryKey: userQueryKeys.stats(),
    queryFn: userService.getUserStats,
  });
};

// Get permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: userQueryKeys.permissions(),
    queryFn: userService.getPermissions,
  });
};

// Get user activity
export const useUserActivity = (userId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: userQueryKeys.activity(userId),
    queryFn: () => userService.getUserActivity(userId, params),
    enabled: !!userId,
  });
};

// User mutations
export const useUserMutations = () => {
  const queryClient = useQueryClient();

  // Create user
  const createUser = useMutation({
    mutationFn: (userData: CreateUserRequest) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  // Update user
  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userService.updateUser(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(updatedUser.id) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: userQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  // Change password
  const changePassword = useMutation({
    mutationFn: ({ id, passwordData }: { id: string; passwordData: ChangePasswordRequest }) =>
      userService.changeUserPassword(id, passwordData),
  });

  // Reset password
  const resetPassword = useMutation({
    mutationFn: ({ id, passwordData }: { id: string; passwordData: { newPassword: string; confirmPassword: string } }) =>
      userService.resetUserPassword(id, passwordData),
  });

  // Toggle user status
  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      userService.toggleUserStatus(id, status),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(updatedUser.id) });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  // Update permissions
  const updatePermissions = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      userService.updateUserPermissions(id, permissions),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(updatedUser.id) });
    },
  });

  // Bulk operations
  const bulkOperation = useMutation({
    mutationFn: (operation: BulkUserOperation) => userService.bulkOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  // Send invitation
  const sendInvitation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      userService.sendInvitation(email, role),
  });

  // Resend invitation
  const resendInvitation = useMutation({
    mutationFn: (userId: string) => userService.resendInvitation(userId),
  });

  // Export users
  const exportUsers = useMutation({
    mutationFn: ({ filters, format }: { filters?: any; format?: 'csv' | 'excel' }) =>
      userService.exportUsers(filters, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export.${variables.format || 'excel'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  // Import users
  const importUsers = useMutation({
    mutationFn: (file: File) => userService.importUsers(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });
    },
  });

  return {
    // Mutations
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    resetPassword,
    toggleStatus,
    updatePermissions,
    bulkOperation,
    sendInvitation,
    resendInvitation,
    exportUsers,
    importUsers,
    
    // Loading states
    isCreating: createUser.isPending,
    isUpdating: updateUser.isPending,
    isDeleting: deleteUser.isPending,
    isChangingPassword: changePassword.isPending,
    isResettingPassword: resetPassword.isPending,
    isTogglingStatus: toggleStatus.isPending,
    isUpdatingPermissions: updatePermissions.isPending,
    isBulkOperating: bulkOperation.isPending,
    isSendingInvitation: sendInvitation.isPending,
    isResendingInvitation: resendInvitation.isPending,
    isExporting: exportUsers.isPending,
    isImporting: importUsers.isPending,
  };
};
