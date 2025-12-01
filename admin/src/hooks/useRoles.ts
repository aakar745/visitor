import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/roleService';

// Hook for Users page - simple list of all roles (no params)
// Hook for Roles page - paginated list with filters (with params)
export const useRoles = (params?: any) => {
  // If params provided, use paginated endpoint (Roles page)
  // If no params, use simple list endpoint (Users page)
  if (params) {
    return useQuery({
      queryKey: ['roles', 'paginated', params],
      queryFn: () => roleService.getPaginatedRoles(params),
    });
  }
  
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: () => roleService.getRoles(),
    staleTime: 5 * 60 * 1000, // Roles don't change often, cache for 5 minutes
  });
};

export const usePermissionGroups = () => {
  return useQuery({
    queryKey: ['permissionGroups'],
    queryFn: () => roleService.getPermissionGroups(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRoleStats = () => {
  return useQuery({
    queryKey: ['roleStats'],
    queryFn: () => roleService.getRoleStats(),
  });
};

export const useRoleTemplates = () => {
  return useQuery({
    queryKey: ['roleTemplates'],
    queryFn: () => roleService.getRoleTemplates(),
    staleTime: 10 * 60 * 1000, // Templates are static, cache for 10 minutes
  });
};

export const useRoleMutations = () => {
  const queryClient = useQueryClient();

  const createRole = useMutation({
    mutationFn: roleService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      roleService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const deleteRole = useMutation({
    mutationFn: roleService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    },
  });

  const toggleRoleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      roleService.updateRole(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roleStats'] });
    },
  });

  // Placeholder functions for duplicate, export, and createFromTemplate
  // These can be implemented later when backend endpoints are ready
  const duplicateRole = async (roleId: string) => {
    console.log('Duplicate role:', roleId);
    // TODO: Implement duplicate role functionality
  };

  const createFromTemplate = async (templateId: string) => {
    console.log('Create from template:', templateId);
    // TODO: Implement create from template functionality
  };

  const exportRoles = async (format: 'csv' | 'excel' | 'json') => {
    console.log('Export roles:', format);
    // TODO: Implement export functionality
  };

  return {
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    duplicateRole,
    createFromTemplate,
    exportRoles,
    isCreating: createRole.isPending,
    isUpdating: updateRole.isPending,
    isDeleting: deleteRole.isPending,
    isExporting: false, // TODO: Implement loading state when export is implemented
  };
};
