/**
 * Cleanup Script: Remove Orphaned Visitors
 * 
 * This script removes visitor profiles that have ZERO active registrations.
 * These are orphaned records left behind from deleted registrations.
 * 
 * Usage:
 *   node backend/scripts/cleanup-orphaned-visitors.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-management';

const GlobalVisitorSchema = new mongoose.Schema({
  phone: String,
  email: String,
  name: String,
  company: String,
  totalRegistrations: Number,
});

const RegistrationSchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'GlobalVisitor' },
});

const GlobalVisitor = mongoose.model('GlobalVisitor', GlobalVisitorSchema, 'global_visitors');
const Registration = mongoose.model('ExhibitionRegistration', RegistrationSchema, 'exhibition_registrations');

async function cleanupOrphanedVisitors() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all visitors
    const allVisitors = await GlobalVisitor.find({}).exec();
    console.log(`📊 Found ${allVisitors.length} total visitor profiles\n`);

    let orphanedCount = 0;
    let activeCount = 0;
    const orphanedVisitors = [];

    // Check each visitor for active registrations
    for (const visitor of allVisitors) {
      const registrationCount = await Registration.countDocuments({ 
        visitorId: visitor._id 
      }).exec();

      if (registrationCount === 0) {
        // Orphaned visitor - no active registrations
        orphanedVisitors.push({
          id: visitor._id,
          name: visitor.name || 'N/A',
          email: visitor.email || 'N/A',
          phone: visitor.phone || 'N/A',
          company: visitor.company || 'N/A',
          storedCount: visitor.totalRegistrations || 0
        });
        orphanedCount++;
      } else {
        activeCount++;
      }
    }

    console.log('='.repeat(60));
    console.log('📊 SCAN RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Active visitors (with registrations): ${activeCount}`);
    console.log(`🗑️  Orphaned visitors (no registrations): ${orphanedCount}`);
    console.log('='.repeat(60) + '\n');

    if (orphanedCount === 0) {
      console.log('✨ No orphaned visitors found! Database is clean.');
      return;
    }

    // Show orphaned visitors
    console.log('🗑️  ORPHANED VISITORS TO DELETE:\n');
    orphanedVisitors.forEach((v, index) => {
      console.log(`${index + 1}. ${v.name} (${v.email}) - Phone: ${v.phone}`);
    });
    console.log();

    // Delete orphaned visitors
    console.log('🔄 Deleting orphaned visitor profiles...\n');
    const visitorIds = orphanedVisitors.map(v => v.id);
    const deleteResult = await GlobalVisitor.deleteMany({
      _id: { $in: visitorIds }
    }).exec();

    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} orphaned visitor profiles`);
    console.log(`✅ Active visitors remaining: ${activeCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify final counts
    const finalVisitorCount = await GlobalVisitor.countDocuments().exec();
    const finalRegistrationCount = await Registration.countDocuments().exec();
    
    console.log('📊 FINAL DATABASE STATE:');
    console.log(`   Total Visitors: ${finalVisitorCount}`);
    console.log(`   Total Registrations: ${finalRegistrationCount}`);
    console.log();

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupOrphanedVisitors();

