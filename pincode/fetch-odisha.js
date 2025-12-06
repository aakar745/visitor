/**
 * Fetch Odisha PIN codes specifically
 * Quick fetch for Odisha state only
 * 
 * Usage: node fetch-odisha.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class OdishaFetcher {
  constructor() {
    // ALL Odisha PIN code ranges (complete coverage)
    this.odishaRanges = [
      { start: 750001, end: 750999 },  // Cuttack, Jagatsinghpur
      { start: 751001, end: 751999 },  // Bhubaneswar (Capital), Khordha
      { start: 752001, end: 752999 },  // Puri, Nayagarh
      { start: 753001, end: 753999 },  // Cuttack Rural, Jajapur, Kendrapara
      { start: 754001, end: 754999 },  // Cuttack, Kendrapara, Jajapur
      { start: 755001, end: 755999 },  // Jajapur, Kendujhar (Keonjhar)
      { start: 756001, end: 756999 },  // Bhadrak, Balasore
      { start: 757001, end: 757999 },  // Balasore, Mayurbhanj
      { start: 758001, end: 758999 },  // Kendujhar (Keonjhar)
      { start: 759001, end: 759999 },  // Dhenkanal, Angul
      { start: 760001, end: 760999 },  // Balangir, Bargarh
      { start: 761001, end: 761999 },  // Ganjam, Gajapati
      { start: 762001, end: 762999 },  // Kalahandi, Nuapada
      { start: 763001, end: 763999 },  // Phulbani (Kandhamal), Boudh
      { start: 764001, end: 764999 },  // Koraput, Nabarangpur
      { start: 765001, end: 765999 },  // Rayagada, Kalahandi
      { start: 766001, end: 766999 },  // Malkangiri, Koraput
      { start: 767001, end: 767999 },  // Balangir, Sonepur
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.odishaRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Odisha PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 30 districts of Odisha`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.odishaRanges) {
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
    const filename = path.join('./data/raw', `odisha-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-odisha.js\n'));
  }
}

// Run fetcher
const fetcher = new OdishaFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

