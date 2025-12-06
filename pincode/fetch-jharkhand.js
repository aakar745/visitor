/**
 * Fetch Jharkhand PIN codes specifically
 * Quick fetch for Jharkhand state only
 * 
 * Usage: node fetch-jharkhand.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class JharkhandFetcher {
  constructor() {
    // ALL Jharkhand PIN code ranges (complete coverage)
    this.jharkhandRanges = [
      { start: 814001, end: 814999 },  // Dumka, Deoghar, Godda
      { start: 815001, end: 815999 },  // Jamtara, Sahibganj, Pakur
      { start: 816001, end: 816999 },  // Dhanbad, Bokaro (part)
      { start: 822001, end: 822999 },  // Palamau, Garhwa, Latehar
      { start: 823001, end: 823999 },  // Hazaribagh, Chatra, Koderma
      { start: 825001, end: 825999 },  // Giridih, Jamui
      { start: 826001, end: 826999 },  // Bokaro, Ramgarh
      { start: 827001, end: 827999 },  // Dhanbad Rural
      { start: 828001, end: 828999 },  // Bokaro Steel City area
      { start: 829001, end: 829999 },  // Lohardaga, Gumla, Simdega
      { start: 831001, end: 831999 },  // Jamshedpur (Tatanagar), East Singhbhum
      { start: 832001, end: 832999 },  // Seraikela-Kharsawan, West Singhbhum
      { start: 833001, end: 833999 },  // Chaibasa, West Singhbhum
      { start: 834001, end: 834999 },  // Ranchi (Capital)
      { start: 835001, end: 835999 },  // Ranchi Rural, Khunti
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.jharkhandRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Jharkhand PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 24 districts of Jharkhand`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.jharkhandRanges) {
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
    const filename = path.join('./data/raw', `jharkhand-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-jharkhand.js\n'));
  }
}

// Run fetcher
const fetcher = new JharkhandFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

