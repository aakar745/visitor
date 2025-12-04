import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Role } from '../database/schemas/role.schema';
import { getModelToken } from '@nestjs/mongoose';

/**
 * Migration Script: Update Super Admin Role Permissions
 * 
 * This script updates the super_admin role with all 57 new permissions
 * organized across 11 categories.
 */
async function updateSuperAdminPermissions() {
  console.log('🔄 Starting Super Admin permissions update...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const roleModel = app.get<Model<Role>>(getModelToken(Role.name));

  try {
    // All 58 permissions for Super Admin (added users.reset_password)
    const allPermissions = [
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
      { id: 'visitors.create', name: 'Register Visitors', description: 'Register visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Edit Visitors', description: 'Edit visitor information', action: 'update', resource: 'visitors', category: 'Visitor Management' },
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
    ];

    // Find and update Super Admin role
    const superAdmin = await roleModel.findOne({ name: 'super_admin', isSystemRole: true });

    if (!superAdmin) {
      console.error('❌ Super Admin role not found!');
      await app.close();
      process.exit(1);
    }

    console.log(`📋 Current permissions: ${superAdmin.permissions.length}`);
    console.log(`📋 New permissions: ${allPermissions.length}\n`);

    // Update permissions
    const result = await roleModel.findByIdAndUpdate(
      superAdmin._id,
      { permissions: allPermissions },
      { new: true }
    );

    console.log('✅ Super Admin permissions updated successfully!');
    console.log(`✅ Total permissions: ${result?.permissions.length}\n`);

    // Display permissions by category
    const categories = [...new Set(allPermissions.map(p => p.category))];
    console.log('📊 Permissions by Category:');
    categories.forEach(category => {
      const count = allPermissions.filter(p => p.category === category).length;
      console.log(`   ${category}: ${count} permissions`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error updating Super Admin permissions:', error);
    throw error;
  } finally {
    await app.close();
  }
}

updateSuperAdminPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

