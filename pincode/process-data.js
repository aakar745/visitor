/**
 * Data Processor
 * Processes raw postal data and organizes it into countries, states, cities, and pincodes
 * 
 * Usage: npm run process
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

class DataProcessor {
  constructor() {
    this.config = config;
    this.rawData = [];
    this.processed = {
      countries: new Map(),
      states: new Map(),
      cities: new Map(),
      pincodes: [],
    };
  }

  async loadRawData() {
    console.log(chalk.cyan('📂 Loading raw data files...'));
    
    const rawDir = this.config.paths.raw;
    const files = await fs.readdir(rawDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const data = await fs.readJson(path.join(rawDir, file));
      this.rawData.push(...data);
    }

    console.log(chalk.green(`✅ Loaded ${this.rawData.length.toLocaleString()} records from ${jsonFiles.length} files`));
  }

  generateStateCode(stateName) {
    const codeMap = {
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chhattisgarh': 'CG',
      'Goa': 'GA',
      'Gujarat': 'GJ',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Madhya Pradesh': 'MP',
      'Maharashtra': 'MH',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OR',
      'Punjab': 'PB',
      'Rajasthan': 'RJ',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UK',
      'West Bengal': 'WB',
      'Andaman and Nicobar Islands': 'AN',
      'Chandigarh': 'CH',
      'Dadra and Nagar Haveli and Daman and Diu': 'DH',
      'Dadra and Nagar Haveli': 'DN',  // Legacy code
      'Daman and Diu': 'DD',            // Legacy code
      'Delhi': 'DL',
      'Jammu and Kashmir': 'JK',
      'Ladakh': 'LA',
      'Lakshadweep': 'LD',
      'Puducherry': 'PY',
    };

    return codeMap[stateName] || stateName.substring(0, 2).toUpperCase();
  }

  normalizeStateName(state) {
    const nameMap = {
      'GUJARAT': 'Gujarat',
      'MAHARASHTRA': 'Maharashtra',
      'TAMIL NADU': 'Tamil Nadu',
      'TAMILNADU': 'Tamil Nadu',
      'WEST BENGAL': 'West Bengal',
      'UTTAR PRADESH': 'Uttar Pradesh',
      'ANDHRA PRADESH': 'Andhra Pradesh',
      'MADHYA PRADESH': 'Madhya Pradesh',
      'HIMACHAL PRADESH': 'Himachal Pradesh',
      'ARUNACHAL PRADESH': 'Arunachal Pradesh',
      'JAMMU & KASHMIR': 'Jammu and Kashmir',
      'JAMMU AND KASHMIR': 'Jammu and Kashmir',
    };

    const upperState = state.toUpperCase();
    return nameMap[upperState] || state
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  normalizeCityName(city) {
    return city
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async process() {
    console.log(chalk.blue.bold('\n🔄 Processing Postal Data\n'));
    console.log(chalk.gray('━'.repeat(60)));

    await this.loadRawData();

    console.log(chalk.cyan('\n📊 Extracting unique entities...'));

    // Process each record
    for (const record of this.rawData) {
      for (const postOffice of record.data) {
        // Extract country
        const countryName = postOffice.Country || 'India';
        if (!this.processed.countries.has(countryName)) {
          this.processed.countries.set(countryName, {
            name: countryName,
            code: 'IN',
            isActive: true,
          });
        }

        // Extract state
        const stateName = this.normalizeStateName(postOffice.State);
        const stateKey = stateName.toLowerCase();
        if (!this.processed.states.has(stateKey)) {
          this.processed.states.set(stateKey, {
            name: stateName,
            code: this.generateStateCode(stateName),
            country: countryName,
            isActive: true,
          });
        }

        // Extract city (using District as city)
        const cityName = this.normalizeCityName(postOffice.District);
        const cityKey = `${stateKey}-${cityName.toLowerCase()}`;
        if (!this.processed.cities.has(cityKey)) {
          this.processed.cities.set(cityKey, {
            name: cityName,
            state: stateName,
            isActive: true,
          });
        }

        // Add pincode
        this.processed.pincodes.push({
          pincode: postOffice.Pincode,
          area: postOffice.Name,
          city: cityName,
          state: stateName,
          country: countryName,
          branchType: postOffice.BranchType,
          deliveryStatus: postOffice.DeliveryStatus,
          isActive: true,
        });
      }
    }

    console.log(chalk.green(`✅ Countries: ${this.processed.countries.size}`));
    console.log(chalk.green(`✅ States: ${this.processed.states.size}`));
    console.log(chalk.green(`✅ Cities: ${this.processed.cities.size}`));
    console.log(chalk.green(`✅ PIN Codes: ${this.processed.pincodes.length.toLocaleString()}`));

    await this.saveProcessedData();
    this.showSummary();
  }

  async saveProcessedData() {
    console.log(chalk.cyan('\n💾 Saving processed data...'));

    const processedDir = this.config.paths.processed;

    // Save countries
    await fs.writeJson(
      path.join(processedDir, 'countries.json'),
      Array.from(this.processed.countries.values()),
      { spaces: 2 }
    );

    // Save states
    await fs.writeJson(
      path.join(processedDir, 'states.json'),
      Array.from(this.processed.states.values()),
      { spaces: 2 }
    );

    // Save cities
    await fs.writeJson(
      path.join(processedDir, 'cities.json'),
      Array.from(this.processed.cities.values()),
      { spaces: 2 }
    );

    // Save pincodes
    await fs.writeJson(
      path.join(processedDir, 'pincodes.json'),
      this.processed.pincodes,
      { spaces: 2 }
    );

    console.log(chalk.green('✅ All data saved successfully!'));
  }

  showSummary() {
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Processing Summary\n'));
    console.log(chalk.cyan(`📁 Output directory: ${this.config.paths.processed}`));
    console.log(chalk.green(`\n✅ Files created:`));
    console.log(chalk.white(`   • countries.json (${this.processed.countries.size} records)`));
    console.log(chalk.white(`   • states.json (${this.processed.states.size} records)`));
    console.log(chalk.white(`   • cities.json (${this.processed.cities.size} records)`));
    console.log(chalk.white(`   • pincodes.json (${this.processed.pincodes.length.toLocaleString()} records)`));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Processing complete! Run "npm run import" to import to database.\n'));
  }
}

// Run processor
const processor = new DataProcessor();
processor.process().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

