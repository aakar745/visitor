import { connect, connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

/**
 * Migration Script: Fix Registration Counter Indexes
 * 
 * This script drops the old index and ensures the new compound index is created.
 * 
 * Run this script ONCE after updating the schema to use exhibitionTagline instead of exhibitionId.
 * 
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/fix-registration-counter-indexes.ts
 */

async function fixIndexes() {
  try {
    // Load environment variables
    config({ path: ['.env.local', '.env'] });

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management';
    
    console.log('🔗 Connecting to MongoDB...');
    await connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('registrationcounters');

    // Get existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the old 'date_1' unique index if it exists
    try {
      console.log('\n🗑️  Attempting to drop old "date_1" index...');
      await collection.dropIndex('date_1');
      console.log('✅ Successfully dropped old "date_1" index');
    } catch (error: any) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index "date_1" not found (already removed or never existed)');
      } else {
        console.error('⚠️  Error dropping index:', error.message);
      }
    }

    // Create the new compound index
    console.log('\n🔨 Creating new compound index...');
    await collection.createIndex(
      { exhibitionTagline: 1, date: 1 },
      { unique: true, name: 'exhibitionTagline_1_date_1' }
    );
    console.log('✅ Successfully created new compound index: exhibitionTagline_1_date_1');

    // Verify new indexes
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Old index (date_1) removed');
    console.log('   ✅ New compound index (exhibitionTagline_1_date_1) created');
    console.log('\n🚀 You can now restart your backend server.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

fixIndexes();

