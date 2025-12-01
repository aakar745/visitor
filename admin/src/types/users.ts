// User Management Types

// User Roles Enum
export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  VIEWER: 'viewer',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// User Status
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// Role Object (when populated from backend)
export interface RoleObject {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  permissions?: Array<{
    id: string;
    name: string;
    description?: string;
    action?: string;
    resource?: string;
    category?: string;
  }>;
  color?: string;
  icon?: string;
  isSystemRole?: boolean;
  isActive?: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Extended User Interface
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole | RoleObject;  // Can be string or populated object
  status: UserStatus;
  lastLoginAt?: string;
  emailVerifiedAt?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// User Creation/Update Requests
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  permissions?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User Statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  recentLogins: number;
  roleDistribution: Record<UserRole, number>;
  departmentDistribution: Record<string, number>;
}

// User Activity Log
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// User Filter Options
export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
}

// User List Response
export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Permission-related types
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Bulk operations
export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_role';
  newRole?: UserRole;
}

export interface BulkOperationResult {
  success: boolean;
  affected: number;
  failed: string[];
  message: string;
}
