import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MeilisearchService } from '../modules/meilisearch/meilisearch.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GlobalVisitor, GlobalVisitorDocument } from '../database/schemas/global-visitor.schema';

/**
 * Sync all existing visitors to MeiliSearch index
 * Run this script once to populate the visitor search index
 * 
 * Usage: npm run sync:visitors
 */
async function syncVisitors() {
  console.log('🚀 Starting MeiliSearch visitor sync...\n');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get services
    const meilisearchService = app.get(MeilisearchService);
    
    // Get Visitor model
    const visitorModel = app.get<Model<GlobalVisitorDocument>>('GlobalVisitorModel');

    // Fetch all visitors from MongoDB
    console.log('📊 Fetching visitors from MongoDB...');
    const visitors = await visitorModel.find().lean().exec();
    
    console.log(`✅ Found ${visitors.length} visitors in database\n`);

    if (visitors.length === 0) {
      console.log('⚠️  No visitors found. Nothing to index.');
      await app.close();
      return;
    }

    // Index all visitors to MeiliSearch
    console.log('📤 Indexing visitors to MeiliSearch...');
    console.log('   This may take a few moments for large datasets...\n');
    
    const startTime = Date.now();
    await meilisearchService.indexAllVisitors(visitors);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✨ Sync completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total visitors indexed: ${visitors.length}`);
    console.log(`⏱️  Time taken: ${duration} seconds`);
    console.log(`⚡ Average speed: ${(visitors.length / parseFloat(duration)).toFixed(0)} visitors/sec`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Visitors are now searchable in Exhibition Reports!');
    console.log('   Test it by typing a visitor name in the search box.\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error syncing visitors:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MeiliSearch is running');
    console.error('2. Check MEILISEARCH_URL and MEILISEARCH_MASTER_KEY in .env');
    console.error('3. Verify MongoDB connection is working\n');
    process.exit(1);
  }
}

// Run the sync
syncVisitors();

