import { Role } from '../schemas/role.schema';

export const defaultRoles: Partial<Role>[] = [
  {
    name: 'super_admin',
    description: 'Super Administrator with full system access',
    color: '#ef4444',
    icon: '👑',
    isSystemRole: true,
    isActive: true,
    permissions: [
      // All permissions
      { id: 'users.view', name: 'View Users', description: 'View user list and details', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'users.create', name: 'Create Users', description: 'Create new users', action: 'create', resource: 'users', category: 'User Management' },
      { id: 'users.update', name: 'Update Users', description: 'Edit user information', action: 'update', resource: 'users', category: 'User Management' },
      { id: 'users.delete', name: 'Delete Users', description: 'Remove users from system', action: 'delete', resource: 'users', category: 'User Management' },
      
      { id: 'roles.view', name: 'View Roles', description: 'View roles and permissions', action: 'view', resource: 'roles', category: 'Role Management' },
      { id: 'roles.create', name: 'Create Roles', description: 'Create new roles', action: 'create', resource: 'roles', category: 'Role Management' },
      { id: 'roles.update', name: 'Update Roles', description: 'Edit role permissions', action: 'update', resource: 'roles', category: 'Role Management' },
      { id: 'roles.delete', name: 'Delete Roles', description: 'Remove roles', action: 'delete', resource: 'roles', category: 'Role Management' },
      
      { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibition list', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', description: 'Create new exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Update Exhibitions', description: 'Edit exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.delete', name: 'Delete Exhibitions', description: 'Remove exhibitions', action: 'delete', resource: 'exhibitions', category: 'Exhibition Management' },
      
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitor list', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', description: 'Register new visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Update Visitors', description: 'Edit visitor information', action: 'update', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.delete', name: 'Delete Visitors', description: 'Remove visitors', action: 'delete', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkin', name: 'Check-in Visitors', description: 'Check-in visitors', action: 'checkin', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkout', name: 'Check-out Visitors', description: 'Check-out visitors', action: 'checkout', resource: 'visitors', category: 'Visitor Management' },
      
      { id: 'settings.view', name: 'View Settings', description: 'View system settings', action: 'view', resource: 'settings', category: 'System Settings' },
      { id: 'settings.update', name: 'Update Settings', description: 'Modify system settings', action: 'update', resource: 'settings', category: 'System Settings' },
      
      { id: 'analytics.view', name: 'View Analytics', description: 'View reports and analytics', action: 'view', resource: 'analytics', category: 'Analytics' },
    ],
  },
  {
    name: 'admin',
    description: 'Administrator with most system access',
    color: '#3b82f6',
    icon: '🛡️',
    isSystemRole: true,
    isActive: true,
    permissions: [
      { id: 'users.view', name: 'View Users', description: 'View user list', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'users.create', name: 'Create Users', description: 'Create new users', action: 'create', resource: 'users', category: 'User Management' },
      { id: 'users.update', name: 'Update Users', description: 'Edit users', action: 'update', resource: 'users', category: 'User Management' },
      
      { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', description: 'Create exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Update Exhibitions', description: 'Edit exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.delete', name: 'Delete Exhibitions', description: 'Remove exhibitions', action: 'delete', resource: 'exhibitions', category: 'Exhibition Management' },
      
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', description: 'Register visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Update Visitors', description: 'Edit visitors', action: 'update', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkin', name: 'Check-in Visitors', description: 'Check-in visitors', action: 'checkin', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkout', name: 'Check-out Visitors', description: 'Check-out visitors', action: 'checkout', resource: 'visitors', category: 'Visitor Management' },
      
      { id: 'analytics.view', name: 'View Analytics', description: 'View analytics', action: 'view', resource: 'analytics', category: 'Analytics' },
    ],
  },
  {
    name: 'manager',
    description: 'Manager with limited administrative access',
    color: '#8b5cf6',
    icon: '📊',
    isSystemRole: false,
    isActive: true,
    permissions: [
      { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', description: 'Register visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Update Visitors', description: 'Edit visitors', action: 'update', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkin', name: 'Check-in Visitors', description: 'Check-in visitors', action: 'checkin', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkout', name: 'Check-out Visitors', description: 'Check-out visitors', action: 'checkout', resource: 'visitors', category: 'Visitor Management' },
      { id: 'analytics.view', name: 'View Analytics', description: 'View analytics', action: 'view', resource: 'analytics', category: 'Analytics' },
    ],
  },
  {
    name: 'employee',
    description: 'Standard employee with basic access',
    color: '#10b981',
    icon: '👤',
    isSystemRole: false,
    isActive: true,
    permissions: [
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', description: 'Register visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkin', name: 'Check-in Visitors', description: 'Check-in visitors', action: 'checkin', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.checkout', name: 'Check-out Visitors', description: 'Check-out visitors', action: 'checkout', resource: 'visitors', category: 'Visitor Management' },
    ],
  },
  {
    name: 'viewer',
    description: 'Read-only access to the system',
    color: '#6b7280',
    icon: '👁️',
    isSystemRole: false,
    isActive: true,
    permissions: [
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
    ],
  },
];

