/**
 * Import processed pincode data to MongoDB
 * Imports Countries, States, Cities, and Pincodes in correct order
 * 
 * Usage: npm run import
 */

const fs = require('fs-extra');
const path = require('path');
const { MongoClient } = require('mongodb');
const chalk = require('chalk');
const config = require('./config');

class DatabaseImporter {
  constructor() {
    this.config = config;
    this.client = null;
    this.db = null;
    
    this.stats = {
      countries: { inserted: 0, updated: 0, skipped: 0 },
      states: { inserted: 0, updated: 0, skipped: 0 },
      cities: { inserted: 0, updated: 0, skipped: 0 },
      pincodes: { inserted: 0, updated: 0, skipped: 0 },
    };
  }

  async connect() {
    console.log(chalk.cyan('🔌 Connecting to MongoDB...'));
    this.client = await MongoClient.connect(this.config.mongodb.uri);
    this.db = this.client.db(this.config.mongodb.database);
    console.log(chalk.green(`✅ Connected to: ${this.config.mongodb.database}\n`));
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log(chalk.cyan('\n🔌 Disconnected from MongoDB'));
    }
  }

  async importCountries() {
    console.log(chalk.cyan('📁 Importing countries...'));
    
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'countries.json')
    );

    const collection = this.db.collection('countries');

    for (const country of data) {
      try {
        const existing = await collection.findOne({ code: country.code });
        
        if (existing) {
          // Update existing
          await collection.updateOne(
            { code: country.code },
            { $set: { name: country.name, isActive: country.isActive } }
          );
          this.stats.countries.updated++;
        } else {
          // Insert new
          await collection.insertOne(country);
          this.stats.countries.inserted++;
        }
      } catch (error) {
        console.error(chalk.red(`   ❌ Error with ${country.name}:`, error.message));
        this.stats.countries.skipped++;
      }
    }

    console.log(chalk.green(`   ✅ Inserted: ${this.stats.countries.inserted}, Updated: ${this.stats.countries.updated}, Skipped: ${this.stats.countries.skipped}`));
  }

  async importStates() {
    console.log(chalk.cyan('📁 Importing states...'));
    
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'states.json')
    );

    const countriesCollection = this.db.collection('countries');
    const statesCollection = this.db.collection('states');

    for (const state of data) {
      try {
        // Find country ID
        const country = await countriesCollection.findOne({ name: state.country });
        
        if (!country) {
          console.error(chalk.yellow(`   ⚠️  Country not found for state: ${state.name}`));
          this.stats.states.skipped++;
          continue;
        }

        const existing = await statesCollection.findOne({ 
          code: state.code,
          countryId: country._id
        });
        
        if (existing) {
          // Update existing
          await statesCollection.updateOne(
            { code: state.code, countryId: country._id },
            { $set: { name: state.name, isActive: state.isActive } }
          );
          this.stats.states.updated++;
        } else {
          // Insert new
          await statesCollection.insertOne({
            name: state.name,
            code: state.code,
            countryId: country._id,
            isActive: state.isActive,
          });
          this.stats.states.inserted++;
        }
      } catch (error) {
        console.error(chalk.red(`   ❌ Error with ${state.name}:`, error.message));
        this.stats.states.skipped++;
      }
    }

    console.log(chalk.green(`   ✅ Inserted: ${this.stats.states.inserted}, Updated: ${this.stats.states.updated}, Skipped: ${this.stats.states.skipped}`));
  }

  async importCities() {
    console.log(chalk.cyan('📁 Importing cities...'));
    
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'cities.json')
    );

    const statesCollection = this.db.collection('states');
    const citiesCollection = this.db.collection('cities');

    for (const city of data) {
      try {
        // Find state ID
        const state = await statesCollection.findOne({ name: city.state });
        
        if (!state) {
          console.error(chalk.yellow(`   ⚠️  State not found for city: ${city.name}`));
          this.stats.cities.skipped++;
          continue;
        }

        const existing = await citiesCollection.findOne({ 
          name: city.name,
          stateId: state._id
        });
        
        if (existing) {
          // Update existing
          await citiesCollection.updateOne(
            { name: city.name, stateId: state._id },
            { $set: { isActive: city.isActive } }
          );
          this.stats.cities.updated++;
        } else {
          // Insert new
          await citiesCollection.insertOne({
            name: city.name,
            stateId: state._id,
            isActive: city.isActive,
            usageCount: 0,
          });
          this.stats.cities.inserted++;
        }
      } catch (error) {
        console.error(chalk.red(`   ❌ Error with ${city.name}:`, error.message));
        this.stats.cities.skipped++;
      }
    }

    console.log(chalk.green(`   ✅ Inserted: ${this.stats.cities.inserted}, Updated: ${this.stats.cities.updated}, Skipped: ${this.stats.cities.skipped}`));
  }

  async importPincodes() {
    console.log(chalk.cyan('📁 Importing pincodes (this may take a while)...'));
    
    const data = await fs.readJson(
      path.join(this.config.paths.processed, 'pincodes.json')
    );

    const citiesCollection = this.db.collection('cities');
    const pincodesCollection = this.db.collection('pincodes');

    // Process in batches for better performance
    const BATCH_SIZE = 1000;
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const batch = data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      
      console.log(chalk.gray(`   Processing batch ${i + 1}/${totalBatches}...`));

      for (const pincode of batch) {
        try {
          // Find city ID
          const city = await citiesCollection.findOne({ name: pincode.city });
          
          if (!city) {
            this.stats.pincodes.skipped++;
            continue;
          }

          const existing = await pincodesCollection.findOne({ 
            pincode: pincode.pincode,
            cityId: city._id
          });
          
          if (existing) {
            // Update existing
            await pincodesCollection.updateOne(
              { pincode: pincode.pincode, cityId: city._id },
              { $set: { area: pincode.area, isActive: pincode.isActive } }
            );
            this.stats.pincodes.updated++;
          } else {
            // Insert new
            await pincodesCollection.insertOne({
              pincode: pincode.pincode,
              area: pincode.area || '',
              cityId: city._id,
              isActive: pincode.isActive,
              usageCount: 0,
            });
            this.stats.pincodes.inserted++;
          }
        } catch (error) {
          // Silent skip for performance (logged at end)
          this.stats.pincodes.skipped++;
        }
      }
    }

    console.log(chalk.green(`   ✅ Inserted: ${this.stats.pincodes.inserted}, Updated: ${this.stats.pincodes.updated}, Skipped: ${this.stats.pincodes.skipped}`));
  }

  async import() {
    console.log(chalk.blue.bold('\n📥 Starting Database Import\n'));
    console.log(chalk.gray('━'.repeat(60)));

    const startTime = Date.now();

    try {
      await this.connect();

      // Import in correct order (countries → states → cities → pincodes)
      await this.importCountries();
      await this.importStates();
      await this.importCities();
      await this.importPincodes();

      await this.disconnect();

      const duration = (Date.now() - startTime) / 1000;
      this.showSummary(duration);

    } catch (error) {
      console.error(chalk.red('\n❌ Import failed:'), error);
      await this.disconnect();
      process.exit(1);
    }
  }

  showSummary(duration) {
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.blue.bold('\n📊 Import Summary\n'));
    
    console.log(chalk.cyan('Countries:'));
    console.log(chalk.white(`   Inserted: ${this.stats.countries.inserted}`));
    console.log(chalk.white(`   Updated:  ${this.stats.countries.updated}`));
    console.log(chalk.white(`   Skipped:  ${this.stats.countries.skipped}`));
    
    console.log(chalk.cyan('\nStates:'));
    console.log(chalk.white(`   Inserted: ${this.stats.states.inserted}`));
    console.log(chalk.white(`   Updated:  ${this.stats.states.updated}`));
    console.log(chalk.white(`   Skipped:  ${this.stats.states.skipped}`));
    
    console.log(chalk.cyan('\nCities:'));
    console.log(chalk.white(`   Inserted: ${this.stats.cities.inserted}`));
    console.log(chalk.white(`   Updated:  ${this.stats.cities.updated}`));
    console.log(chalk.white(`   Skipped:  ${this.stats.cities.skipped}`));
    
    console.log(chalk.cyan('\nPincodes:'));
    console.log(chalk.white(`   Inserted: ${this.stats.pincodes.inserted}`));
    console.log(chalk.white(`   Updated:  ${this.stats.pincodes.updated}`));
    console.log(chalk.white(`   Skipped:  ${this.stats.pincodes.skipped}`));
    
    console.log(chalk.cyan(`\n⏱️  Time elapsed: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`));
    console.log(chalk.gray('\n' + '━'.repeat(60)));
    console.log(chalk.green('\n✨ Import complete!\n'));
  }
}

// Run importer
const importer = new DatabaseImporter();
importer.import().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});

