/**
 * Fetch Tamil Nadu PIN codes specifically
 * Quick fetch for Tamil Nadu state only
 * 
 * Usage: node fetch-tamil-nadu.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class TamilNaduFetcher {
  constructor() {
    // ALL Tamil Nadu PIN code ranges (complete coverage)
    this.tamilNaduRanges = [
      { start: 600001, end: 600999 },  // Chennai (Madras)
      { start: 601001, end: 601999 },  // Chennai Suburbs, Kanchipuram
      { start: 602001, end: 602999 },  // Tiruvallur, Chennai Rural
      { start: 603001, end: 603999 },  // Kanchipuram, Chengalpattu
      { start: 604001, end: 604999 },  // Villupuram, Cuddalore
      { start: 605001, end: 605999 },  // Puducherry (UT), Cuddalore
      { start: 606001, end: 606999 },  // Cuddalore, Villupuram
      { start: 607001, end: 607999 },  // Cuddalore, Perambalur
      { start: 608001, end: 608999 },  // Thanjavur, Tiruvarur
      { start: 609001, end: 609999 },  // Nagapattinam, Karaikal
      { start: 610001, end: 610999 },  // Tiruchirappalli (Trichy)
      { start: 611001, end: 611999 },  // Thanjavur, Pudukkottai
      { start: 612001, end: 612999 },  // Thanjavur, Ariyalur
      { start: 613001, end: 613999 },  // Thanjavur, Pudukkottai
      { start: 614001, end: 614999 },  // Pudukkottai, Sivaganga
      { start: 620001, end: 620999 },  // Tiruchirappalli, Karur
      { start: 621001, end: 621999 },  // Tiruchirappalli, Perambalur, Ariyalur
      { start: 622001, end: 622999 },  // Pudukkottai, Sivaganga
      { start: 623001, end: 623999 },  // Ramanathapuram, Sivaganga
      { start: 624001, end: 624999 },  // Dindigul, Madurai
      { start: 625001, end: 625999 },  // Madurai
      { start: 626001, end: 626999 },  // Virudhunagar, Ramanathapuram
      { start: 627001, end: 627999 },  // Tirunelveli, Thoothukudi (Tuticorin)
      { start: 628001, end: 628999 },  // Thoothukudi, Tirunelveli
      { start: 629001, end: 629999 },  // Kanyakumari
      { start: 630001, end: 630999 },  // Karur, Namakkal
      { start: 631001, end: 631999 },  // Krishnagiri, Vellore
      { start: 632001, end: 632999 },  // Vellore, Tiruvannamalai
      { start: 633001, end: 633999 },  // Vellore, Tirupattur
      { start: 635001, end: 635999 },  // Krishnagiri, Dharmapuri
      { start: 636001, end: 636999 },  // Salem, Namakkal
      { start: 637001, end: 637999 },  // Namakkal, Salem
      { start: 638001, end: 638999 },  // Erode, Karur
      { start: 639001, end: 639999 },  // Karur, Dindigul
      { start: 641001, end: 641999 },  // Coimbatore
      { start: 642001, end: 642999 },  // Coimbatore, Tiruppur
      { start: 643001, end: 643999 },  // Nilgiris (Ooty)
      { start: 644001, end: 644999 },  // Tiruppur, Erode
      { start: 645001, end: 645999 },  // Theni, Dindigul
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.tamilNaduRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Tamil Nadu PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 38 districts of Tamil Nadu`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.tamilNaduRanges) {
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
    const filename = path.join('./data/raw', `tamil-nadu-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-tamil-nadu.js\n'));
  }
}

// Run fetcher
const fetcher = new TamilNaduFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

