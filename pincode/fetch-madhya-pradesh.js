/**
 * Fetch Madhya Pradesh PIN codes specifically
 * Quick fetch for Madhya Pradesh state only
 * 
 * Usage: node fetch-madhya-pradesh.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class MadhyaPradeshFetcher {
  constructor() {
    // ALL Madhya Pradesh PIN code ranges (complete coverage)
    this.madhyaPradeshRanges = [
      { start: 450001, end: 450999 },  // Indore
      { start: 451001, end: 451999 },  // Indore Rural, Dhar
      { start: 452001, end: 452999 },  // Indore, Dewas
      { start: 453001, end: 453999 },  // Indore Rural, Dhar
      { start: 454001, end: 454999 },  // Dhar, Jhabua
      { start: 455001, end: 455999 },  // Dewas, Shajapur
      { start: 456001, end: 456999 },  // Ujjain, Ratlam
      { start: 457001, end: 457999 },  // Ratlam, Mandsaur
      { start: 458001, end: 458999 },  // Mandsaur, Neemuch
      { start: 460001, end: 460999 },  // Bhopal
      { start: 461001, end: 461999 },  // Bhopal Rural, Sehore
      { start: 462001, end: 462999 },  // Bhopal, Raisen
      { start: 464001, end: 464999 },  // Vidisha, Raisen
      { start: 465001, end: 465999 },  // Rajgarh, Shajapur
      { start: 466001, end: 466999 },  // Sehore, Hoshangabad
      { start: 470001, end: 470999 },  // Guna, Ashok Nagar
      { start: 471001, end: 471999 },  // Chhatarpur, Tikamgarh
      { start: 472001, end: 472999 },  // Tikamgarh, Chhatarpur
      { start: 473001, end: 473999 },  // Shivpuri, Guna
      { start: 474001, end: 474999 },  // Gwalior
      { start: 475001, end: 475999 },  // Gwalior Rural, Bhind
      { start: 476001, end: 476999 },  // Morena, Bhind
      { start: 477001, end: 477999 },  // Bhind, Morena
      { start: 480001, end: 480999 },  // Jabalpur
      { start: 481001, end: 481999 },  // Jabalpur Rural, Mandla
      { start: 482001, end: 482999 },  // Jabalpur, Seoni
      { start: 483001, end: 483999 },  // Katni, Umaria
      { start: 484001, end: 484999 },  // Shahdol, Anuppur
      { start: 485001, end: 485999 },  // Satna, Rewa
      { start: 486001, end: 486999 },  // Rewa, Sidhi
      { start: 487001, end: 487999 },  // Sidhi, Singrauli
      { start: 488001, end: 488999 },  // Panna, Chhatarpur
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.madhyaPradeshRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Madhya Pradesh PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 52 districts of Madhya Pradesh`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.madhyaPradeshRanges) {
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
    const filename = path.join('./data/raw', `madhya-pradesh-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-madhya-pradesh.js\n'));
  }
}

// Run fetcher
const fetcher = new MadhyaPradeshFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

