/**
 * Meilisearch Data Sync Script
 * 
 * This script syncs all PIN codes from MongoDB to Meilisearch index.
 * Run this after starting Meilisearch for the first time or to re-index data.
 * 
 * Usage: npm run sync:meilisearch
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MeilisearchService } from '../modules/meilisearch/meilisearch.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pincode } from '../database/schemas/pincode.schema';

async function bootstrap() {
  console.log('🚀 Starting Meilisearch sync...\n');

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get services
    const meilisearchService = app.get(MeilisearchService);
    const pincodeModel = app.get<Model<Pincode>>('PincodeModel');

    // Check Meilisearch connection
    const stats = await meilisearchService.getStats();
    if (stats) {
      console.log('✅ Connected to Meilisearch');
      console.log(`📊 Current index stats:`, {
        documentsCount: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
      });
    } else {
      throw new Error('Failed to connect to Meilisearch. Is it running?');
    }

    // Fetch all PIN codes with populated data
    console.log('\n📦 Fetching PIN codes from MongoDB...');
    const pincodes = await pincodeModel
      .find()
      .populate({
        path: 'cityId',
        populate: {
          path: 'stateId',
          populate: {
            path: 'countryId',
          },
        },
      })
      .lean()
      .exec();

    console.log(`✅ Found ${pincodes.length} PIN codes in MongoDB\n`);

    if (pincodes.length === 0) {
      console.log('⚠️  No PIN codes found in database. Please add some first.');
      console.log('   Run: npm run seed (if you have location seed data)');
      await app.close();
      return;
    }

    // Optional: Clear existing index
    console.log('🗑️  Clearing existing Meilisearch index...');
    await meilisearchService.clearIndex();
    console.log('✅ Index cleared\n');

    // Sync to Meilisearch
    console.log('📤 Syncing PIN codes to Meilisearch...');
    console.log('   This may take a while for large datasets...\n');

    await meilisearchService.indexAllPincodes(pincodes);

    // Get final stats
    const finalStats = await meilisearchService.getStats();
    console.log('\n✅ Sync completed successfully!');
    console.log(`📊 Final index stats:`, {
      documentsCount: finalStats?.numberOfDocuments || 0,
      isIndexing: finalStats?.isIndexing || false,
    });

    console.log('\n✨ You can now test search at: http://localhost:7700');
    console.log('   Use Master Key: developmentMasterKeyMin16Chars123\n');
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure Meilisearch is running:');
    console.error('     docker-compose -f docker-compose-meilisearch.yml up -d');
    console.error('  2. Check MEILISEARCH_URL in backend/.env');
    console.error('  3. Verify MEILISEARCH_MASTER_KEY matches docker config');
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

