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

// Extended User Interface
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  position?: string;
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
  phone?: string;
  department?: string;
  position?: string;
  permissions?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  position?: string;
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
