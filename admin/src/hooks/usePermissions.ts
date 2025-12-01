import { useAppSelector } from '../store';
import { useMemo } from 'react';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  action?: string;
  resource?: string;
  category?: string;
}

/**
 * Hook to check user permissions
 * @returns Permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  const permissions = useMemo(() => {
    if (!user || !user.role) return [];

    // Handle role as object (populated)
    if (typeof user.role === 'object' && 'permissions' in user.role) {
      return user.role.permissions || [];
    }

    return [];
  }, [user]);

  /**
   * Check if user is Super Admin
   */
  const isSuperAdmin = useMemo(() => {
    if (!user || !user.role) return false;

    const roleName =
      typeof user.role === 'string'
        ? user.role
        : user.role.name;

    return roleName === 'super_admin';
  }, [user]);

  /**
   * Check if user has a specific permission
   * @param permissionId - Permission ID to check (e.g., 'users.view')
   */
  const hasPermission = (permissionId: string): boolean => {
    // Super Admin has all permissions
    if (isSuperAdmin) return true;

    if (!permissions || permissions.length === 0) return false;

    return permissions.some((p: any) => {
      if (typeof p === 'string') return p === permissionId;
      return p.id === permissionId;
    });
  };

  /**
   * Check if user has ANY of the specified permissions
   * @param permissionIds - Array of permission IDs
   */
  const hasAnyPermission = (permissionIds: string[]): boolean => {
    // Super Admin has all permissions
    if (isSuperAdmin) return true;

    if (!permissionIds || permissionIds.length === 0) return true;
    if (!permissions || permissions.length === 0) return false;

    return permissionIds.some((id) => hasPermission(id));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param permissionIds - Array of permission IDs
   */
  const hasAllPermissions = (permissionIds: string[]): boolean => {
    // Super Admin has all permissions
    if (isSuperAdmin) return true;

    if (!permissionIds || permissionIds.length === 0) return true;
    if (!permissions || permissions.length === 0) return false;

    return permissionIds.every((id) => hasPermission(id));
  };

  /**
   * Get all permission IDs that the user has
   */
  const getPermissionIds = (): string[] => {
    return permissions.map((p: any) => (typeof p === 'string' ? p : p.id));
  };

  return {
    permissions,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionIds,
  };
};

