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
  department: String,
  position: String,
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
const User = mongoose.model('User', userSchema);

// Default roles with all permissions
const defaultRoles = [
  {
    name: 'super_admin',
    description: 'Super Administrator with full system access',
    color: '#ef4444',
    icon: '👑',
    isSystemRole: true,
    isActive: true,
    permissions: [
      { id: 'users.view', name: 'View Users', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'users.create', name: 'Create Users', action: 'create', resource: 'users', category: 'User Management' },
      { id: 'users.update', name: 'Update Users', action: 'update', resource: 'users', category: 'User Management' },
      { id: 'users.delete', name: 'Delete Users', action: 'delete', resource: 'users', category: 'User Management' },
      { id: 'roles.view', name: 'View Roles', action: 'view', resource: 'roles', category: 'Role Management' },
      { id: 'roles.create', name: 'Create Roles', action: 'create', resource: 'roles', category: 'Role Management' },
      { id: 'roles.update', name: 'Update Roles', action: 'update', resource: 'roles', category: 'Role Management' },
      { id: 'roles.delete', name: 'Delete Roles', action: 'delete', resource: 'roles', category: 'Role Management' },
      { id: 'exhibitions.view', name: 'View Exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Update Exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.delete', name: 'Delete Exhibitions', action: 'delete', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'visitors.view', name: 'View Visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Update Visitors', action: 'update', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.delete', name: 'Delete Visitors', action: 'delete', resource: 'visitors', category: 'Visitor Management' },
      { id: 'settings.view', name: 'View Settings', action: 'view', resource: 'settings', category: 'System' },
      { id: 'settings.update', name: 'Update Settings', action: 'update', resource: 'settings', category: 'System' },
    ],
  },
  {
    name: 'admin',
    description: 'Administrator with most system access',
    color: '#3b82f6',
    icon: '⚙️',
    isSystemRole: true,
    isActive: true,
    permissions: [
      { id: 'users.view', name: 'View Users', action: 'view', resource: 'users', category: 'User Management' },
      { id: 'exhibitions.view', name: 'View Exhibitions', action: 'view', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.create', name: 'Create Exhibitions', action: 'create', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'exhibitions.update', name: 'Update Exhibitions', action: 'update', resource: 'exhibitions', category: 'Exhibition Management' },
      { id: 'visitors.view', name: 'View Visitors', action: 'view', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.create', name: 'Create Visitors', action: 'create', resource: 'visitors', category: 'Visitor Management' },
      { id: 'visitors.update', name: 'Update Visitors', action: 'update', resource: 'visitors', category: 'Visitor Management' },
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

    // Find roles
    const superAdminRole = createdRoles.find(r => r.name === 'super_admin');
    const adminRole = createdRoles.find(r => r.name === 'admin');

    if (!superAdminRole) {
      throw new Error('Super admin role not created!');
    }

    // Seed users OR fix admin role
    if (existingUsersCount === 0) {
      console.log('👥 Creating users...');
      
      const hashedPassword1 = await bcrypt.hash('Admin@123', 10);
      const hashedPassword2 = await bcrypt.hash('admin123', 10);

      const defaultUsers = [
        {
          name: 'Super Admin',
          email: 'admin@visitor-system.com',
          password: hashedPassword1,
          role: superAdminRole._id,
          status: 'active',
          isActive: true,
          department: 'IT',
          position: 'System Administrator',
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword2,
          role: adminRole ? adminRole._id : superAdminRole._id,
          status: 'active',
          isActive: true,
          department: 'Management',
          position: 'Administrator',
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
      console.log('┌─────────────────────────────────────────┐');
      console.log('│  Admin Account                          │');
      console.log('├─────────────────────────────────────────┤');
      console.log('│  Email:    admin@example.com            │');
      console.log('│  Password: admin123                     │');
      console.log('└─────────────────────────────────────────┘\n');
      console.log('⚠️  Change these passwords after first login!\n');
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

