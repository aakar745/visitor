/**
 * Test Data Integrity
 * Validates fetched and processed pincode data for errors
 * 
 * Usage: node test-data-integrity.js
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class DataIntegrityTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalPincodes: 0,
      validPincodes: 0,
      invalidPincodes: 0,
      duplicates: 0,
      missingFields: 0,
    };
    // File paths (set during testFilesExist)
    this.statesFile = null;
    this.citiesFile = null;
    this.pincodesFile = null;
  }

  async test() {
    console.log(chalk.blue.bold('\n🧪 Data Integrity Test\n'));
    console.log(chalk.gray('━'.repeat(60)));

    try {
      // Test 1: Check if processed files exist
      await this.testFilesExist();

      // Test 2: Validate processed data
      await this.validateProcessedData();

      // Test 3: Check for duplicates
      await this.checkDuplicates();

      // Test 4: Validate pincode format
      await this.validatePincodeFormat();

      // Test 5: Check data relationships
      await this.checkRelationships();

      this.showSummary();
    } catch (error) {
      console.error(chalk.red('\n❌ Test failed:'), error.message);
      process.exit(1);
    }
  }

  async testFilesExist() {
    console.log(chalk.cyan('\n📂 Test 1: Checking if processed files exist...'));

    // Check for state-specific files first, then generic files
    const stateFiles = {
      gujarat: [
        'data/processed/gujarat-states.json',
        'data/processed/gujarat-cities.json',
        'data/processed/gujarat-pincodes.json',
      ],
      rajasthan: [
        'data/processed/rajasthan-states.json',
        'data/processed/rajasthan-cities.json',
        'data/processed/rajasthan-pincodes.json',
      ],
      maharashtra: [
        'data/processed/maharashtra-states.json',
        'data/processed/maharashtra-cities.json',
        'data/processed/maharashtra-pincodes.json',
      ],
      'andhra-pradesh': [
        'data/processed/andhra-pradesh-states.json',
        'data/processed/andhra-pradesh-cities.json',
        'data/processed/andhra-pradesh-pincodes.json',
      ],
      'arunachal-pradesh': [
        'data/processed/arunachal-pradesh-states.json',
        'data/processed/arunachal-pradesh-cities.json',
        'data/processed/arunachal-pradesh-pincodes.json',
      ],
      assam: [
        'data/processed/assam-states.json',
        'data/processed/assam-cities.json',
        'data/processed/assam-pincodes.json',
      ],
      bihar: [
        'data/processed/bihar-states.json',
        'data/processed/bihar-cities.json',
        'data/processed/bihar-pincodes.json',
      ],
      chhattisgarh: [
        'data/processed/chhattisgarh-states.json',
        'data/processed/chhattisgarh-cities.json',
        'data/processed/chhattisgarh-pincodes.json',
      ],
      goa: [
        'data/processed/goa-states.json',
        'data/processed/goa-cities.json',
        'data/processed/goa-pincodes.json',
      ],
      haryana: [
        'data/processed/haryana-states.json',
        'data/processed/haryana-cities.json',
        'data/processed/haryana-pincodes.json',
      ],
      'himachal-pradesh': [
        'data/processed/himachal-pradesh-states.json',
        'data/processed/himachal-pradesh-cities.json',
        'data/processed/himachal-pradesh-pincodes.json',
      ],
      jharkhand: [
        'data/processed/jharkhand-states.json',
        'data/processed/jharkhand-cities.json',
        'data/processed/jharkhand-pincodes.json',
      ],
      karnataka: [
        'data/processed/karnataka-states.json',
        'data/processed/karnataka-cities.json',
        'data/processed/karnataka-pincodes.json',
      ],
      kerala: [
        'data/processed/kerala-states.json',
        'data/processed/kerala-cities.json',
        'data/processed/kerala-pincodes.json',
      ],
      'madhya-pradesh': [
        'data/processed/madhya-pradesh-states.json',
        'data/processed/madhya-pradesh-cities.json',
        'data/processed/madhya-pradesh-pincodes.json',
      ],
      manipur: [
        'data/processed/manipur-states.json',
        'data/processed/manipur-cities.json',
        'data/processed/manipur-pincodes.json',
      ],
      meghalaya: [
        'data/processed/meghalaya-states.json',
        'data/processed/meghalaya-cities.json',
        'data/processed/meghalaya-pincodes.json',
      ],
      mizoram: [
        'data/processed/mizoram-states.json',
        'data/processed/mizoram-cities.json',
        'data/processed/mizoram-pincodes.json',
      ],
      nagaland: [
        'data/processed/nagaland-states.json',
        'data/processed/nagaland-cities.json',
        'data/processed/nagaland-pincodes.json',
      ],
      odisha: [
        'data/processed/odisha-states.json',
        'data/processed/odisha-cities.json',
        'data/processed/odisha-pincodes.json',
      ],
      punjab: [
        'data/processed/punjab-states.json',
        'data/processed/punjab-cities.json',
        'data/processed/punjab-pincodes.json',
      ],
      sikkim: [
        'data/processed/sikkim-states.json',
        'data/processed/sikkim-cities.json',
        'data/processed/sikkim-pincodes.json',
      ],
      'tamil-nadu': [
        'data/processed/tamil-nadu-states.json',
        'data/processed/tamil-nadu-cities.json',
        'data/processed/tamil-nadu-pincodes.json',
      ],
      telangana: [
        'data/processed/telangana-states.json',
        'data/processed/telangana-cities.json',
        'data/processed/telangana-pincodes.json',
      ],
      tripura: [
        'data/processed/tripura-states.json',
        'data/processed/tripura-cities.json',
        'data/processed/tripura-pincodes.json',
      ],
      'uttar-pradesh': [
        'data/processed/uttar-pradesh-states.json',
        'data/processed/uttar-pradesh-cities.json',
        'data/processed/uttar-pradesh-pincodes.json',
      ],
      'uttarakhand': [
        'data/processed/uttarakhand-states.json',
        'data/processed/uttarakhand-cities.json',
        'data/processed/uttarakhand-pincodes.json',
      ],
      'west-bengal': [
        'data/processed/west-bengal-states.json',
        'data/processed/west-bengal-cities.json',
        'data/processed/west-bengal-pincodes.json',
      ],
    };

    const genericFiles = [
      'data/processed/states.json',
      'data/processed/cities.json',
      'data/processed/pincodes.json',
    ];

    // Try state-specific files first
    let filesFound = 0;
    let foundState = null;
    
    for (const [state, files] of Object.entries(stateFiles)) {
      let stateFilesFound = 0;
      for (const file of files) {
        if (await fs.pathExists(file)) {
          stateFilesFound++;
        }
      }
      
      if (stateFilesFound === 3) {
        // Found complete set for this state
        for (const file of files) {
          console.log(chalk.green(`   ✅ ${file}`));
        }
        filesFound = stateFilesFound;
        foundState = state;
        this.statesFile = files[0];
        this.citiesFile = files[1];
        this.pincodesFile = files[2];
        console.log(chalk.cyan(`   📍 Using ${state.charAt(0).toUpperCase() + state.slice(1)}-specific files`));
        break; // Use first complete set found
      }
    }

    // If no state-specific files, try generic files
    if (filesFound === 0) {
      for (const file of genericFiles) {
        if (await fs.pathExists(file)) {
          console.log(chalk.green(`   ✅ ${file}`));
          filesFound++;
        } else {
          this.errors.push(`Missing file: ${file}`);
          console.log(chalk.red(`   ❌ ${file}`));
        }
      }
      
      if (filesFound === 3) {
        this.statesFile = genericFiles[0];
        this.citiesFile = genericFiles[1];
        this.pincodesFile = genericFiles[2];
        console.log(chalk.cyan(`   📍 Using generic files`));
      }
    }

    if (filesFound === 0 || this.errors.length > 0) {
      throw new Error('Required files missing. Run state-specific process command (e.g., "npm run process:gujarat") or "npm run process" first.');
    }
  }

  async validateProcessedData() {
    console.log(chalk.cyan('\n📋 Test 2: Validating processed data...'));

    const pincodes = await fs.readJson(this.pincodesFile);
    this.stats.totalPincodes = pincodes.length;

    console.log(chalk.white(`   Total pincodes: ${this.stats.totalPincodes.toLocaleString()}`));

    for (const pincode of pincodes) {
      // Check required fields
      if (!pincode.pincode) {
        this.stats.missingFields++;
        this.errors.push(`Pincode missing 'pincode' field`);
      }
      if (!pincode.city) {
        this.stats.missingFields++;
        this.errors.push(`Pincode ${pincode.pincode} missing 'city' field`);
      }
      if (!pincode.state) {
        this.stats.missingFields++;
        this.errors.push(`Pincode ${pincode.pincode} missing 'state' field`);
      }
      if (!pincode.country) {
        this.stats.missingFields++;
        this.errors.push(`Pincode ${pincode.pincode} missing 'country' field`);
      }

      // Count valid pincodes
      if (pincode.pincode && pincode.city && pincode.state && pincode.country) {
        this.stats.validPincodes++;
      } else {
        this.stats.invalidPincodes++;
      }
    }

    if (this.stats.missingFields === 0) {
      console.log(chalk.green(`   ✅ All pincodes have required fields`));
    } else {
      console.log(chalk.red(`   ❌ Found ${this.stats.missingFields} missing fields`));
    }
  }

  async checkDuplicates() {
    console.log(chalk.cyan('\n🔍 Test 3: Checking for duplicates...'));

    const pincodes = await fs.readJson(this.pincodesFile);
    const seen = new Set();
    const duplicates = new Set();

    for (const pincode of pincodes) {
      const key = `${pincode.pincode}|${pincode.area || ''}`;
      if (seen.has(key)) {
        duplicates.add(key);
        this.stats.duplicates++;
      }
      seen.add(key);
    }

    if (this.stats.duplicates === 0) {
      console.log(chalk.green(`   ✅ No duplicates found`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Found ${this.stats.duplicates} duplicates`));
      this.warnings.push(`${this.stats.duplicates} duplicate pincode+area combinations`);
      
      // Show first 5 duplicates
      console.log(chalk.gray(`   First 5 duplicates:`));
      Array.from(duplicates).slice(0, 5).forEach(dup => {
        console.log(chalk.gray(`     • ${dup}`));
      });
    }
  }

  async validatePincodeFormat() {
    console.log(chalk.cyan('\n🔢 Test 4: Validating pincode format...'));

    const pincodes = await fs.readJson(this.pincodesFile);
    const invalidFormats = [];

    for (const pincode of pincodes) {
      if (pincode.pincode) {
        // Check if pincode is 6 digits
        if (!/^\d{6}$/.test(pincode.pincode)) {
          invalidFormats.push(pincode.pincode);
        }
      }
    }

    if (invalidFormats.length === 0) {
      console.log(chalk.green(`   ✅ All pincodes are 6 digits`));
    } else {
      console.log(chalk.red(`   ❌ Found ${invalidFormats.length} invalid formats`));
      this.errors.push(`${invalidFormats.length} pincodes with invalid format`);
      
      // Show first 5 invalid
      console.log(chalk.gray(`   First 5 invalid:`));
      invalidFormats.slice(0, 5).forEach(pin => {
        console.log(chalk.gray(`     • ${pin}`));
      });
    }
  }

  async checkRelationships() {
    console.log(chalk.cyan('\n🔗 Test 5: Checking data relationships...'));

    const states = await fs.readJson(this.statesFile);
    const cities = await fs.readJson(this.citiesFile);
    const pincodes = await fs.readJson(this.pincodesFile);

    // Extract unique state names from cities and pincodes
    const stateNames = new Set(states.map(s => s.name));
    const cityStateNames = new Set(cities.map(c => c.state));
    const pincodeStateNames = new Set(pincodes.map(p => p.state));

    // Check if all city states exist in states
    const orphanCityStates = Array.from(cityStateNames).filter(s => !stateNames.has(s));
    if (orphanCityStates.length === 0) {
      console.log(chalk.green(`   ✅ All cities have valid state references`));
    } else {
      console.log(chalk.red(`   ❌ Found ${orphanCityStates.length} cities with invalid state references`));
      this.errors.push(`${orphanCityStates.length} orphan city states`);
    }

    // Check if all pincode states exist in states
    const orphanPincodeStates = Array.from(pincodeStateNames).filter(s => !stateNames.has(s));
    if (orphanPincodeStates.length === 0) {
      console.log(chalk.green(`   ✅ All pincodes have valid state references`));
    } else {
      console.log(chalk.red(`   ❌ Found ${orphanPincodeStates.length} pincodes with invalid state references`));
      this.errors.push(`${orphanPincodeStates.length} orphan pincode states`);
    }

    // Check if all pincode cities exist in cities
    const cityNames = new Set(cities.map(c => c.name));
    const orphanPincodeCities = [];
    for (const pincode of pincodes) {
      if (!cityNames.has(pincode.city)) {
        orphanPincodeCities.push(pincode.city);
      }
    }
    const uniqueOrphanCities = [...new Set(orphanPincodeCities)];

    if (uniqueOrphanCities.length === 0) {
      console.log(chalk.green(`   ✅ All pincodes have valid city references`));
    } else {
      console.log(chalk.red(`   ❌ Found ${uniqueOrphanCities.length} pincodes with invalid city references`));
      this.errors.push(`${uniqueOrphanCities.length} orphan pincode cities`);
      
      // Show first 5 orphan cities
      console.log(chalk.gray(`   First 5 orphan cities:`));
      uniqueOrphanCities.slice(0, 5).forEach(city => {
        console.log(chalk.gray(`     • ${city}`));
      });
    }
  }

  showSummary() {
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Test Summary\n'));

    // Stats
    console.log(chalk.cyan('Statistics:'));
    console.log(chalk.white(`   Total pincodes:   ${this.stats.totalPincodes.toLocaleString()}`));
    console.log(chalk.white(`   Valid pincodes:   ${this.stats.validPincodes.toLocaleString()}`));
    if (this.stats.invalidPincodes > 0) {
      console.log(chalk.red(`   Invalid pincodes: ${this.stats.invalidPincodes}`));
    }
    if (this.stats.duplicates > 0) {
      console.log(chalk.yellow(`   Duplicates:       ${this.stats.duplicates}`));
    }

    // Errors
    console.log(chalk.cyan('\nErrors:'));
    if (this.errors.length === 0) {
      console.log(chalk.green(`   ✅ No errors found!`));
    } else {
      console.log(chalk.red(`   ❌ Found ${this.errors.length} error(s):`));
      this.errors.slice(0, 10).forEach(error => {
        console.log(chalk.red(`      • ${error}`));
      });
      if (this.errors.length > 10) {
        console.log(chalk.gray(`      ... and ${this.errors.length - 10} more`));
      }
    }

    // Warnings
    console.log(chalk.cyan('\nWarnings:'));
    if (this.warnings.length === 0) {
      console.log(chalk.green(`   ✅ No warnings!`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Found ${this.warnings.length} warning(s):`));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`      • ${warning}`));
      });
    }

    // Final verdict
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green.bold('\n✅ ALL TESTS PASSED! Data is ready for import.\n'));
    } else if (this.errors.length === 0) {
      console.log(chalk.yellow.bold('\n⚠️  TESTS PASSED WITH WARNINGS. Data can be imported but may need review.\n'));
    } else {
      console.log(chalk.red.bold('\n❌ TESTS FAILED! Fix errors before importing.\n'));
      process.exit(1);
    }
  }
}

// Run tests
const tester = new DataIntegrityTester();
tester.test().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

