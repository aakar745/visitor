/**
 * Script to fix Global Visitor indexes
 * 
 * Problem: Email had a unique index, but now phone should be the primary unique identifier
 * 
 * This script:
 * 1. Drops the old unique index on email
 * 2. Ensures phone has unique index
 * 3. Ensures email has non-unique index
 * 
 * Run: node scripts/fix-visitor-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('global_visitors');

    // 1. Get current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(UNIQUE)' : '');
    });
    console.log('');

    // 2. Drop old email unique index if it exists
    console.log('🔄 Dropping old email unique index...');
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 unique index\n');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index does not exist (already dropped)\n');
      } else {
        console.log('⚠️  Could not drop email_1 index:', error.message, '\n');
      }
    }

    // 3. Ensure phone has unique sparse index
    console.log('🔄 Creating phone unique index...');
    try {
      await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'phone_1' });
      console.log('✅ Created phone_1 unique sparse index\n');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('ℹ️  phone_1 unique index already exists\n');
      } else {
        console.log('⚠️  Could not create phone_1 index:', error.message, '\n');
      }
    }

    // 4. Ensure email has non-unique sparse index
    console.log('🔄 Creating email non-unique index...');
    try {
      await collection.createIndex({ email: 1 }, { sparse: true, name: 'email_1_sparse' });
      console.log('✅ Created email_1_sparse (non-unique) index\n');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('ℹ️  email_1_sparse index already exists\n');
      } else {
        console.log('⚠️  Could not create email_1_sparse index:', error.message, '\n');
      }
    }

    // 5. Show final indexes
    console.log('📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(UNIQUE)' : '');
    });
    console.log('');

    console.log('✅ Index fix complete!');
    console.log('\n📝 Summary:');
    console.log('  - Phone: UNIQUE identifier (primary)');
    console.log('  - Email: NON-UNIQUE (duplicates allowed)');
    console.log('  - Other fields: Can be duplicate\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();

