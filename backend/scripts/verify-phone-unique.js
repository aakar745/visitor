/**
 * Verify and fix phone unique index
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function verifyPhoneIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('global_visitors');

    // Check phone index details
    const indexes = await collection.indexes();
    const phoneIndex = indexes.find(idx => idx.key.phone === 1);
    
    console.log('📋 Phone index details:');
    console.log(JSON.stringify(phoneIndex, null, 2));
    console.log('');

    if (!phoneIndex.unique) {
      console.log('⚠️  Phone index is NOT unique! Fixing...\n');
      
      // Drop old phone index
      await collection.dropIndex('phone_1');
      console.log('✅ Dropped old phone_1 index\n');
      
      // Create new unique phone index
      await collection.createIndex(
        { phone: 1 }, 
        { unique: true, sparse: true, name: 'phone_1_unique' }
      );
      console.log('✅ Created phone_1_unique with UNIQUE constraint\n');
      
      // Verify
      const newIndexes = await collection.indexes();
      const newPhoneIndex = newIndexes.find(idx => idx.key.phone === 1);
      console.log('📋 New phone index:');
      console.log(JSON.stringify(newPhoneIndex, null, 2));
    } else {
      console.log('✅ Phone index is already UNIQUE!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPhoneIndex();

