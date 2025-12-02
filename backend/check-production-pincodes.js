/**
 * Production Pincode Count Check
 * Run this to verify how many pincodes are actually in your database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'visitor_management';

async function checkPincodeCounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;
    const pincodesCollection = db.collection('pincodes');

    // Total pincode count
    const totalPincodes = await pincodesCollection.countDocuments();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PINCODE DATABASE STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Total Pincodes: ${totalPincodes.toLocaleString()}`);

    // Active pincodes
    const activePincodes = await pincodesCollection.countDocuments({ isActive: true });
    console.log(`✅ Active Pincodes: ${activePincodes.toLocaleString()}`);
    console.log(`❌ Inactive Pincodes: ${(totalPincodes - activePincodes).toLocaleString()}`);
    console.log('');

    // Unique pincode numbers (without considering area)
    const uniquePincodesAgg = await pincodesCollection.aggregate([
      { $group: { _id: '$pincode' } },
      { $count: 'uniquePincodes' }
    ]).toArray();
    
    const uniquePincodeCount = uniquePincodesAgg[0]?.uniquePincodes || 0;
    console.log(`🔢 Unique Pincode Numbers: ${uniquePincodeCount.toLocaleString()}`);
    console.log(`📍 With Areas (total records): ${totalPincodes.toLocaleString()}`);
    console.log(`📊 Average areas per pincode: ${(totalPincodes / uniquePincodeCount).toFixed(2)}`);
    console.log('');

    // Pincodes with multiple areas
    const pincodesWithMultipleAreas = await pincodesCollection.aggregate([
      { $group: { _id: '$pincode', count: { $sum: 1 }, areas: { $push: '$area' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    if (pincodesWithMultipleAreas.length > 0) {
      console.log('📍 Top 10 Pincodes with Multiple Areas:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      pincodesWithMultipleAreas.forEach((item, index) => {
        console.log(`${index + 1}. PIN: ${item._id} → ${item.count} areas`);
        item.areas.slice(0, 3).forEach(area => {
          console.log(`   • ${area || '(blank)'}`);
        });
        if (item.count > 3) {
          console.log(`   ... and ${item.count - 3} more areas`);
        }
      });
      console.log('');
    }

    // Gujarat specific count
    const gujaratPincodes = await pincodesCollection.aggregate([
      {
        $lookup: {
          from: 'cities',
          localField: 'cityId',
          foreignField: '_id',
          as: 'city'
        }
      },
      { $unwind: '$city' },
      {
        $lookup: {
          from: 'states',
          localField: 'city.stateId',
          foreignField: '_id',
          as: 'state'
        }
      },
      { $unwind: '$state' },
      { $match: { 'state.name': 'Gujarat' } },
      { $count: 'total' }
    ]).toArray();

    const gujaratCount = gujaratPincodes[0]?.total || 0;
    console.log('📍 Gujarat-Specific Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Gujarat Pincodes: ${gujaratCount.toLocaleString()}`);
    console.log(`📊 Percentage of total: ${((gujaratCount / totalPincodes) * 100).toFixed(1)}%`);
    console.log('');

    // Sample pincodes
    console.log('📋 Sample Pincodes (first 10):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const samplePincodes = await pincodesCollection.find()
      .limit(10)
      .toArray();
    
    for (const pin of samplePincodes) {
      const city = await db.collection('cities').findOne({ _id: pin.cityId });
      console.log(`📍 ${pin.pincode} | Area: ${pin.area || '(blank)'} | City: ${city?.name || 'N/A'}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Check Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

checkPincodeCounts();

