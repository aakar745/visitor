/**
 * Fetch Rajasthan PIN codes specifically
 * Quick fetch for Rajasthan state only
 * 
 * Usage: node fetch-rajasthan.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class RajasthanFetcher {
  constructor() {
    // ALL Rajasthan PIN code ranges (complete coverage)
    this.rajasthanRanges = [
      { start: 301001, end: 301999 },  // Alwar
      { start: 302001, end: 302999 },  // Jaipur
      { start: 303001, end: 303999 },  // Jaipur Rural, Dausa
      { start: 304001, end: 304999 },  // Tonk
      { start: 305001, end: 305999 },  // Ajmer
      { start: 306001, end: 306999 },  // Pali
      { start: 307001, end: 307999 },  // Sirohi
      { start: 311001, end: 311999 },  // Bhilwara
      { start: 312001, end: 312999 },  // Chittorgarh
      { start: 313001, end: 313999 },  // Udaipur
      { start: 314001, end: 314999 },  // Dungarpur, Banswara
      { start: 321001, end: 321999 },  // Bharatpur
      { start: 322001, end: 322999 },  // Sawai Madhopur
      { start: 323001, end: 323999 },  // Bundi, Kota
      { start: 324001, end: 324999 },  // Kota, Jhalawar
      { start: 325001, end: 325999 },  // Baran
      { start: 326001, end: 326999 },  // Jhalawar
      { start: 327001, end: 327999 },  // Banswara, Pratapgarh
      { start: 328001, end: 328999 },  // Dholpur
      { start: 331001, end: 331999 },  // Churu
      { start: 332001, end: 332999 },  // Sikar
      { start: 333001, end: 333999 },  // Jhunjhunu
      { start: 334001, end: 334999 },  // Bikaner
      { start: 335001, end: 335999 },  // Hanumangarh, Ganganagar
      { start: 341001, end: 341999 },  // Nagaur
      { start: 342001, end: 342999 },  // Jodhpur
      { start: 343001, end: 343999 },  // Jalor
      { start: 344001, end: 344999 },  // Barmer
      { start: 345001, end: 345999 },  // Jaisalmer
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.rajasthanRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Rajasthan PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 33 districts of Rajasthan`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.rajasthanRanges) {
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
    const filename = path.join('./data/raw', `rajasthan-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-rajasthan.js\n'));
  }
}

// Run fetcher
const fetcher = new RajasthanFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

