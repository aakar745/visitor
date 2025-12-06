/**
 * Fetch Uttar Pradesh PIN codes specifically
 * Quick fetch for Uttar Pradesh state only
 * 
 * Usage: node fetch-uttar-pradesh.js
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class UttarPradeshFetcher {
  constructor() {
    // ALL Uttar Pradesh PIN code ranges (complete coverage)
    this.uttarPradeshRanges = [
      { start: 201001, end: 201999 },  // Ghaziabad, Gautam Buddha Nagar (Noida)
      { start: 202001, end: 202999 },  // Aligarh, Hathras
      { start: 203001, end: 203999 },  // Bulandshahr, Gautam Buddha Nagar
      { start: 204001, end: 204999 },  // Hathras, Mathura
      { start: 205001, end: 205999 },  // Mainpuri, Etah
      { start: 206001, end: 206999 },  // Etawah, Auraiya
      { start: 207001, end: 207999 },  // Etah, Kasganj
      { start: 208001, end: 208999 },  // Kanpur Nagar, Kanpur Dehat
      { start: 209001, end: 209999 },  // Kanpur Rural, Farrukhabad
      { start: 210001, end: 210999 },  // Banda, Chitrakoot, Mahoba
      { start: 211001, end: 211999 },  // Allahabad (Prayagraj)
      { start: 212001, end: 212999 },  // Allahabad Rural, Fatehpur
      { start: 221001, end: 221999 },  // Varanasi (Banaras)
      { start: 222001, end: 222999 },  // Jaunpur, Sultanpur
      { start: 223001, end: 223999 },  // Azamgarh, Mau
      { start: 224001, end: 224999 },  // Ambedkar Nagar, Faizabad (Ayodhya)
      { start: 225001, end: 225999 },  // Barabanki, Raebareli
      { start: 226001, end: 226999 },  // Lucknow (Capital)
      { start: 227001, end: 227999 },  // Lucknow Rural, Unnao
      { start: 228001, end: 228999 },  // Sultanpur, Amethi
      { start: 229001, end: 229999 },  // Raebareli, Pratapgarh
      { start: 230001, end: 230999 },  // Pratapgarh, Kaushambi
      { start: 231001, end: 231999 },  // Mirzapur, Sonbhadra
      { start: 232001, end: 232999 },  // Sant Ravidas Nagar, Chandauli
      { start: 233001, end: 233999 },  // Ghazipur, Ballia
      { start: 234001, end: 234999 },  // Jhansi, Lalitpur
      { start: 241001, end: 241999 },  // Meerut, Baghpat
      { start: 242001, end: 242999 },  // Sambhal, Moradabad
      { start: 243001, end: 243999 },  // Bareilly, Budaun
      { start: 244001, end: 244999 },  // Moradabad, Rampur
      { start: 245001, end: 245999 },  // Hapur, Ghaziabad Rural
      { start: 246001, end: 246999 },  // Bijnor, Amroha
      { start: 247001, end: 247999 },  // Saharanpur, Shamli
      { start: 248001, end: 248999 },  // Dehradun (shares with Uttarakhand)
      { start: 249001, end: 249999 },  // Muzaffarnagar, Shamli
      { start: 250001, end: 250999 },  // Meerut Rural
      { start: 251001, end: 251999 },  // Muzaffarnagar, Shamli
      { start: 261001, end: 261999 },  // Sitapur, Hardoi
      { start: 262001, end: 262999 },  // Pilibhit, Shahjahanpur
      { start: 263001, end: 263999 },  // Lakhimpur Kheri
      { start: 271001, end: 271999 },  // Gonda, Bahraich
      { start: 272001, end: 272999 },  // Siddharthnagar, Basti
      { start: 273001, end: 273999 },  // Gorakhpur, Deoria
      { start: 274001, end: 274999 },  // Kushinagar, Deoria
      { start: 275001, end: 275999 },  // Maharajganj, Sant Kabir Nagar
      { start: 276001, end: 276999 },  // Azamgarh, Mau
      { start: 277001, end: 277999 },  // Ballia
      { start: 281001, end: 281999 },  // Mathura, Agra
      { start: 282001, end: 282999 },  // Agra
      { start: 283001, end: 283999 },  // Agra Rural, Firozabad
      { start: 284001, end: 284999 },  // Jhansi, Jalaun
      { start: 285001, end: 285999 },  // Hamirpur, Jalaun
    ];
    
    // Calculate total PINs to fetch
    this.totalPins = this.uttarPradeshRanges.reduce((sum, range) => 
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
    console.log(chalk.blue.bold('\n🚀 Fetching ALL Uttar Pradesh PIN Codes (Complete)\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.cyan(`📍 Districts: All 75 districts of Uttar Pradesh`));
    console.log(chalk.cyan(`📊 Total PINs to check: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Estimated time: ~${Math.ceil(this.stats.total / 60)} minutes (~${(this.stats.total / 60 / 60).toFixed(1)} hours)\n`));
    console.log(chalk.yellow(`⚠️  This is a MASSIVE fetch - LARGEST STATE! Press Ctrl+C to cancel.\n`));

    this.progressBar.start(this.stats.total, 0, { valid: 0 });

    const tasks = [];
    
    // Fetch all ranges
    for (const range of this.uttarPradeshRanges) {
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
    const filename = path.join('./data/raw', `uttar-pradesh-${Date.now()}.json`);
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
    console.log(chalk.green('\n✨ Next step: node process-uttar-pradesh.js\n'));
  }
}

// Run fetcher
const fetcher = new UttarPradeshFetcher();
fetcher.fetch().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

