/**
 * Comprehensive Database Cleanup Script
 * 
 * This script ensures database integrity by:
 * 1. Removing orphaned visitors (no registrations)
 * 2. Removing orphaned registrations (invalid visitorId)
 * 3. Migrating dynamic fields from registration.customFieldData to GlobalVisitor
 * 4. Removing duplicate visitor profiles (same phone number)
 * 5. Removing duplicate registrations (same visitor + exhibition)
 * 
 * Run: node scripts/cleanup-database-integrity.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor-management';

// Define schemas
const GlobalVisitorSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true },
  name: String,
  company: String,
  designation: String,
  city: String,
  state: String,
  pincode: String,
  address: String,
  totalRegistrations: { type: Number, default: 0 },
  lastRegistrationDate: Date,
  registeredExhibitions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition' }],
}, { timestamps: true, strict: false }); // strict: false allows dynamic fields

const ExhibitionRegistrationSchema = new mongoose.Schema({
  registrationNumber: { type: String, required: true, unique: true },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'GlobalVisitor', required: true },
  exhibitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exhibition', required: true },
  registrationCategory: String,
  selectedInterests: [String],
  customFieldData: { type: Object, default: {} },
  registrationDate: Date,
  status: String,
}, { timestamps: true });

const GlobalVisitor = mongoose.model('GlobalVisitor', GlobalVisitorSchema, 'global_visitors');
const ExhibitionRegistration = mongoose.model('ExhibitionRegistration', ExhibitionRegistrationSchema, 'exhibition_registrations');

// Standard fields that should NOT be in customFieldData or treated as dynamic
const STANDARD_VISITOR_FIELDS = [
  'name', 'full_name', 'fullname', 'full-name',
  'email', 'e_mail', 'e-mail',
  'phone', 'mobile', 'contact', 'phone_number',
  'company', 'organization',
  'designation', 'position', 'title',
  'city', 
  'state',
  'pincode', 'pin_code', 'postal', 'zip',
  'address', 'full_address', 'street',
  // MongoDB internal fields
  '_id', '__v', 'createdAt', 'updatedAt',
  'totalRegistrations', 'lastRegistrationDate', 'registeredExhibitions'
];

async function cleanupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Remove orphaned registrations (invalid visitorId)
    console.log('📋 Step 1: Checking for orphaned registrations...');
    const allRegistrations = await ExhibitionRegistration.find().lean();
    let orphanedRegistrations = 0;
    
    for (const reg of allRegistrations) {
      const visitorExists = await GlobalVisitor.findById(reg.visitorId);
      if (!visitorExists) {
        await ExhibitionRegistration.findByIdAndDelete(reg._id);
        orphanedRegistrations++;
        console.log(`   ❌ Deleted orphaned registration: ${reg.registrationNumber}`);
      }
    }
    console.log(`✅ Removed ${orphanedRegistrations} orphaned registrations\n`);

    // Step 2: Migrate dynamic fields from registrations to visitors
    console.log('📋 Step 2: Migrating dynamic fields to GlobalVisitor...');
    const registrations = await ExhibitionRegistration.find().lean();
    let migratedCount = 0;
    let cleanedCount = 0;

    for (const reg of registrations) {
      if (!reg.customFieldData || Object.keys(reg.customFieldData).length === 0) {
        continue;
      }

      const visitor = await GlobalVisitor.findById(reg.visitorId);
      if (!visitor) continue;

      let visitorUpdated = false;
      let registrationUpdated = false;
      const fieldsToRemoveFromReg = [];

      // Check each field in customFieldData
      for (const [key, value] of Object.entries(reg.customFieldData)) {
        const normalizedKey = key.toLowerCase().replace(/\s/g, '_');
        
        // If it's NOT a standard field, it should be in GlobalVisitor
        if (!STANDARD_VISITOR_FIELDS.includes(normalizedKey)) {
          // Move to GlobalVisitor if not already there
          if (!visitor[key]) {
            visitor[key] = value;
            visitorUpdated = true;
            migratedCount++;
            console.log(`   ✅ Migrated "${key}" to visitor ${visitor.phone || visitor.email}`);
          }
          // Mark for removal from registration.customFieldData
          fieldsToRemoveFromReg.push(key);
          registrationUpdated = true;
        }
      }

      // Save visitor if updated
      if (visitorUpdated) {
        await visitor.save();
      }

      // Clean registration.customFieldData
      if (registrationUpdated && fieldsToRemoveFromReg.length > 0) {
        const cleanedCustomFieldData = { ...reg.customFieldData };
        fieldsToRemoveFromReg.forEach(key => delete cleanedCustomFieldData[key]);
        
        await ExhibitionRegistration.findByIdAndUpdate(reg._id, {
          customFieldData: cleanedCustomFieldData
        });
        cleanedCount++;
      }
    }
    console.log(`✅ Migrated ${migratedCount} dynamic fields`);
    console.log(`✅ Cleaned ${cleanedCount} registration records\n`);

    // Step 3: Remove duplicate visitor profiles (same phone)
    console.log('📋 Step 3: Checking for duplicate visitor profiles...');
    const visitors = await GlobalVisitor.find({ phone: { $exists: true, $ne: null } }).lean();
    const phoneMap = new Map();
    let duplicateVisitors = 0;

    for (const visitor of visitors) {
      if (!visitor.phone) continue;
      
      if (phoneMap.has(visitor.phone)) {
        // Duplicate found - keep the one with more registrations
        const existing = phoneMap.get(visitor.phone);
        const existingRegCount = await ExhibitionRegistration.countDocuments({ visitorId: existing._id });
        const currentRegCount = await ExhibitionRegistration.countDocuments({ visitorId: visitor._id });

        let toDelete, toKeep;
        if (currentRegCount > existingRegCount) {
          toDelete = existing._id;
          toKeep = visitor._id;
          phoneMap.set(visitor.phone, visitor);
        } else {
          toDelete = visitor._id;
          toKeep = existing._id;
        }

        // Update registrations to point to the kept visitor
        await ExhibitionRegistration.updateMany(
          { visitorId: toDelete },
          { visitorId: toKeep }
        );

        // Delete duplicate visitor
        await GlobalVisitor.findByIdAndDelete(toDelete);
        duplicateVisitors++;
        console.log(`   ❌ Merged duplicate visitor: ${visitor.phone}`);
      } else {
        phoneMap.set(visitor.phone, visitor);
      }
    }
    console.log(`✅ Removed ${duplicateVisitors} duplicate visitor profiles\n`);

    // Step 4: Remove duplicate registrations (same visitor + exhibition)
    console.log('📋 Step 4: Checking for duplicate registrations...');
    const allRegs = await ExhibitionRegistration.find().lean();
    const regMap = new Map();
    let duplicateRegs = 0;

    for (const reg of allRegs) {
      const key = `${reg.visitorId}_${reg.exhibitionId}`;
      
      if (regMap.has(key)) {
        // Duplicate found - keep the latest one
        const existing = regMap.get(key);
        const toDelete = new Date(reg.registrationDate) > new Date(existing.registrationDate) 
          ? existing._id 
          : reg._id;
        
        await ExhibitionRegistration.findByIdAndDelete(toDelete);
        duplicateRegs++;
        console.log(`   ❌ Deleted duplicate registration for visitor ${reg.visitorId}`);
        
        // Update map with the kept registration
        if (toDelete.toString() === existing._id.toString()) {
          regMap.set(key, reg);
        }
      } else {
        regMap.set(key, reg);
      }
    }
    console.log(`✅ Removed ${duplicateRegs} duplicate registrations\n`);

    // Step 5: Remove orphaned visitors (no registrations)
    console.log('📋 Step 5: Checking for orphaned visitors...');
    const allVisitors = await GlobalVisitor.find().lean();
    let orphanedVisitors = 0;

    for (const visitor of allVisitors) {
      const regCount = await ExhibitionRegistration.countDocuments({ visitorId: visitor._id });
      if (regCount === 0) {
        await GlobalVisitor.findByIdAndDelete(visitor._id);
        orphanedVisitors++;
        console.log(`   ❌ Deleted orphaned visitor: ${visitor.phone || visitor.email}`);
      }
    }
    console.log(`✅ Removed ${orphanedVisitors} orphaned visitors\n`);

    // Step 6: Recalculate visitor statistics
    console.log('📋 Step 6: Recalculating visitor statistics...');
    const remainingVisitors = await GlobalVisitor.find();
    let updatedStats = 0;

    for (const visitor of remainingVisitors) {
      const registrations = await ExhibitionRegistration.find({ visitorId: visitor._id }).sort({ registrationDate: -1 });
      
      visitor.totalRegistrations = registrations.length;
      visitor.lastRegistrationDate = registrations.length > 0 ? registrations[0].registrationDate : undefined;
      visitor.registeredExhibitions = [...new Set(registrations.map(r => r.exhibitionId))];
      
      await visitor.save();
      updatedStats++;
    }
    console.log(`✅ Updated statistics for ${updatedStats} visitors\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 CLEANUP SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   🗑️  Orphaned Registrations: ${orphanedRegistrations}`);
    console.log(`   📦 Dynamic Fields Migrated: ${migratedCount}`);
    console.log(`   🧹 Registration Records Cleaned: ${cleanedCount}`);
    console.log(`   👥 Duplicate Visitors: ${duplicateVisitors}`);
    console.log(`   📝 Duplicate Registrations: ${duplicateRegs}`);
    console.log(`   🗑️  Orphaned Visitors: ${orphanedVisitors}`);
    console.log(`   📊 Statistics Updated: ${updatedStats}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const finalVisitorCount = await GlobalVisitor.countDocuments();
    const finalRegCount = await ExhibitionRegistration.countDocuments();
    console.log(`✅ Database is now clean!`);
    console.log(`   Total Visitors: ${finalVisitorCount}`);
    console.log(`   Total Registrations: ${finalRegCount}\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupDatabase()
  .then(() => {
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });

