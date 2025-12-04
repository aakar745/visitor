import { Role } from '../schemas/role.schema';

// Only Super Admin role is predefined with all system permissions
// All other roles should be created custom with specific permissions
export const defaultRoles: Partial<Role>[] = [
  {
    name: 'super_admin',
    description: 'Super Administrator with full system access',
    color: '#ef4444',
    icon: '👑',
    isSystemRole: true,
    isActive: true,
    permissions: [
      // Dashboard
      { id: 'dashboard.view', name: 'View Dashboard', description: 'Access main dashboard', action: 'view', resource: 'dashboard', category: 'Dashboard' },
      
      // Exhibition Management
      { id: 'exhibitions.view', name: 'View Exhibitions', description: 'View exhibition list', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', description: 'Create new exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Edit Exhibitions', description: 'Edit exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.delete', name: 'Delete Exhibitions', description: 'Remove exhibitions', action: 'delete', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.duplicate', name: 'Duplicate Exhibitions', description: 'Duplicate exhibitions', action: 'duplicate', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.publish', name: 'Publish/Unpublish', description: 'Change exhibition status', action: 'publish', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.qrcode', name: 'Generate QR Codes', description: 'Generate QR codes', action: 'qrcode', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.copylink', name: 'Copy Registration Links', description: 'Copy registration URLs', action: 'copylink', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.export', name: 'Export Exhibitions', description: 'Export data', action: 'export', resource: 'exhibitions', category: 'Exhibition Management' },
      
      // Exhibitor Management
      { id: 'exhibitors.view', name: 'View Exhibitors', description: 'View exhibitor links', action: 'view', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.create', name: 'Create Exhibitors', description: 'Create exhibitor links', action: 'create', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.update', name: 'Edit Exhibitors', description: 'Edit exhibitors', action: 'update', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.delete', name: 'Delete Exhibitors', description: 'Remove exhibitors', action: 'delete', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.qrcode', name: 'Generate QR Codes', description: 'Generate exhibitor QR codes', action: 'qrcode', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.toggle', name: 'Enable/Disable Links', description: 'Toggle status', action: 'toggle', resource: 'exhibitors', category: 'Exhibitor Management' },
      
      // Visitor Management
      { id: 'visitors.view', name: 'View Visitors', description: 'View visitor list', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.delete', name: 'Delete Visitors', description: 'Remove visitors', action: 'delete', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.import', name: 'Import Visitors', description: 'Bulk import visitors', action: 'import', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.export', name: 'Export Visitors', description: 'Export visitor data', action: 'export', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.search', name: 'Advanced Search', description: 'Use advanced search', action: 'search', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.bulk', name: 'Bulk Operations', description: 'Perform bulk actions', action: 'bulk', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.delete_all', name: 'Delete All Visitors', description: '⚠️ DANGER: Delete ALL visitors and registrations', action: 'delete_all', resource: 'visitors', category: 'Visitor Management' },
      
      // Analytics
      { id: 'analytics.view', name: 'View Analytics Dashboard', description: 'Access analytics dashboard with charts', action: 'view', resource: 'analytics', category: 'Analytics' },
      { id: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', action: 'export', resource: 'analytics', category: 'Analytics' },
      
      // Exhibition Reports
      { id: 'reports.view', name: 'View Exhibition Reports', description: 'Access exhibition registration reports', action: 'view', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.filter', name: 'Filter Reports', description: 'Use advanced filters', action: 'filter', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.search', name: 'Search Registrations', description: 'Search visitors in reports', action: 'search', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.export', name: 'Export Reports', description: 'Export registration data (Excel/CSV)', action: 'export', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.delete', name: 'Delete Registrations', description: 'Remove visitor registrations', action: 'delete', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.details', name: 'View Registration Details', description: 'View detailed visitor information', action: 'details', resource: 'reports', category: 'Exhibition Reports' },
      
      // User Management
      { id: 'users.view', name: 'View Users', description: 'View system users', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'users.create', name: 'Create Users', description: 'Add new users', action: 'create', resource: 'users', category: 'User Management' },
      { id: 'users.update', name: 'Edit Users', description: 'Edit user information', action: 'update', resource: 'users', category: 'User Management' },
      { id: 'users.reset_password', name: 'Reset User Password', description: 'Reset password for any user', action: 'reset_password', resource: 'users', category: 'User Management' },
      { id: 'users.delete', name: 'Delete Users', description: 'Remove users', action: 'delete', resource: 'users', category: 'User Management' },
      { id: 'users.export', name: 'Export Users', description: 'Export user data', action: 'export', resource: 'users', category: 'User Management' },
      
      // Role Management
      { id: 'roles.view', name: 'View Roles', description: 'View roles', action: 'view', resource: 'roles', category: 'Role Management' },
      { id: 'roles.create', name: 'Create Roles', description: 'Create custom roles', action: 'create', resource: 'roles', category: 'Role Management' },
      { id: 'roles.update', name: 'Edit Roles', description: 'Edit role permissions', action: 'update', resource: 'roles', category: 'Role Management' },
      { id: 'roles.delete', name: 'Delete Roles', description: 'Remove roles', action: 'delete', resource: 'roles', category: 'Role Management' },
      { id: 'roles.duplicate', name: 'Duplicate Roles', description: 'Duplicate roles', action: 'duplicate', resource: 'roles', category: 'Role Management' },
      { id: 'roles.export', name: 'Export Roles', description: 'Export role configurations', action: 'export', resource: 'roles', category: 'Role Management' },
      
      // Location Management
      { id: 'locations.view', name: 'View Locations', description: 'View location data', action: 'view', resource: 'locations', category: 'Location Management' },
      { id: 'locations.create', name: 'Create Locations', description: 'Add location data', action: 'create', resource: 'locations', category: 'Location Management' },
      { id: 'locations.update', name: 'Edit Locations', description: 'Edit locations', action: 'update', resource: 'locations', category: 'Location Management' },
      { id: 'locations.delete', name: 'Delete Locations', description: 'Remove locations', action: 'delete', resource: 'locations', category: 'Location Management' },
      { id: 'locations.import', name: 'Import Locations', description: 'Bulk import locations', action: 'import', resource: 'locations', category: 'Location Management' },
      { id: 'locations.export', name: 'Export Locations', description: 'Export location data', action: 'export', resource: 'locations', category: 'Location Management' },
      { id: 'locations.toggle', name: 'Enable/Disable', description: 'Toggle location status', action: 'toggle', resource: 'locations', category: 'Location Management' },
      
      // System Settings
      { id: 'settings.view', name: 'View Settings', description: 'View system configuration', action: 'view', resource: 'settings', category: 'System Settings' },
      { id: 'settings.update', name: 'Update Settings', description: 'Modify settings', action: 'update', resource: 'settings', category: 'System Settings' },
      { id: 'settings.kiosk', name: 'Kiosk Settings', description: 'Manage kiosk mode', action: 'kiosk', resource: 'settings', category: 'System Settings' },
      
      // System Monitoring
      { id: 'system.monitor', name: 'Queue Monitor', description: 'Monitor system queues', action: 'monitor', resource: 'system', category: 'System Monitoring' },
      { id: 'system.logs', name: 'View Logs', description: 'Access system logs', action: 'logs', resource: 'system', category: 'System Monitoring' },
    ],
  },
];

