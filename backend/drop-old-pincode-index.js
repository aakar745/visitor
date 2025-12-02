const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'visitor_management';

async function dropOldPincodeIndex() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('pincodes');

    console.log('📋 Current indexes on pincodes collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    const hasPincode1 = indexes.some(idx => idx.name === 'pincode_1');

    if (hasPincode1) {
      console.log('\n🗑️  Dropping old "pincode_1" unique index...');
      try {
        await collection.dropIndex('pincode_1');
        console.log('✅ Successfully dropped old "pincode_1" unique index!');
      } catch (e) {
        if (e.codeName === 'IndexNotFound') {
          console.log('⚠️  "pincode_1" index not found, skipping drop.');
        } else {
          throw e;
        }
      }
    } else {
      console.log('\n✅ Old "pincode_1" index does not exist (already removed).');
    }

    console.log('\n📋 Indexes after cleanup:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✨ Done! Restart your backend server to ensure the compound index is created.');
    console.log('   Expected index: { pincode: 1, cityId: 1, area: 1 } (unique, sparse)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

dropOldPincodeIndex();

