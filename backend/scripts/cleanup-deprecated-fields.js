/**
 * Migration Script: Clean Up Deprecated Fields
 * 
 * This script removes deprecated fields that were cleaned up from the codebase:
 * - exhibition.maxCapacity
 * - exhibition.enableWaitlist
 * - pricingTiers.maxCapacity
 * 
 * IMPORTANT: Run this AFTER deploying the updated schema code
 * 
 * Usage:
 *   node scripts/cleanup-deprecated-fields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // ========================================
    // 1. Clean Exhibition-level deprecated fields
    // ========================================
    console.log('\n📦 Cleaning Exhibition documents...');
    
    const exhibitionsResult = await db.collection('exhibitions').updateMany(
      {
        $or: [
          { maxCapacity: { $exists: true } },
          { enableWaitlist: { $exists: true } }
        ]
      },
      {
        $unset: {
          maxCapacity: "",
          enableWaitlist: ""
        }
      }
    );

    console.log(`   Updated ${exhibitionsResult.modifiedCount} exhibitions`);
    console.log(`   - Removed maxCapacity field`);
    console.log(`   - Removed enableWaitlist field`);

    // ========================================
    // 2. Clean PricingTier-level deprecated fields
    // ========================================
    console.log('\n📦 Cleaning PricingTier subdocuments...');
    
    // Find all exhibitions with pricingTiers that have maxCapacity
    const exhibitionsWithTiers = await db.collection('exhibitions').find({
      'pricingTiers.maxCapacity': { $exists: true }
    }).toArray();

    let tiersUpdated = 0;

    for (const exhibition of exhibitionsWithTiers) {
      if (exhibition.pricingTiers && Array.isArray(exhibition.pricingTiers)) {
        // Remove maxCapacity from each pricing tier
        const cleanedTiers = exhibition.pricingTiers.map(tier => {
          const { maxCapacity, ...rest } = tier;
          if (maxCapacity !== undefined) {
            tiersUpdated++;
          }
          return rest;
        });

        await db.collection('exhibitions').updateOne(
          { _id: exhibition._id },
          { $set: { pricingTiers: cleanedTiers } }
        );
      }
    }

    console.log(`   Updated ${exhibitionsWithTiers.length} exhibitions`);
    console.log(`   - Removed maxCapacity from ${tiersUpdated} pricing tiers`);

    // ========================================
    // 3. Verification
    // ========================================
    console.log('\n🔍 Verifying cleanup...');
    
    const remainingExhibitions = await db.collection('exhibitions').countDocuments({
      $or: [
        { maxCapacity: { $exists: true } },
        { enableWaitlist: { $exists: true } }
      ]
    });

    const remainingTiers = await db.collection('exhibitions').countDocuments({
      'pricingTiers.maxCapacity': { $exists: true }
    });

    if (remainingExhibitions === 0 && remainingTiers === 0) {
      console.log('   ✅ All deprecated fields successfully removed!');
    } else {
      console.log(`   ⚠️  Warning: ${remainingExhibitions} exhibitions and ${remainingTiers} pricing tiers still have deprecated fields`);
    }

    // ========================================
    // 4. Report Statistics
    // ========================================
    console.log('\n📊 Database Statistics:');
    const totalExhibitions = await db.collection('exhibitions').countDocuments();
    const totalActiveExhibitions = await db.collection('exhibitions').countDocuments({
      status: { $in: ['active', 'registration_open', 'live_event'] }
    });
    
    console.log(`   Total Exhibitions: ${totalExhibitions}`);
    console.log(`   Active Exhibitions: ${totalActiveExhibitions}`);

    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanup();

