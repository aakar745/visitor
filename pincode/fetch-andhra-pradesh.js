/**
 * Fetch Andhra Pradesh PIN codes specifically
 * Quick fetch for Andhra Pradesh state only
 * 
 * Usage: node fetch-andhra-pradesh.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class AndhraPradeshFetcher {
  constructor() {
    // ALL Andhra Pradesh PIN code ranges (complete coverage - post-Telangana split)
    this.andhraPradeshRanges = [
      { start: 500001, end: 500999 },  // Hyderabad (shared/border)
      { start: 501001, end: 501999 },  // Rangareddy (border areas)
      { start: 502001, end: 502999 },  // Medak (border areas)
      { start: 503001, end: 503999 },  // Nizamabad (border areas)
      { start: 504001, end: 504999 },  // Adilabad (border areas)
      { start: 505001, end: 505999 },  // Karimnagar (border areas)
      { start: 506001, end: 506999 },  // Warangal (border areas)
      { start: 507001, end: 507999 },  // Khammam
      { start: 508001, end: 508999 },  // Nalgonda
      { start: 509001, end: 509999 },  // Mahabubnagar (border areas)
      { start: 515001, end: 515999 },  // Anantapur
      { start: 516001, end: 516999 },  // Kadapa (Cuddapah)
      { start: 517001, end: 517999 },  // Chittoor
      { start: 518001, end: 518999 },  // Kurnool
      { start: 520001, end: 520999 },  // Krishna, Vijayawada
      { start: 521001, end: 521999 },  // Guntur
      { start: 522001, end: 522999 },  // Prakasam, Ongole
      { start: 523001, end: 523999 },  // Prakasam
      { start: 524001, end: 524999 },  // Nellore
      { start: 525001, end: 525999 },  // Vizianagaram
      { start: 530001, end: 530999 },  // Visakhapatnam
      { start: 531001, end: 531999 },  // East Godavari, Kakinada
      { start: 532001, end: 532999 },  // Srikakulam
      { start: 533001, end: 533999 },  // East Godavari
      { start: 534001, end: 534999 },  // West Godavari
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.andhraPradeshRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Andhra Pradesh PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 13 districts of Andhra Pradesh`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a complete fetch. Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.andhraPradeshRanges) {
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
    const filename = path.join('./data/raw', `andhra-pradesh-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-andhra-pradesh.js\n'));
  }
}

// Run fetcher
const fetcher = new AndhraPradeshFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

