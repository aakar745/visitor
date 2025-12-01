import type { RoleObject } from '../types/users';

type RoleType = string | RoleObject;

/**
 * Get role name from role object or string
 */
export const getRoleName = (role: RoleType | undefined | null): string => {
  if (!role) return 'User';
  if (typeof role === 'string') return role;
  return role.name || 'User';
};

/**
 * Get role display with icon
 */
export const getRoleDisplay = (role: RoleType | undefined | null): string => {
  if (!role) return 'User';
  if (typeof role === 'string') return role;
  
  const icon = (role as any).icon || '';
  const name = role.name || 'User';
  
  return icon ? `${icon} ${name}` : name;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (
  role: RoleType | undefined | null,
  permissionId: string
): boolean => {
  if (!role || typeof role === 'string') return false;
  const permissions = (role as any).permissions;
  if (!permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(p => p.id === permissionId);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  role: RoleType | undefined | null,
  permissionIds: string[]
): boolean => {
  if (!role || typeof role === 'string') return false;
  const permissions = (role as any).permissions;
  if (!permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(p => permissionIds.includes(p.id));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  role: RoleType | undefined | null,
  permissionIds: string[]
): boolean => {
  if (!role || typeof role === 'string') return false;
  const permissions = (role as any).permissions;
  if (!permissions || !Array.isArray(permissions)) return false;
  
  return permissionIds.every(id => 
    permissions.some(p => p.id === id)
  );
};

