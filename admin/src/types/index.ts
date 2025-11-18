// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string | { name: string; _id?: string; [key: string]: any };  // Can be string or role object
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Legacy Visitor Types (kept for backwards compatibility)
export interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  purpose: string;
  hostName: string;
  hostDepartment: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out' | 'scheduled';
  visitDate: string;
  createdAt: string;
  updatedAt: string;
}

// Export new visitor types
export * from './visitors';
export * from './users';
// Re-export roles types explicitly to avoid Permission conflict
export type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleFilters,
  RoleStats,
  RoleListResponse,
  PermissionGroup,
  RoleTemplate,
  RoleAuditLog,
  BulkRoleOperation,
  BulkRoleOperationResult,
  RoleComparison,
  RoleAssignment,
  RoleHierarchy,
  PermissionCategory,
  PermissionAction
} from './roles';
export type { Permission as RolePermission } from './roles';
export * from './settings';
export * from './exhibitors';

// Common UI Types
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  fixed?: 'left' | 'right';
  sorter?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}
