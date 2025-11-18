/**
 * Export to Excel Script
 * Converts processed JSON data to Excel-compatible CSV files
 * 
 * Usage: npm run export
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

class ExcelExporter {
  constructor() {
    this.config = config;
    this.outputDir = this.config.paths.excel;
  }

  async export() {
    console.log(chalk.blue.bold('\n📊 Exporting to Excel Format\n'));
    console.log(chalk.gray('━'.repeat(60)));

    // Create output directory
    await fs.ensureDir(this.outputDir);

    try {
      // Export each data type
      await this.exportCountries();
      await this.exportStates();
      await this.exportCities();
      await this.exportPincodes();

      this.showSummary();
    } catch (error) {
      console.error(chalk.red('\n❌ Export failed:'), error.message);
      process.exit(1);
    }
  }

  async exportCountries() {
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'countries.json')
    );

    const csv = this.convertToCSV(data, ['name', 'code', 'isActive']);
    const filename = path.join(this.outputDir, 'countries.csv');
    
    await fs.writeFile(filename, csv, 'utf8');
    console.log(chalk.green(`✅ Exported countries.csv (${data.length} records)`));
  }

  async exportStates() {
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'states.json')
    );

    const csv = this.convertToCSV(data, ['name', 'code', 'country', 'isActive']);
    const filename = path.join(this.outputDir, 'states.csv');
    
    await fs.writeFile(filename, csv, 'utf8');
    console.log(chalk.green(`✅ Exported states.csv (${data.length} records)`));
  }

  async exportCities() {
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'cities.json')
    );

    const csv = this.convertToCSV(data, ['name', 'state', 'isActive']);
    const filename = path.join(this.outputDir, 'cities.csv');
    
    await fs.writeFile(filename, csv, 'utf8');
    console.log(chalk.green(`✅ Exported cities.csv (${data.length} records)`));
  }

  async exportPincodes() {
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'pincodes.json')
    );

    const csv = this.convertToCSV(data, [
      'pincode',
      'area',
      'city',
      'state',
      'country',
      'branchType',
      'deliveryStatus',
      'isActive'
    ]);
    const filename = path.join(this.outputDir, 'pincodes.csv');
    
    await fs.writeFile(filename, csv, 'utf8');
    console.log(chalk.green(`✅ Exported pincodes.csv (${data.length} records)`));
  }

  convertToCSV(data, columns) {
    // Create header row
    const header = columns.join(',');
    
    // Create data rows
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col] || '';
        
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',');
    });

    // Combine header and rows
    return [header, ...rows].join('\n');
  }

  showSummary() {
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Export Summary\n'));
    console.log(chalk.cyan(`📁 Output directory: ${this.outputDir}`));
    console.log(chalk.green(`\n✅ Files created:`));
    console.log(chalk.white(`   • countries.csv`));
    console.log(chalk.white(`   • states.csv`));
    console.log(chalk.white(`   • cities.csv`));
    console.log(chalk.white(`   • pincodes.csv`));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Export complete! Open CSV files in Excel.\n'));
    console.log(chalk.cyan(`📂 Location: ${this.outputDir}\n`));
  }
}

// Run exporter
const exporter = new ExcelExporter();
exporter.export().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

