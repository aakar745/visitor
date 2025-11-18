/**
 * Migration Script: Convert Interest ObjectIds to Interest Names
 * 
 * This script fixes registrations where selectedInterests contains ObjectIds
 * instead of interest names (human-readable strings).
 * 
 * Before: selectedInterests: ["6911ad36a7bf9e3e54345673", "6911ad36a7bf9e3e54345674"]
 * After:  selectedInterests: ["Fashion", "Technology", "Design"]
 * 
 * Usage:
 *   node backend/scripts/migrate-interest-ids-to-names.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-management';

// Define schemas (minimal versions for migration)
const InterestOptionSchema = new mongoose.Schema({
  name: String,
});

const ExhibitionSchema = new mongoose.Schema({
  interestOptions: [InterestOptionSchema],
});

const RegistrationSchema = new mongoose.Schema({
  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition' },
  selectedInterests: [String],
});

const Exhibition = mongoose.model('Exhibition', ExhibitionSchema, 'exhibitions');
const Registration = mongoose.model('ExhibitionRegistration', RegistrationSchema, 'exhibition_registrations');

async function migrateInterests() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all registrations with non-empty selectedInterests
    const registrations = await Registration.find({
      selectedInterests: { $exists: true, $ne: [] }
    }).populate('exhibitionId');

    console.log(`📊 Found ${registrations.length} registrations with interests\n`);

    let migratedCount = 0;
    let alreadyValidCount = 0;
    let failedCount = 0;

    for (const registration of registrations) {
      try {
        const exhibition = registration.exhibitionId;
        
        if (!exhibition || !exhibition.interestOptions) {
          console.log(`⚠️  Skipping registration ${registration._id} - No exhibition or interest options`);
          failedCount++;
          continue;
        }

        // Check if interests are already names (not ObjectIds)
        const firstInterest = registration.selectedInterests[0];
        const isObjectId = mongoose.Types.ObjectId.isValid(firstInterest) && 
                          firstInterest.length === 24 && 
                          /^[a-f0-9]{24}$/.test(firstInterest);

        if (!isObjectId) {
          // Already migrated or using names
          alreadyValidCount++;
          continue;
        }

        // Map ObjectIds to names
        const interestNames = registration.selectedInterests
          .map(interestId => {
            const option = exhibition.interestOptions.find(
              opt => opt._id.toString() === interestId
            );
            return option ? option.name : null;
          })
          .filter(name => name !== null); // Remove null entries

        if (interestNames.length > 0) {
          // Update registration
          await Registration.updateOne(
            { _id: registration._id },
            { $set: { selectedInterests: interestNames } }
          );

          console.log(`✅ Migrated registration ${registration._id}`);
          console.log(`   Before: [${registration.selectedInterests.slice(0, 2).join(', ')}...]`);
          console.log(`   After:  [${interestNames.join(', ')}]\n`);
          
          migratedCount++;
        } else {
          console.log(`⚠️  Could not map interests for registration ${registration._id}`);
          failedCount++;
        }
      } catch (error) {
        console.error(`❌ Error migrating registration ${registration._id}:`, error.message);
        failedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`✓  Already valid (skipped): ${alreadyValidCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📝 Total processed: ${registrations.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateInterests();

