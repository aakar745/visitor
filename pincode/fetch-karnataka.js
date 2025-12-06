/**
 * Fetch Karnataka PIN codes specifically
 * Quick fetch for Karnataka state only
 * 
 * Usage: node fetch-karnataka.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class KarnatakaFetcher {
  constructor() {
    // ALL Karnataka PIN code ranges (complete coverage)
    this.karnatakaRanges = [
      { start: 560001, end: 560999 },  // Bangalore (Bengaluru) Urban
      { start: 561001, end: 561999 },  // Bangalore Rural, Chikkaballapura
      { start: 562001, end: 562999 },  // Bangalore Rural, Tumkur
      { start: 563001, end: 563999 },  // Kolar, Chikkaballapura
      { start: 571001, end: 571999 },  // Mysore (Mysuru), Mandya
      { start: 572001, end: 572999 },  // Tumkur, Chitradurga
      { start: 573001, end: 573999 },  // Hassan, Kodagu (Coorg)
      { start: 574001, end: 574999 },  // Dakshina Kannada (Mangalore), Udupi
      { start: 575001, end: 575999 },  // Dakshina Kannada, Udupi, Kasaragod
      { start: 576001, end: 576999 },  // Udupi, Dakshina Kannada
      { start: 577001, end: 577999 },  // Davangere, Chitradurga, Shimoga
      { start: 581001, end: 581999 },  // Haveri, Uttara Kannada
      { start: 582001, end: 582999 },  // Gadag, Koppal
      { start: 583001, end: 583999 },  // Bellary (Ballari), Raichur
      { start: 584001, end: 584999 },  // Raichur, Koppal
      { start: 585001, end: 585999 },  // Bijapur (Vijayapura), Bagalkot
      { start: 586001, end: 586999 },  // Bijapur, Bagalkot
      { start: 587001, end: 587999 },  // Gulbarga (Kalaburagi), Bidar
      { start: 590001, end: 590999 },  // Belgaum (Belagavi), Dharwad
      { start: 591001, end: 591999 },  // Belgaum, Dharwad, Uttara Kannada
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.karnatakaRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Karnataka PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 31 districts of Karnataka`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.karnatakaRanges) {
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
    const filename = path.join('./data/raw', `karnataka-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-karnataka.js\n'));
  }
}

// Run fetcher
const fetcher = new KarnatakaFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

