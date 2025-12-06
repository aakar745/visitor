/**
 * Fetch Bihar PIN codes specifically
 * Quick fetch for Bihar state only
 * 
 * Usage: node fetch-bihar.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class BiharFetcher {
  constructor() {
    // ALL Bihar PIN code ranges (complete coverage)
    this.biharRanges = [
      { start: 800001, end: 800999 },  // Patna
      { start: 801001, end: 801999 },  // Patna Rural, Nalanda
      { start: 802001, end: 802999 },  // Bhojpur, Buxar
      { start: 803001, end: 803999 },  // Nalanda, Nawada
      { start: 804001, end: 804999 },  // Gaya, Jehanabad
      { start: 805001, end: 805999 },  // Nawada, Jamui
      { start: 811001, end: 811999 },  // Munger, Lakhisarai
      { start: 812001, end: 812999 },  // Bhagalpur, Banka
      { start: 813001, end: 813999 },  // Bhagalpur Rural
      { start: 814001, end: 814999 },  // Dumka, Godda (Jharkhand border)
      { start: 821001, end: 821999 },  // Rohtas, Kaimur
      { start: 823001, end: 823999 },  // Gaya Rural, Aurangabad
      { start: 824001, end: 824999 },  // Aurangabad, Arwal
      { start: 841001, end: 841999 },  // Saran, Chapra
      { start: 842001, end: 842999 },  // Siwan, Gopalganj
      { start: 843001, end: 843999 },  // Muzaffarpur, Vaishali
      { start: 844001, end: 844999 },  // East Champaran, Motihari
      { start: 845001, end: 845999 },  // West Champaran, Bettiah
      { start: 846001, end: 846999 },  // Darbhanga, Madhubani
      { start: 847001, end: 847999 },  // Madhubani, Supaul
      { start: 848001, end: 848999 },  // Samastipur, Begusarai
      { start: 851001, end: 851999 },  // Saharsa, Madhepura
      { start: 852001, end: 852999 },  // Madhepura, Supaul
      { start: 853001, end: 853999 },  // Araria, Kishanganj
      { start: 854001, end: 854999 },  // Purnia, Katihar
      { start: 855001, end: 855999 },  // Kishanganj, Araria
      { start: 856001, end: 856999 },  // Katihar, Purnia Rural
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.biharRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Bihar PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 38 districts of Bihar`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.biharRanges) {
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
    const filename = path.join('./data/raw', `bihar-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-bihar.js\n'));
  }
}

// Run fetcher
const fetcher = new BiharFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

