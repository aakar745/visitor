/**
 * Fetch Punjab PIN codes specifically
 * Quick fetch for Punjab state only
 * 
 * Usage: node fetch-punjab.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class PunjabFetcher {
  constructor() {
    // ALL Punjab PIN code ranges (complete coverage)
    this.punjabRanges = [
      { start: 140001, end: 140999 },  // Patiala, Fatehgarh Sahib
      { start: 141001, end: 141999 },  // Ludhiana
      { start: 142001, end: 142999 },  // Moga, Faridkot, Firozpur
      { start: 143001, end: 143999 },  // Amritsar, Tarn Taran
      { start: 144001, end: 144999 },  // Jalandhar, Kapurthala
      { start: 145001, end: 145999 },  // Hoshiarpur, Nawanshahr (Shahid Bhagat Singh Nagar)
      { start: 146001, end: 146999 },  // Hoshiarpur, Ropar (Rupnagar)
      { start: 147001, end: 147999 },  // Patiala, Sangrur, Barnala
      { start: 148001, end: 148999 },  // Sangrur, Mansa
      { start: 151001, end: 151999 },  // Bathinda, Mansa
      { start: 152001, end: 152999 },  // Firozpur, Fazilka, Muktsar
      { start: 153001, end: 153999 },  // Gurdaspur, Pathankot
      { start: 160001, end: 160999 },  // Chandigarh (shared with Haryana/UT)
      { start: 161001, end: 161999 },  // Patiala, Mohali (SAS Nagar)
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.punjabRanges.reduce((sum, range) => 
      sum + (range.end - range.start + 1), 0
    );
    
    this.stats = {
      total: this.totalPins,
      fetched: 0,
      valid: 0,
      invalid: 0,
      errors: 0,
      startTime: Date.now(),
    };

    this.data = [];
    this.limiter = pLimit(60); // 60 requests per minute
    
    this.progressBar = new cliProgress.SingleBar({
      format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} | Valid: {valid} | ETA: {eta_formatted}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
    });

    this.setupDirectories();
  }

  setupDirectories() {
    fs.ensureDirSync('./data/raw');
    fs.ensureDirSync('./data/processed');
    fs.ensureDirSync('./logs');
  }

  async fetchPincode(pincode) {
    const url = `https://api.postalpincode.in/pincode/${pincode}`;
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data[0];
      
      if (data.Status === 'Success' && data.PostOffice && data.PostOffice.length > 0) {
        this.stats.valid++;
        return {
          pincode,
          postOffices: data.PostOffice.map(po => ({
            name: po.Name,
            city: po.District,
            state: po.State,
            country: po.Country,
          })),
        };
      } else {
        this.stats.invalid++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      return null;
    }
  }

  async fetch() {
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Punjab PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 23 districts of Punjab`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.punjabRanges) {
      for (let pin = range.start; pin <= range.end; pin++) {
        tasks.push(
          this.limiter(async () => {
            const result = await this.fetchPincode(pin);
            if (result) {
              this.data.push(result);
            }
            this.stats.fetched++;
            this.progressBar.update(this.stats.fetched, { valid: this.stats.valid });
            
            // Save progress every 500 pincodes (more frequent saves)
            if (this.stats.fetched % 500 === 0) {
              await this.saveData();
            }
          })
        );
      }
    }

    await Promise.all(tasks);
    this.progressBar.stop();

    await this.saveData();
    this.showSummary();
  }

  async saveData() {
    const filename = path.join('./data/raw', `punjab-${Date.now()}.json`);
    await fs.writeJson(filename, this.data, { spaces: 2 });
  }

  showSummary() {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Fetch Complete!\n'));
    console.log(chalk.green(`✅ Valid PIN codes:   ${this.stats.valid}`));
    console.log(chalk.yellow(`⚠️  Invalid PIN codes: ${this.stats.invalid}`));
    console.log(chalk.red(`❌ Errors:            ${this.stats.errors}`));
    console.log(chalk.cyan(`⏱️  Time elapsed:     ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Next step: node process-punjab.js\n'));
  }
}

// Run fetcher
const fetcher = new PunjabFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

