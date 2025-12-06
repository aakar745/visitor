/**
 * Fetch West Bengal PIN codes specifically
 * Quick fetch for West Bengal state only
 * 
 * Usage: node fetch-west-bengal.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class WestBengalFetcher {
  constructor() {
    // ALL West Bengal PIN code ranges (complete coverage)
    this.westBengalRanges = [
      { start: 700001, end: 700999 },  // Kolkata (Capital)
      { start: 711001, end: 711999 },  // Howrah, Hooghly
      { start: 712001, end: 712999 },  // Hooghly, Purba Bardhaman
      { start: 713001, end: 713999 },  // Purba Bardhaman, Paschim Bardhaman
      { start: 721001, end: 721999 },  // Paschim Medinipur, Jhargram
      { start: 722001, end: 722999 },  // Paschim Medinipur, Bankura
      { start: 723001, end: 723999 },  // Bankura, Purulia
      { start: 731001, end: 731999 },  // Birbhum, Murshidabad
      { start: 732001, end: 732999 },  // Malda, Dakshin Dinajpur
      { start: 733001, end: 733999 },  // Darjeeling, Jalpaiguri
      { start: 734001, end: 734999 },  // Darjeeling, Kalimpong
      { start: 735001, end: 735999 },  // Jalpaiguri, Alipurduar
      { start: 736001, end: 736999 },  // Cooch Behar, Alipurduar
      { start: 741001, end: 741999 },  // Nadia, Murshidabad
      { start: 742001, end: 742999 },  // Murshidabad
      { start: 743001, end: 743999 },  // North 24 Parganas
      { start: 744001, end: 744999 },  // North 24 Parganas, South 24 Parganas
      { start: 751001, end: 751999 },  // Purba Medinipur (shares some with Odisha)
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.westBengalRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL West Bengal PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 23 districts of West Bengal`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a LARGE fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.westBengalRanges) {
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
    const filename = path.join('./data/raw', `west-bengal-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-west-bengal.js\n'));
  }
}

// Run fetcher
const fetcher = new WestBengalFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

