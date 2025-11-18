// Role Management Types

// Permission Categories
export const PermissionCategory = {
  USER_MANAGEMENT: 'user_management',
  VISITOR_MANAGEMENT: 'visitor_management',
  EXHIBITION_MANAGEMENT: 'exhibition_management',
  REPORTING: 'reporting',
  SYSTEM_SETTINGS: 'system_settings',
  SECURITY: 'security',
} as const;

export type PermissionCategory = typeof PermissionCategory[keyof typeof PermissionCategory];

// Permission Actions
export const PermissionAction = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  ASSIGN: 'assign',
} as const;

export type PermissionAction = typeof PermissionAction[keyof typeof PermissionAction];

// Individual Permission
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  action: PermissionAction;
  resource: string;
  isSystemPermission: boolean;
  createdAt: string;
  updatedAt: string;
}

// Role Interface
export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isSystemRole: boolean;
  isActive: boolean;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Role Creation/Update Requests
export interface CreateRoleRequest {
  name: string;
  description: string;
  color?: string;
  icon?: string;
  permissions: string[]; // Permission IDs
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  permissions?: string[]; // Permission IDs
  isActive?: boolean;
}

// Role Assignment
export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// Role Statistics
export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
  mostUsedRole: {
    name: string;
    userCount: number;
  };
  roleDistribution: {
    roleName: string;
    userCount: number;
    percentage: number;
  }[];
}

// Role Filters
export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  isSystemRole?: boolean;
  category?: PermissionCategory;
  hasPermission?: string;
}

// Role List Response
export interface RoleListResponse {
  roles: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Permission Group (for UI organization)
export interface PermissionGroup {
  category: PermissionCategory;
  name: string;
  description: string;
  permissions: Permission[];
}

// Role Template (predefined role configurations)
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  permissions: string[];
  isRecommended: boolean;
}

// Role Audit Log
export interface RoleAuditLog {
  id: string;
  roleId: string;
  roleName: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'unassigned';
  details: string;
  performedBy: string;
  performedAt: string;
  affectedUser?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// Bulk Role Operations
export interface BulkRoleOperation {
  roleIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'assign_users' | 'remove_permissions';
  userIds?: string[]; // For assign_users operation
  permissionIds?: string[]; // For remove_permissions operation
}

export interface BulkRoleOperationResult {
  success: boolean;
  affected: number;
  failed: string[];
  message: string;
  details: {
    roleId: string;
    success: boolean;
    error?: string;
  }[];
}

// Role Comparison
export interface RoleComparison {
  roles: Role[];
  commonPermissions: Permission[];
  uniquePermissions: {
    roleId: string;
    roleName: string;
    permissions: Permission[];
  }[];
  permissionMatrix: {
    permission: Permission;
    roles: {
      roleId: string;
      roleName: string;
      hasPermission: boolean;
    }[];
  }[];
}

// Role Hierarchy (for future implementation)
export interface RoleHierarchy {
  roleId: string;
  roleName: string;
  level: number;
  parentRoles: string[];
  childRoles: string[];
  inheritedPermissions: string[];
  directPermissions: string[];
}
