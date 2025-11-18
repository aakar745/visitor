import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exhibition } from '../database/schemas/exhibition.schema';

/**
 * Migration Script: Add _id fields to exhibition subdocuments
 * 
 * This script adds MongoDB ObjectId _id fields to all subdocuments
 * (pricingTiers, interestOptions, customFields) in existing exhibitions.
 * 
 * Usage: npm run migrate:exhibitions
 */
async function migrateExhibitionSubdocuments() {
  console.log('🚀 Starting migration: Add _id to exhibition subdocuments...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const exhibitionModel = app.get<Model<Exhibition>>('ExhibitionModel');
    
    // Find all exhibitions
    const exhibitions = await exhibitionModel.find({}).exec();
    console.log(`📊 Found ${exhibitions.length} exhibitions to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const exhibition of exhibitions) {
      let needsUpdate = false;
      const updates: any = {};

      // Process pricing tiers
      if (exhibition.pricingTiers && exhibition.pricingTiers.length > 0) {
        const updatedTiers = exhibition.pricingTiers.map((tier: any) => {
          if (!tier._id) {
            needsUpdate = true;
            return {
              ...tier.toObject ? tier.toObject() : tier,
              _id: new Types.ObjectId(),
            };
          }
          return tier;
        });
        
        if (needsUpdate) {
          updates.pricingTiers = updatedTiers;
        }
      }

      // Process interest options
      if (exhibition.interestOptions && exhibition.interestOptions.length > 0) {
        const updatedOptions = exhibition.interestOptions.map((option: any) => {
          if (!option._id) {
            needsUpdate = true;
            return {
              ...option.toObject ? option.toObject() : option,
              _id: new Types.ObjectId(),
            };
          }
          return option;
        });
        
        if (needsUpdate) {
          updates.interestOptions = updatedOptions;
        }
      }

      // Process custom fields
      if (exhibition.customFields && exhibition.customFields.length > 0) {
        const updatedFields = exhibition.customFields.map((field: any) => {
          if (!field._id) {
            needsUpdate = true;
            return {
              ...field.toObject ? field.toObject() : field,
              _id: new Types.ObjectId(),
            };
          }
          return field;
        });
        
        if (needsUpdate) {
          updates.customFields = updatedFields;
        }
      }

      // Update if needed
      if (needsUpdate) {
        await exhibitionModel.updateOne(
          { _id: exhibition._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`✅ Updated exhibition: ${exhibition.name} (${exhibition.slug})`);
        
        // Log what was updated
        if (updates.pricingTiers) {
          console.log(`   - Added ${updates.pricingTiers.length} pricing tier IDs`);
        }
        if (updates.interestOptions) {
          console.log(`   - Added ${updates.interestOptions.length} interest option IDs`);
        }
        if (updates.customFields) {
          console.log(`   - Added ${updates.customFields.length} custom field IDs`);
        }
        console.log('');
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped exhibition: ${exhibition.name} (already has IDs)`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📊 Total: ${exhibitions.length}`);
    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the migration
migrateExhibitionSubdocuments()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

