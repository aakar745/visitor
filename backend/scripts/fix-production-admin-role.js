/**
 * Fix admin user role in PRODUCTION database
 * Run: node backend/scripts/fix-production-admin-role.js
 */

require('dotenv').config({ path: './env.production.txt' }); // Load production env
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in env.production.txt');
  process.exit(1);
}

async function fixAdminRole() {
  try {
    console.log('🔌 Connecting to PRODUCTION MongoDB...');
    console.log(`📍 Database: ${MONGODB_URI.split('@')[1]?.split('/')[0] || 'hidden'}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to PRODUCTION MongoDB\n');

    // Get collections
    const User = mongoose.connection.collection('users');
    const Role = mongoose.connection.collection('roles');
    
    // Find super_admin role
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    
    if (!superAdminRole) {
      console.log('❌ super_admin role not found in production!');
      
      // Show all available roles
      const allRoles = await Role.find({}).toArray();
      console.log('\n📋 Available roles in production:');
      allRoles.forEach(role => {
        console.log(`   - ${role.name} (${role._id})`);
      });
      
      process.exit(1);
    }

    console.log(`🔑 Found super_admin role: ${superAdminRole._id}`);
    
    // Check current admin user status
    const adminUser = await User.findOne({ email: 'admin@visitor-system.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in production!');
      process.exit(1);
    }
    
    console.log('\n📌 Current Admin User:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Current Role ID: ${adminUser.roleId || 'NONE'}`);
    
    // Update admin user
    const result = await User.updateOne(
      { email: 'admin@visitor-system.com' },
      { $set: { roleId: superAdminRole._id } }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ PRODUCTION admin user updated successfully!');
      
      // Verify the update
      const updatedUser = await User.findOne({ email: 'admin@visitor-system.com' });
      const role = await Role.findOne({ _id: updatedUser.roleId });
      
      console.log('\n📋 Verification:');
      console.log(`   User: ${updatedUser.email}`);
      console.log(`   Role ID: ${updatedUser.roleId}`);
      console.log(`   Role Name: ${role.name}`);
      console.log('\n🎉 Admin can now manage locations in PRODUCTION!');
    } else {
      console.log('\nℹ️ No changes made (user may already have the role)');
      
      // Show current role
      if (adminUser.roleId) {
        const currentRole = await Role.findOne({ _id: adminUser.roleId });
        console.log(`   Current role: ${currentRole?.name || 'Unknown'}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from PRODUCTION MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixAdminRole();

