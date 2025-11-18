/**
 * Migration Script: Clean Duplicate Standard Fields from customFieldData
 * 
 * This script removes standard GlobalVisitor fields from ExhibitionRegistration.customFieldData
 * to eliminate duplicate columns in the All Visitors admin panel.
 * 
 * Usage:
 *   node backend/scripts/clean-duplicate-custom-fields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-management';

const STANDARD_VISITOR_FIELDS = [
  'name', 'full_name', 'fullname', 'full-name',
  'email', 'e_mail', 'e-mail',
  'phone', 'mobile', 'contact', 'phone_number',
  'company', 'organization',
  'designation', 'position', 'title',
  'city', 
  'state',
  'pincode', 'pin_code', 'postal', 'zip',
  'address', 'full_address', 'street'
];

const RegistrationSchema = new mongoose.Schema({
  customFieldData: { type: Object, default: {} }
});

const Registration = mongoose.model('ExhibitionRegistration', RegistrationSchema, 'exhibition_registrations');

async function cleanDuplicateFields() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const registrations = await Registration.find({
      customFieldData: { $exists: true, $ne: {} }
    });

    console.log(`📊 Found ${registrations.length} registrations with customFieldData\n`);

    let cleanedCount = 0;
    let alreadyCleanCount = 0;
    let totalFieldsRemoved = 0;

    for (const registration of registrations) {
      const originalData = registration.customFieldData;
      const cleanedData = {};
      let hasChanges = false;
      let removedFields = [];

      // Filter out standard fields
      Object.keys(originalData).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/\s/g, '_');
        if (STANDARD_VISITOR_FIELDS.includes(normalizedKey)) {
          hasChanges = true;
          removedFields.push(key);
        } else {
          cleanedData[key] = originalData[key];
        }
      });

      if (hasChanges) {
        // Update registration with cleaned data
        await Registration.updateOne(
          { _id: registration._id },
          { $set: { customFieldData: cleanedData } }
        );

        console.log(`✅ Cleaned registration ${registration._id}`);
        console.log(`   Removed fields: ${removedFields.join(', ')}`);
        console.log(`   Remaining fields: ${Object.keys(cleanedData).join(', ') || 'none'}\n`);
        
        cleanedCount++;
        totalFieldsRemoved += removedFields.length;
      } else {
        alreadyCleanCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Registrations cleaned: ${cleanedCount}`);
    console.log(`✓  Already clean (skipped): ${alreadyCleanCount}`);
    console.log(`🗑️  Total duplicate fields removed: ${totalFieldsRemoved}`);
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
cleanDuplicateFields();

