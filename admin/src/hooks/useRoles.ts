import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilters,
  BulkRoleOperation,
  PaginationParams
} from '../types';

// Query Keys
export const roleQueryKeys = {
  all: ['roles'] as const,
  lists: () => [...roleQueryKeys.all, 'list'] as const,
  list: (params: PaginationParams & RoleFilters) => [...roleQueryKeys.lists(), params] as const,
  details: () => [...roleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleQueryKeys.details(), id] as const,
  stats: () => [...roleQueryKeys.all, 'stats'] as const,
  permissions: () => [...roleQueryKeys.all, 'permissions'] as const,
  permissionGroups: () => [...roleQueryKeys.permissions(), 'groups'] as const,
  templates: () => [...roleQueryKeys.all, 'templates'] as const,
  auditLog: (roleId: string) => [...roleQueryKeys.all, 'audit', roleId] as const,
  assignments: () => [...roleQueryKeys.all, 'assignments'] as const,
  userRoles: (userId: string) => [...roleQueryKeys.assignments(), 'user', userId] as const,
  roleUsers: (roleId: string) => [...roleQueryKeys.assignments(), 'role', roleId] as const,
};

// Get roles with pagination and filtering
export const useRoles = (params: PaginationParams & RoleFilters) => {
  return useQuery({
    queryKey: roleQueryKeys.list(params),
    queryFn: () => roleService.getRoles(params),
    placeholderData: (previousData) => previousData,
  });
};

// Get single role
export const useRole = (id: string) => {
  return useQuery({
    queryKey: roleQueryKeys.detail(id),
    queryFn: () => roleService.getRole(id),
    enabled: !!id,
  });
};

// Get role statistics
export const useRoleStats = () => {
  return useQuery({
    queryKey: roleQueryKeys.stats(),
    queryFn: roleService.getRoleStats,
  });
};

// Get all permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: roleQueryKeys.permissions(),
    queryFn: roleService.getPermissions,
  });
};

// Get permission groups
export const usePermissionGroups = () => {
  return useQuery({
    queryKey: roleQueryKeys.permissionGroups(),
    queryFn: roleService.getPermissionGroups,
  });
};

// Get role templates
export const useRoleTemplates = () => {
  return useQuery({
    queryKey: roleQueryKeys.templates(),
    queryFn: roleService.getRoleTemplates,
  });
};

// Get role audit log
export const useRoleAuditLog = (roleId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: roleQueryKeys.auditLog(roleId),
    queryFn: () => roleService.getRoleAuditLog(roleId, params),
    enabled: !!roleId,
  });
};

// Get user roles
export const useUserRoles = (userId: string) => {
  return useQuery({
    queryKey: roleQueryKeys.userRoles(userId),
    queryFn: () => roleService.getUserRoles(userId),
    enabled: !!userId,
  });
};

// Get role users
export const useRoleUsers = (roleId: string, params?: PaginationParams) => {
  return useQuery({
    queryKey: roleQueryKeys.roleUsers(roleId),
    queryFn: () => roleService.getRoleUsers(roleId, params),
    enabled: !!roleId,
  });
};

// Role mutations
export const useRoleMutations = () => {
  const queryClient = useQueryClient();

  // Create role
  const createRole = useMutation({
    mutationFn: (roleData: CreateRoleRequest) => roleService.createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Update role
  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      roleService.updateRole(id, data),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(updatedRole.id) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Delete role
  const deleteRole = useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: roleQueryKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Toggle role status
  const toggleRoleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      roleService.toggleRoleStatus(id, isActive),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(updatedRole.id) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Assign role
  const assignRole = useMutation({
    mutationFn: ({ userId, roleId, expiresAt }: { userId: string; roleId: string; expiresAt?: string }) =>
      roleService.assignRole(userId, roleId, expiresAt),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles(variables.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleUsers(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
    },
  });

  // Remove role
  const removeRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      roleService.removeRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.userRoles(variables.userId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roleUsers(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
    },
  });

  // Create from template
  const createFromTemplate = useMutation({
    mutationFn: ({ templateId, roleData }: { templateId: string; roleData: Partial<CreateRoleRequest> }) =>
      roleService.createFromTemplate(templateId, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Duplicate role
  const duplicateRole = useMutation({
    mutationFn: ({ roleId, newName }: { roleId: string; newName: string }) =>
      roleService.duplicateRole(roleId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Bulk operations
  const bulkOperation = useMutation({
    mutationFn: (operation: BulkRoleOperation) => roleService.bulkOperation(operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Export roles
  const exportRoles = useMutation({
    mutationFn: ({ filters, format }: { filters?: any; format?: 'csv' | 'excel' }) =>
      roleService.exportRoles(filters, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roles-export.${variables.format || 'excel'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

  // Import roles
  const importRoles = useMutation({
    mutationFn: (file: File) => roleService.importRoles(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.stats() });
    },
  });

  // Compare roles
  const compareRoles = useMutation({
    mutationFn: (roleIds: string[]) => roleService.compareRoles(roleIds),
  });

  return {
    // Mutations
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    assignRole,
    removeRole,
    createFromTemplate,
    duplicateRole,
    bulkOperation,
    exportRoles,
    importRoles,
    compareRoles,
    
    // Loading states
    isCreating: createRole.isPending,
    isUpdating: updateRole.isPending,
    isDeleting: deleteRole.isPending,
    isTogglingStatus: toggleRoleStatus.isPending,
    isAssigning: assignRole.isPending,
    isRemoving: removeRole.isPending,
    isCreatingFromTemplate: createFromTemplate.isPending,
    isDuplicating: duplicateRole.isPending,
    isBulkOperating: bulkOperation.isPending,
    isExporting: exportRoles.isPending,
    isImporting: importRoles.isPending,
    isComparing: compareRoles.isPending,
  };
};
