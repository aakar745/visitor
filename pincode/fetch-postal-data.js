/**
 * India Postal Data Fetcher
 * Fetches PIN code data from India Post API
 * 
 * Usage:
 *   npm run fetch                    # Start from beginning
 *   npm run fetch:resume             # Resume from last progress
 *   npm run fetch -- --start=110001  # Fetch specific range
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const cliProgress = require('cli-progress');
const chalk = require('chalk');
const config = require('./config');

class PostalDataFetcher {
  constructor(options = {}) {
    this.config = config;
    this.startPin = options.start || config.pincode.start;
    this.endPin = options.end || config.pincode.end;
    this.resume = options.resume || false;
    
    // Statistics
    this.stats = {
      total: 0,
      fetched: 0,
      valid: 0,
      invalid: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Progress
    this.progress = {
      lastProcessedPIN: this.startPin - 1,
      data: [],
    };

    // Rate limiter
    this.limiter = pLimit(config.api.rateLimitPerMinute);
    
    // Progress bar
    this.progressBar = new cliProgress.SingleBar({
      format: chalk.cyan('{bar}') + ' | {percentage}% | {value}/{total} | Speed: {speed} req/min | ETA: {eta_formatted} | Current: {current}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    this.setupDirectories();
  }

  setupDirectories() {
    fs.ensureDirSync(this.config.paths.output);
    fs.ensureDirSync(this.config.paths.raw);
    fs.ensureDirSync(this.config.paths.processed);
    fs.ensureDirSync(this.config.paths.logs);
  }

  async loadProgress() {
    try {
      if (this.resume && fs.existsSync(this.config.paths.progress)) {
        this.progress = await fs.readJson(this.config.paths.progress);
        console.log(chalk.yellow(`📂 Resuming from PIN: ${this.progress.lastProcessedPIN}`));
        return true;
      }
    } catch (error) {
      console.log(chalk.red('❌ Failed to load progress, starting fresh'));
    }
    return false;
  }

  async saveProgress() {
    try {
      await fs.writeJson(this.config.paths.progress, {
        lastProcessedPIN: this.progress.lastProcessedPIN,
        stats: this.stats,
        timestamp: new Date().toISOString(),
      }, { spaces: 2 });
    } catch (error) {
      console.error(chalk.red('❌ Failed to save progress:'), error.message);
    }
  }

  async fetchPincode(pincode) {
    const url = `${this.config.api.baseUrl}/${pincode}`;
    
    for (let attempt = 1; attempt <= this.config.api.maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: this.config.api.timeoutMs,
        });

        const data = response.data[0];
        
        if (data.Status === 'Success' && data.PostOffice && data.PostOffice.length > 0) {
          this.stats.valid++;
          return {
            pincode,
            status: 'valid',
            data: data.PostOffice,
          };
        } else {
          this.stats.invalid++;
          return {
            pincode,
            status: 'invalid',
            message: data.Message || 'No post office found',
          };
        }
      } catch (error) {
        if (attempt === this.config.api.maxRetries) {
          this.stats.errors++;
          this.logError(pincode, error.message);
          return {
            pincode,
            status: 'error',
            message: error.message,
          };
        }
        
        // Wait before retry
        await this.sleep(this.config.api.retryDelayMs * attempt);
      }
    }
  }

  async fetchBatch(pincodes) {
    const promises = pincodes.map(pincode =>
      this.limiter(() => this.fetchPincode(pincode))
    );

    return Promise.all(promises);
  }

  async run() {
    console.log(chalk.blue.bold('\n📮 India Postal Data Fetcher\n'));
    console.log(chalk.gray('━'.repeat(60)));
    
    // Load progress if resuming
    await this.loadProgress();

    // Generate PIN code list
    const startFrom = this.resume ? this.progress.lastProcessedPIN + 1 : this.startPin;
    const pincodes = [];
    
    for (let pin = startFrom; pin <= this.endPin; pin++) {
      pincodes.push(String(pin).padStart(6, '0'));
    }

    this.stats.total = pincodes.length;
    
    console.log(chalk.cyan(`📊 Total PIN codes to fetch: ${this.stats.total.toLocaleString()}`));
    console.log(chalk.cyan(`🎯 Range: ${pincodes[0]} → ${pincodes[pincodes.length - 1]}`));
    console.log(chalk.cyan(`⚡ Rate limit: ${this.config.api.rateLimitPerMinute} requests/minute`));
    console.log(chalk.cyan(`⏱️  Estimated time: ${Math.ceil(this.stats.total / this.config.api.rateLimitPerMinute)} minutes\n`));

    // Start progress bar
    this.progressBar.start(this.stats.total, 0, {
      speed: 0,
      current: pincodes[0],
    });

    // Process in batches
    const batchSize = this.config.api.rateLimitPerMinute;
    let allResults = [];

    for (let i = 0; i < pincodes.length; i += batchSize) {
      const batch = pincodes.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      // Fetch batch
      const results = await this.fetchBatch(batch);
      allResults.push(...results.filter(r => r.status === 'valid'));

      // Update stats
      this.stats.fetched += batch.length;
      this.progress.lastProcessedPIN = parseInt(batch[batch.length - 1]);

      // Calculate speed
      const elapsed = (Date.now() - this.stats.startTime) / 1000 / 60; // minutes
      const speed = Math.round(this.stats.fetched / elapsed);

      // Update progress bar
      this.progressBar.update(this.stats.fetched, {
        speed,
        current: batch[batch.length - 1],
      });

      // Save progress periodically
      if (this.stats.fetched % this.config.batch.saveProgressEvery === 0) {
        await this.saveProgress();
        await this.saveRawData(allResults);
        allResults = []; // Clear memory
      }

      // Rate limiting - wait 60 seconds between batches
      const batchDuration = Date.now() - batchStartTime;
      const waitTime = Math.max(0, 60000 - batchDuration); // Ensure 1 minute per batch
      
      if (waitTime > 0 && i + batchSize < pincodes.length) {
        await this.sleep(waitTime);
      }
    }

    // Stop progress bar
    this.progressBar.stop();

    // Save final results
    await this.saveRawData(allResults);
    await this.saveProgress();

    // Show summary
    this.showSummary();
  }

  async saveRawData(results) {
    if (results.length === 0) return;

    const timestamp = Date.now();
    const filename = `raw-${timestamp}.json`;
    const filepath = path.join(this.config.paths.raw, filename);

    try {
      await fs.writeJson(filepath, results, { spaces: 2 });
      console.log(chalk.green(`\n💾 Saved ${results.length} records to ${filename}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save raw data:'), error.message);
    }
  }

  logError(pincode, message) {
    const logFile = path.join(this.config.paths.logs, `errors-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${new Date().toISOString()} | PIN: ${pincode} | ${message}\n`;
    fs.appendFileSync(logFile, logEntry);
  }

  showSummary() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);

    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Fetch Summary\n'));
    console.log(chalk.green(`✅ Total fetched:     ${this.stats.fetched.toLocaleString()}`));
    console.log(chalk.green(`✅ Valid PIN codes:   ${this.stats.valid.toLocaleString()}`));
    console.log(chalk.yellow(`⚠️  Invalid PIN codes: ${this.stats.invalid.toLocaleString()}`));
    console.log(chalk.red(`❌ Errors:            ${this.stats.errors.toLocaleString()}`));
    console.log(chalk.cyan(`⏱️  Time elapsed:     ${minutes}m ${seconds}s`));
    console.log(chalk.cyan(`⚡ Average speed:     ${Math.round(this.stats.fetched / (elapsed / 60))} req/min`));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Fetch complete! Run "npm run process" to process the data.\n'));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Run fetcher
const fetcher = new PostalDataFetcher({
  start: args.start ? parseInt(args.start) : undefined,
  end: args.end ? parseInt(args.end) : undefined,
  resume: args.resume || false,
});

fetcher.run().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

