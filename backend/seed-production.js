/**
 * Production Seed Script
 * Creates default admin users and roles
 * Run: node seed-production.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';

// Schemas (simplified for seeding)
const roleSchema = new mongoose.Schema({
  name: String,
  description: String,
  color: String,
  icon: String,
  isSystemRole: Boolean,
  isActive: Boolean,
  permissions: [Object],
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  status: String,
  isActive: Boolean,
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);

// Only Super Admin role is predefined with all system permissions
// All other roles should be created custom with specific permissions based on pages
const defaultRoles = [
  {
    name: 'super_admin',
    description: 'Super Administrator with full system access',
    color: '#ef4444',
    icon: '👑',
    isSystemRole: true,
    isActive: true,
    permissions: [
      // Dashboard
      { id: 'dashboard.view', name: 'View Dashboard', action: 'view', resource: 'dashboard', category: 'Dashboard' },
      // Exhibition Management
      { id: 'exhibitions.view', name: 'View Exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Edit Exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.delete', name: 'Delete Exhibitions', action: 'delete', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.duplicate', name: 'Duplicate Exhibitions', action: 'duplicate', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.publish', name: 'Publish/Unpublish', action: 'publish', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.qrcode', name: 'Generate QR Codes', action: 'qrcode', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.copylink', name: 'Copy Registration Links', action: 'copylink', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.export', name: 'Export Exhibitions', action: 'export', resource: 'exhibitions', category: 'Exhibition Management' },
      // Exhibitor Management
      { id: 'exhibitors.view', name: 'View Exhibitors', action: 'view', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.create', name: 'Create Exhibitors', action: 'create', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.update', name: 'Edit Exhibitors', action: 'update', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.delete', name: 'Delete Exhibitors', action: 'delete', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.qrcode', name: 'Generate QR Codes', action: 'qrcode', resource: 'exhibitors', category: 'Exhibitor Management' },
      { id: 'exhibitors.toggle', name: 'Enable/Disable Links', action: 'toggle', resource: 'exhibitors', category: 'Exhibitor Management' },
      // Visitor Management
      { id: 'visitors.view', name: 'View Visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Register Visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Edit Visitors', action: 'update', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.delete', name: 'Delete Visitors', action: 'delete', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.import', name: 'Import Visitors', action: 'import', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.export', name: 'Export Visitors', action: 'export', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.search', name: 'Advanced Search', action: 'search', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.bulk', name: 'Bulk Operations', action: 'bulk', resource: 'visitors', category: 'Visitor Management' },
      // Analytics
      { id: 'analytics.view', name: 'View Analytics Dashboard', action: 'view', resource: 'analytics', category: 'Analytics' },
      { id: 'analytics.export', name: 'Export Analytics', action: 'export', resource: 'analytics', category: 'Analytics' },
      // Exhibition Reports
      { id: 'reports.view', name: 'View Exhibition Reports', action: 'view', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.filter', name: 'Filter Reports', action: 'filter', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.search', name: 'Search Registrations', action: 'search', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.export', name: 'Export Reports', action: 'export', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.delete', name: 'Delete Registrations', action: 'delete', resource: 'reports', category: 'Exhibition Reports' },
      { id: 'reports.details', name: 'View Registration Details', action: 'details', resource: 'reports', category: 'Exhibition Reports' },
      // User Management
      { id: 'users.view', name: 'View Users', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'users.create', name: 'Create Users', action: 'create', resource: 'users', category: 'User Management' },
      { id: 'users.update', name: 'Edit Users', action: 'update', resource: 'users', category: 'User Management' },
      { id: 'users.delete', name: 'Delete Users', action: 'delete', resource: 'users', category: 'User Management' },
      { id: 'users.export', name: 'Export Users', action: 'export', resource: 'users', category: 'User Management' },
      // Role Management
      { id: 'roles.view', name: 'View Roles', action: 'view', resource: 'roles', category: 'Role Management' },
      { id: 'roles.create', name: 'Create Roles', action: 'create', resource: 'roles', category: 'Role Management' },
      { id: 'roles.update', name: 'Edit Roles', action: 'update', resource: 'roles', category: 'Role Management' },
      { id: 'roles.delete', name: 'Delete Roles', action: 'delete', resource: 'roles', category: 'Role Management' },
      { id: 'roles.duplicate', name: 'Duplicate Roles', action: 'duplicate', resource: 'roles', category: 'Role Management' },
      { id: 'roles.export', name: 'Export Roles', action: 'export', resource: 'roles', category: 'Role Management' },
      // Location Management
      { id: 'locations.view', name: 'View Locations', action: 'view', resource: 'locations', category: 'Location Management' },
      { id: 'locations.create', name: 'Create Locations', action: 'create', resource: 'locations', category: 'Location Management' },
      { id: 'locations.update', name: 'Edit Locations', action: 'update', resource: 'locations', category: 'Location Management' },
      { id: 'locations.delete', name: 'Delete Locations', action: 'delete', resource: 'locations', category: 'Location Management' },
      { id: 'locations.import', name: 'Import Locations', action: 'import', resource: 'locations', category: 'Location Management' },
      { id: 'locations.export', name: 'Export Locations', action: 'export', resource: 'locations', category: 'Location Management' },
      { id: 'locations.toggle', name: 'Enable/Disable', action: 'toggle', resource: 'locations', category: 'Location Management' },
      // System Settings
      { id: 'settings.view', name: 'View Settings', action: 'view', resource: 'settings', category: 'System Settings' },
      { id: 'settings.update', name: 'Update Settings', action: 'update', resource: 'settings', category: 'System Settings' },
      { id: 'settings.kiosk', name: 'Kiosk Settings', action: 'kiosk', resource: 'settings', category: 'System Settings' },
      // System Monitoring
      { id: 'system.monitor', name: 'Queue Monitor', action: 'monitor', resource: 'system', category: 'System Monitoring' },
      { id: 'system.logs', name: 'View Logs', action: 'logs', resource: 'system', category: 'System Monitoring' },
    ],
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('📡 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}\n`);

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check existing data
    const existingRolesCount = await Role.countDocuments();
    const existingUsersCount = await User.countDocuments();

    console.log(`📊 Current database state:`);
    console.log(`   Roles: ${existingRolesCount}`);
    console.log(`   Users: ${existingUsersCount}\n`);

    // ✅ ALWAYS check and fix admin user role, even if already seeded
    const adminUser = await User.findOne({ email: 'admin@visitor-system.com' });
    const needsRoleFix = adminUser && !adminUser.role;

    if (existingRolesCount > 0 && existingUsersCount > 0 && !needsRoleFix) {
      console.log('⚠️  Database already seeded and admin has role!');
      console.log('   All good - no changes needed.\n');
      await mongoose.disconnect();
      return;
    }

    if (needsRoleFix) {
      console.log('⚠️  Admin user exists but has NO ROLE - fixing...\n');
    }

    // Seed roles
    let createdRoles = [];
    if (existingRolesCount === 0) {
      console.log('🎭 Creating roles...');
      createdRoles = await Role.insertMany(defaultRoles);
      console.log(`✅ Created ${createdRoles.length} roles\n`);
    } else {
      createdRoles = await Role.find();
    }

    // Find super admin role
    const superAdminRole = createdRoles.find(r => r.name === 'super_admin');

    if (!superAdminRole) {
      throw new Error('Super Admin role not created!');
    }

    // Seed users OR fix admin role
    if (existingUsersCount === 0) {
      console.log('👥 Creating users...');
      
      const hashedPassword1 = await bcrypt.hash('Admin@123', 10);

      const defaultUsers = [
        {
          name: 'Super Admin',
          email: 'admin@visitor-system.com',
          password: hashedPassword1,
          role: superAdminRole._id,
          status: 'active',
          isActive: true,
        },
      ];

      await User.insertMany(defaultUsers);
      console.log(`✅ Created ${defaultUsers.length} users\n`);
    } else if (needsRoleFix) {
      // Fix admin user role if it's missing
      console.log('🔧 Fixing admin user role...');
      await User.updateOne(
        { email: 'admin@visitor-system.com' },
        { $set: { role: superAdminRole._id } }
      );
      console.log(`✅ Admin role fixed: assigned super_admin\n`);
    }

    // Display credentials (only if users were newly created)
    if (existingUsersCount === 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Database seeded successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📋 Default Login Credentials:\n');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│  Super Admin Account                    │');
      console.log('├─────────────────────────────────────────┤');
      console.log('│  Email:    admin@visitor-system.com     │');
      console.log('│  Password: Admin@123                    │');
      console.log('└─────────────────────────────────────────┘\n');
      console.log('⚠️  Change this password after first login!\n');
    }

    console.log('✨ Seeding completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

seed();

