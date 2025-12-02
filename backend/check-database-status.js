const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'visitor_management';

async function checkDatabaseStatus() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check Countries
    const countriesCollection = db.collection('countries');
    const countriesCount = await countriesCollection.countDocuments();
    const countries = await countriesCollection.find({}).project({ name: 1, code: 1 }).toArray();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 COUNTRIES: ${countriesCount} total`);
    countries.forEach(c => console.log(`  • ${c.name} (${c.code})`));

    // Check States
    const statesCollection = db.collection('states');
    const statesCount = await statesCollection.countDocuments();
    const states = await statesCollection.find({}).project({ name: 1, code: 1 }).toArray();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 STATES: ${statesCount} total`);
    states.forEach(s => console.log(`  • ${s.name} (${s.code})`));

    // Check Cities
    const citiesCollection = db.collection('cities');
    const citiesCount = await citiesCollection.countDocuments();
    const cities = await citiesCollection.find({}).project({ name: 1 }).limit(20).toArray();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 CITIES: ${citiesCount} total (showing first 20)`);
    cities.forEach(c => console.log(`  • ${c.name}`));

    // Check Pincodes
    const pincodesCollection = db.collection('pincodes');
    const pincodesCount = await pincodesCollection.countDocuments();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 PINCODES: ${pincodesCount} total\n`);

    // Check Pincode Indexes
    console.log('🔍 PINCODE INDEXES:');
    const pincodeIndexes = await pincodesCollection.indexes();
    pincodeIndexes.forEach(index => {
      console.log(`\n  Index: ${index.name}`);
      console.log(`    Keys: ${JSON.stringify(index.key)}`);
      console.log(`    Unique: ${!!index.unique}`);
      console.log(`    Sparse: ${!!index.sparse}`);
      if (index.collation) {
        console.log(`    Collation: ${JSON.stringify(index.collation)}`);
      }
    });

    // Sample pincodes with areas
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 SAMPLE PINCODES (first 20):');
    const samplePincodes = await pincodesCollection.find({})
      .limit(20)
      .populate('cityId')
      .toArray();
    
    // Manual populate since mongoose isn't fully initialized
    const cityIds = samplePincodes.map(p => p.cityId);
    const cityMap = new Map();
    const cityDocs = await citiesCollection.find({ _id: { $in: cityIds } }).toArray();
    cityDocs.forEach(c => cityMap.set(c._id.toString(), c));

    samplePincodes.forEach(p => {
      const city = cityMap.get(p.cityId?.toString());
      console.log(`  • ${p.pincode} | Area: "${p.area || '(empty)'}" | City: ${city?.name || 'Unknown'}`);
    });

    // Check for duplicates (same pincode, different areas)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 CHECKING FOR PINCODES WITH MULTIPLE AREAS:');
    const duplicatePincodes = await pincodesCollection.aggregate([
      {
        $group: {
          _id: '$pincode',
          count: { $sum: 1 },
          areas: { $push: '$area' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $limit: 10
      }
    ]).toArray();

    if (duplicatePincodes.length > 0) {
      console.log(`\n  Found ${duplicatePincodes.length} pincodes with multiple entries:`);
      duplicatePincodes.forEach(d => {
        console.log(`  • Pincode ${d._id}: ${d.count} entries`);
        console.log(`    Areas: ${d.areas.map(a => `"${a}"`).join(', ')}`);
      });
    } else {
      console.log('  ✅ No pincodes with multiple areas found (each pincode is unique)');
    }

    // Check if old pincode_1 index still exists
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const hasPincode1Index = pincodeIndexes.some(idx => idx.name === 'pincode_1');
    if (hasPincode1Index) {
      console.log('⚠️  WARNING: Old "pincode_1" unique index still exists!');
      console.log('   This will prevent multiple areas per pincode.');
      console.log('   Run: node drop-old-pincode-index.js');
    } else {
      console.log('✅ Old "pincode_1" unique index has been removed');
    }

    const hasCompoundIndex = pincodeIndexes.some(idx => idx.name === 'pincode_1_cityId_1_area_1');
    if (hasCompoundIndex) {
      console.log('✅ Compound unique index "pincode_1_cityId_1_area_1" exists');
    } else {
      console.log('⚠️  WARNING: Compound unique index missing!');
      console.log('   Restart the backend server to create it.');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabaseStatus();

