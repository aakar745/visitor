/**
 * Check for Duplicate Registration Numbers
 * 
 * This script finds any duplicate registration numbers in the database.
 * Registration numbers should be UNIQUE.
 * 
 * Run: node scripts/check-duplicate-registration-numbers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';

async function checkDuplicateRegNumbers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('exhibition_registrations');

    // Find duplicate registration numbers
    console.log('🔍 Searching for duplicate registration numbers...\n');
    
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: '$registrationNumber',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          visitorIds: { $push: '$visitorId' },
          exhibitionIds: { $push: '$exhibitionId' },
          dates: { $push: '$registrationDate' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    if (duplicates.length === 0) {
      console.log('✅ No duplicate registration numbers found!');
      console.log('   Database integrity is good.\n');
    } else {
      console.log('🔴 DUPLICATE REGISTRATION NUMBERS FOUND:\n');
      console.log(`   Total duplicates: ${duplicates.length}\n`);
      
      for (const dup of duplicates) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Registration Number: ${dup._id}`);
        console.log(`Duplicate Count: ${dup.count}`);
        console.log(`Registration IDs:`);
        dup.ids.forEach((id, index) => {
          console.log(`  ${index + 1}. ${id} (Date: ${new Date(dup.dates[index]).toLocaleString()})`);
        });
        console.log('');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('❌ ISSUE: Registration numbers must be unique!');
      console.log('   This is a critical bug in the counter generation logic.\n');
      console.log('🔧 RECOMMENDED ACTION:');
      console.log('   1. Run: node scripts/cleanup-database-integrity.js');
      console.log('   2. Check the registration counter collection');
      console.log('   3. Verify the atomic counter logic in registrations.service.ts\n');
    }

    // Show all registration numbers for today
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`;
    
    console.log(`📋 All registrations for today (${dateStr}):\n`);
    const todayRegs = await collection
      .find(
        { registrationNumber: new RegExp(`^REG-${dateStr}-`) },
        { registrationNumber: 1, registrationDate: 1, _id: 0 }
      )
      .sort({ registrationNumber: 1 })
      .toArray();
    
    if (todayRegs.length === 0) {
      console.log('   No registrations found for today.');
    } else {
      todayRegs.forEach(reg => {
        console.log(`   ${reg.registrationNumber}`);
      });
      console.log(`\n   Total: ${todayRegs.length} registration(s)\n`);
    }

    // Check counter collection
    console.log('🔢 Checking registration counter...\n');
    const counterCollection = db.collection('registrationcounters');
    const counter = await counterCollection.findOne({ date: dateStr });
    
    if (counter) {
      console.log(`   Counter for ${dateStr}:`);
      console.log(`   Current Sequence: ${counter.sequence}`);
      console.log(`   Last Updated: ${new Date(counter.updatedAt).toLocaleString()}`);
    } else {
      console.log(`   No counter found for ${dateStr}`);
      console.log('   This is normal for the first registration of the day.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkDuplicateRegNumbers()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

