/**
 * Fetch Gujarat PIN codes specifically
 * Quick fetch for Gujarat state only (380001-382490)
 * 
 * Usage: node fetch-gujarat.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class GujaratFetcher {
  constructor() {
    // ALL Gujarat PIN code ranges (complete coverage)
    this.gujaratRanges = [
      { start: 360001, end: 360999 },  // Porbandar, Jamnagar
      { start: 361001, end: 361999 },  // Jamnagar
      { start: 362001, end: 362999 },  // Junagadh
      { start: 363001, end: 363999 },  // Surendranagar
      { start: 364001, end: 364999 },  // Bhavnagar
      { start: 365001, end: 365999 },  // Amreli
      { start: 370001, end: 370999 },  // Kutch (Bhuj)
      { start: 380001, end: 380999 },  // Ahmedabad
      { start: 381001, end: 381999 },  // Ahmedabad Rural
      { start: 382001, end: 382999 },  // Gandhinagar
      { start: 383001, end: 383999 },  // Sabarkantha
      { start: 384001, end: 384999 },  // Mehsana
      { start: 385001, end: 385999 },  // Banaskantha
      { start: 387001, end: 387999 },  // Kheda
      { start: 388001, end: 388999 },  // Anand
      { start: 389001, end: 389999 },  // Panchmahal
      { start: 390001, end: 390999 },  // Vadodara
      { start: 391001, end: 391999 },  // Vadodara Rural
      { start: 392001, end: 392999 },  // Bharuch
      { start: 393001, end: 393999 },  // Narmada
      { start: 394001, end: 394999 },  // Surat
      { start: 395001, end: 395999 },  // Surat Rural
      { start: 396001, end: 396999 },  // Valsad, Dang
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.gujaratRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Gujarat PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 33 districts of Gujarat`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.gujaratRanges) {
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
    const filename = path.join('./data/raw', `gujarat-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-gujarat.js\n'));
  }
}

// Run fetcher
const fetcher = new GujaratFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

