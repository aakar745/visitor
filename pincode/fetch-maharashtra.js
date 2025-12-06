/**
 * Fetch Maharashtra PIN codes specifically
 * Quick fetch for Maharashtra state only
 * 
 * Usage: node fetch-maharashtra.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class MaharashtraFetcher {
  constructor() {
    // ALL Maharashtra PIN code ranges (complete coverage)
    this.maharashtraRanges = [
      { start: 400001, end: 400999 },  // Mumbai City
      { start: 401001, end: 401999 },  // Mumbai Suburban, Thane
      { start: 402001, end: 402999 },  // Raigad
      { start: 403001, end: 403999 },  // Sindhudurg, Goa border
      { start: 410001, end: 410999 },  // Pune
      { start: 411001, end: 411999 },  // Pune City
      { start: 412001, end: 412999 },  // Pune Rural
      { start: 413001, end: 413999 },  // Solapur
      { start: 414001, end: 414999 },  // Ahmednagar
      { start: 415001, end: 415999 },  // Satara
      { start: 416001, end: 416999 },  // Sangli
      { start: 421001, end: 421999 },  // Thane
      { start: 422001, end: 422999 },  // Nashik
      { start: 423001, end: 423999 },  // Nashik Rural
      { start: 424001, end: 424999 },  // Dhule, Nandurbar
      { start: 425001, end: 425999 },  // Jalgaon
      { start: 431001, end: 431999 },  // Aurangabad
      { start: 441001, end: 441999 },  // Nagpur
      { start: 442001, end: 442999 },  // Wardha
      { start: 443001, end: 443999 },  // Buldhana
      { start: 444001, end: 444999 },  // Akola, Washim
      { start: 445001, end: 445999 },  // Yavatmal
      { start: 446001, end: 446999 },  // Amravati
      { start: 451001, end: 451999 },  // Bhandara
      { start: 452001, end: 452999 },  // Indore (border area)
      { start: 461001, end: 461999 },  // Betul (border area)
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.maharashtraRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Maharashtra PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 36 districts of Maharashtra`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.maharashtraRanges) {
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
    const filename = path.join('./data/raw', `maharashtra-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-maharashtra.js\n'));
  }
}

// Run fetcher
const fetcher = new MaharashtraFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

