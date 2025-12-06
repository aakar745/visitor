/**
 * Process Uttarakhand PIN codes for import
 * Extracts State, City, Pincode WITH Area field
 * 
 * Usage: node process-uttarakhand.js
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class UttarakhandProcessor {
  constructor() {
    this.rawDir = './data/raw';
    this.processedDir = './data/processed';
    this.outputDir = './data/output/excel';
    
    this.states = new Map();
    this.cities = new Map();
    this.pincodes = new Map();
  }

  async process() {
    console.log(chalk.blue.bold('\n🔄 Processing Uttarakhand Data\n'));
    console.log(chalk.gray('━'.repeat(60)));

    // Load all Uttarakhand raw data files
    const rawFiles = await this.loadRawData();
    
    if (rawFiles.length === 0) {
      console.log(chalk.red('\n❌ No Uttarakhand data found!'));
      console.log(chalk.yellow('👉 Run: node fetch-uttarakhand.js first\n'));
      return;
    }

    console.log(chalk.cyan(`📂 Found ${rawFiles.length} raw data file(s)`));

    // Process data
    this.extractData(rawFiles);

    // Save processed data
    await this.saveData();

    // Export to CSV (ready for import)
    await this.exportToCSV();

    this.showSummary();
  }

  async loadRawData() {
    const files = await fs.readdir(this.rawDir);
    const uttarakhandFiles = files.filter(f => f.startsWith('uttarakhand-'));
    
    const allData = [];
    for (const file of uttarakhandFiles) {
      const data = await fs.readJson(path.join(this.rawDir, file));
      allData.push(...data);
    }
    
    return allData;
  }

  extractData(rawData) {
    console.log(chalk.cyan(`\n🔍 Extracting data...`));

    for (const pincodeData of rawData) {
      const { pincode, postOffices } = pincodeData;

      for (const po of postOffices) {
        const countryName = po.country || 'India';
        const stateName = po.state;
        const cityName = po.city;
        const areaName = po.name || '';
        const stateCode = this.generateStateCode(stateName);

        // Add state
        if (!this.states.has(stateName)) {
          this.states.set(stateName, {
            name: stateName,
            code: stateCode,
            country: countryName,
          });
        }

        // Add city
        const cityKey = `${stateName}|${cityName}`;
        if (!this.cities.has(cityKey)) {
          this.cities.set(cityKey, {
            name: cityName,
            state: stateName,
          });
        }

        // Add pincode WITH area (each post office is a separate entry)
        const pincodeKey = `${pincode}|${areaName}`;
        if (!this.pincodes.has(pincodeKey)) {
          this.pincodes.set(pincodeKey, {
            pincode,
            area: areaName,
            city: cityName,
            state: stateName,
            country: countryName,
          });
        }
      }
    }

    console.log(chalk.green(`✅ Extracted:`));
    console.log(chalk.white(`   • States: ${this.states.size}`));
    console.log(chalk.white(`   • Cities: ${this.cities.size}`));
    console.log(chalk.white(`   • Pincodes: ${this.pincodes.size}`));
    
    // Show city breakdown
    console.log(chalk.cyan(`\n📍 Cities found:`));
    const cityList = Array.from(this.cities.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    cityList.forEach(city => {
      const pincodeCount = Array.from(this.pincodes.values())
        .filter(p => p.city === city.name).length;
      console.log(chalk.white(`   • ${city.name}: ${pincodeCount} pincodes`));
    });
  }

  generateStateCode(stateName) {
    const codes = {
      'Gujarat': 'GJ',
      'Rajasthan': 'RJ',
      'Maharashtra': 'MH',
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chhattisgarh': 'CG',
      'Goa': 'GA',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Madhya Pradesh': 'MP',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OR',
      'Punjab': 'PB',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UK',
      'Delhi': 'DL',
      'West Bengal': 'WB',
    };
    
    return codes[stateName] || stateName.substring(0, 2).toUpperCase();
  }

  async saveData() {
    console.log(chalk.cyan(`\n💾 Saving processed data...`));

    await fs.ensureDir(this.processedDir);

    // Save as JSON
    await fs.writeJson(
      path.join(this.processedDir, 'uttarakhand-states.json'),
      Array.from(this.states.values()),
      { spaces: 2 }
    );

    await fs.writeJson(
      path.join(this.processedDir, 'uttarakhand-cities.json'),
      Array.from(this.cities.values()),
      { spaces: 2 }
    );

    await fs.writeJson(
      path.join(this.processedDir, 'uttarakhand-pincodes.json'),
      Array.from(this.pincodes.values()),
      { spaces: 2 }
    );

    console.log(chalk.green(`✅ Saved JSON files`));
  }

  async exportToCSV() {
    console.log(chalk.cyan(`\n📊 Exporting to CSV...`));

    await fs.ensureDir(this.outputDir);

    // Export for bulk import (Country, CountryCode, State, StateCode, City, Pincode, Area)
    const csvRows = [
      'Country,Country Code,State,State Code,City,Pincode,Area' // Headers
    ];

    for (const pincode of this.pincodes.values()) {
      const state = this.states.get(pincode.state);
      // Escape area name for CSV (handle commas and quotes)
      const escapedArea = pincode.area ? `"${pincode.area.replace(/"/g, '""')}"` : '';
      csvRows.push(
        `India,IN,${pincode.state},${state.code},${pincode.city},${pincode.pincode},${escapedArea}`
      );
    }

    const csvContent = csvRows.join('\n');
    await fs.writeFile(
      path.join(this.outputDir, 'uttarakhand-bulk-import.csv'),
      csvContent,
      'utf8'
    );

    console.log(chalk.green(`✅ Exported: uttarakhand-bulk-import.csv`));
  }

  showSummary() {
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Processing Complete!\n'));
    console.log(chalk.green('✅ Files created:'));
    console.log(chalk.white('   • data/processed/uttarakhand-states.json'));
    console.log(chalk.white('   • data/processed/uttarakhand-cities.json'));
    console.log(chalk.white('   • data/processed/uttarakhand-pincodes.json'));
    console.log(chalk.cyan('\n📋 Ready for import:'));
    console.log(chalk.white('   • data/output/excel/uttarakhand-bulk-import.csv'));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Next: Import uttarakhand-bulk-import.csv via Admin Panel\n'));
    console.log(chalk.cyan('📝 Note: Area field included for each post office\n'));
  }
}

// Run processor
const processor = new UttarakhandProcessor();
processor.process().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

