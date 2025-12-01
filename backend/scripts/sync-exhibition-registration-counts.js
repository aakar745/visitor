#!/usr/bin/env node
/**
 * One-time script to sync exhibition registration counts
 * 
 * This script:
 * 1. Counts actual registrations for each exhibition
 * 2. Updates exhibition.currentRegistrations to match the actual count
 * 
 * Run: node scripts/sync-exhibition-registration-counts.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';

async function syncExhibitionRegistrationCounts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const exhibitionsCollection = db.collection('exhibitions');
    const registrationsCollection = db.collection('exhibition_registrations');

    console.log('\n📊 Fetching all exhibitions...');
    const exhibitions = await exhibitionsCollection.find({}).toArray();
    console.log(`Found ${exhibitions.length} exhibitions\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const exhibition of exhibitions) {
      // Count actual registrations for this exhibition (exclude cancelled)
      const actualCount = await registrationsCollection.countDocuments({
        exhibitionId: exhibition._id,
        status: { $ne: 'cancelled' }
      });

      const currentCount = exhibition.currentRegistrations || 0;

      if (actualCount !== currentCount) {
        console.log(`📝 ${exhibition.name}`);
        console.log(`   Current count: ${currentCount}`);
        console.log(`   Actual count: ${actualCount}`);
        console.log(`   Updating...`);

        await exhibitionsCollection.updateOne(
          { _id: exhibition._id },
          { $set: { currentRegistrations: actualCount } }
        );

        updatedCount++;
        console.log(`   ✅ Updated\n`);
      } else {
        skippedCount++;
        console.log(`✓ ${exhibition.name} - Already synced (${actualCount} registrations)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total exhibitions: ${exhibitions.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped (already correct): ${skippedCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error syncing exhibition registration counts:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the sync
syncExhibitionRegistrationCounts();

