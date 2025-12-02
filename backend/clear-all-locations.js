const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'visitor_management';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function clearAllLocations() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Get counts
    const pincodeCount = await db.collection('pincodes').countDocuments();
    const cityCount = await db.collection('cities').countDocuments();
    const stateCount = await db.collection('states').countDocuments();
    const countryCount = await db.collection('countries').countDocuments();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  WARNING: This will DELETE ALL location data!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n  • ${pincodeCount} pincodes`);
    console.log(`  • ${cityCount} cities`);
    console.log(`  • ${stateCount} states`);
    console.log(`  • ${countryCount} countries\n`);

    const answer = await ask('Type "DELETE ALL" to confirm (or anything else to cancel): ');

    if (answer.trim() !== 'DELETE ALL') {
      console.log('\n❌ Operation cancelled.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n🗑️  Deleting all location data...\n');

    // Delete in reverse order (pincodes -> cities -> states -> countries)
    const pincodeResult = await db.collection('pincodes').deleteMany({});
    console.log(`  ✅ Deleted ${pincodeResult.deletedCount} pincodes`);

    const cityResult = await db.collection('cities').deleteMany({});
    console.log(`  ✅ Deleted ${cityResult.deletedCount} cities`);

    const stateResult = await db.collection('states').deleteMany({});
    console.log(`  ✅ Deleted ${stateResult.deletedCount} states`);

    const countryResult = await db.collection('countries').deleteMany({});
    console.log(`  ✅ Deleted ${countryResult.deletedCount} countries`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All location data has been cleared!');
    console.log('   You can now import the full Gujarat dataset.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

clearAllLocations();

