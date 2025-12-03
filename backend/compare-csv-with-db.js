/**
 * Compare CSV file with database to find what's missing
 * Usage: node compare-csv-with-db.js /path/to/your/file.csv
 */

const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'visitor_management';

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Error: Please provide CSV file path');
  console.log('Usage: node compare-csv-with-db.js /path/to/your/file.csv');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

async function compareCSVWithDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DATABASE,
    });
    console.log('✅ Connected!\n');

    // Read and parse CSV
    console.log(`📄 Reading CSV: ${csvFilePath}`);
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.trim().split(/\r?\n/);
    
    console.log(`📊 Total lines: ${lines.length}`);
    console.log(`📋 Header: ${lines[0]}`);
    console.log('');

    // Parse CSV (same logic as frontend)
    const csvSplitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(csvSplitRegex).map((v) => {
        v = v.trim();
        if (v.startsWith('"') && v.endsWith('"')) {
          return v.substring(1, v.length - 1).replace(/""/g, '"');
        }
        return v;
      });
      
      if (values.length >= 7) {
        data.push({
          country: values[0] || '',
          countryCode: values[1] || '',
          state: values[2] || '',
          stateCode: values[3] || '',
          city: values[4] || '',
          pincode: values[5] || '',
          area: values[6] || '',
        });
      }
    }

    console.log(`✅ Parsed ${data.length} records from CSV\n`);

    // Get database models
    const db = mongoose.connection.db;
    const pincodesCollection = db.collection('pincodes');
    const citiesCollection = db.collection('cities');
    const statesCollection = db.collection('states');
    const countriesCollection = db.collection('countries');

    // Check each record
    console.log('🔍 Checking which records exist in database...\n');
    
    let existsInDB = 0;
    let missingFromDB = 0;
    const missing = [];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      // Find city
      const state = await statesCollection.findOne({ code: record.stateCode.toUpperCase() });
      if (!state) {
        missing.push({ ...record, reason: 'State not found' });
        missingFromDB++;
        continue;
      }
      
      const city = await citiesCollection.findOne({ 
        name: new RegExp(`^${record.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        stateId: state._id
      });
      
      if (!city) {
        missing.push({ ...record, reason: 'City not found' });
        missingFromDB++;
        continue;
      }
      
      // Check if pincode+city+area combination exists
      const existingPincode = await pincodesCollection.findOne({
        pincode: record.pincode,
        cityId: city._id,
        area: record.area.trim(),
      });
      
      if (existingPincode) {
        existsInDB++;
      } else {
        missing.push({ ...record, reason: 'Pincode+Area combination not found', cityFound: true });
        missingFromDB++;
      }
      
      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${i + 1}/${data.length} checked...`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 COMPARISON RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Total records in CSV: ${data.length}`);
    console.log(`✅ Already in database: ${existsInDB} (${((existsInDB / data.length) * 100).toFixed(1)}%)`);
    console.log(`❌ Missing from database: ${missingFromDB} (${((missingFromDB / data.length) * 100).toFixed(1)}%)`);
    console.log('');

    if (missing.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 MISSING RECORDS (showing first 20 of ${missing.length})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      missing.slice(0, 20).forEach((item, index) => {
        console.log(`\n${index + 1}. PIN: ${item.pincode} | Area: "${item.area}" | City: ${item.city}`);
        console.log(`   Reason: ${item.reason}`);
      });
      
      if (missing.length > 20) {
        console.log(`\n... and ${missing.length - 20} more missing records`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Comparison Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

compareCSVWithDB();

