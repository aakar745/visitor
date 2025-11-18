import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

/**
 * Script to populate registeredExhibitions array for existing visitors
 * 
 * PROBLEM: 
 * - Before this fix, registeredExhibitions array was never populated
 * - This caused MeiliSearch exhibition filter to return 0 results
 * 
 * SOLUTION:
 * - Query all exhibition registrations for each visitor
 * - Update visitor.registeredExhibitions with exhibition IDs
 * - Auto-sync to MeiliSearch happens via existing hooks
 * 
 * RUN: npm run fix:exhibitions
 */
async function fixRegisteredExhibitions() {
  console.log('🔧 Starting fix for registeredExhibitions...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get models
    const VisitorModel = app.get('GlobalVisitorModel');
    const RegistrationModel = app.get('ExhibitionRegistrationModel');
    
    // Get all visitors
    const visitors = await VisitorModel.find().lean().exec();
    console.log(`📊 Found ${visitors.length} visitors to process\n`);
    
    let updatedCount = 0;
    let noChangesCount = 0;
    let errorCount = 0;
    
    // Process each visitor
    for (const visitor of visitors) {
      try {
        // Find all exhibitions this visitor registered for
        const registrations = await RegistrationModel
          .find({ visitorId: visitor._id })
          .distinct('exhibitionId')
          .exec();
        
        const currentExhibitions = visitor.registeredExhibitions || [];
        
        // Check if update is needed
        const needsUpdate = 
          registrations.length !== currentExhibitions.length ||
          !registrations.every((id: any) => 
            currentExhibitions.some((currId: any) => currId.toString() === id.toString())
          );
        
        if (needsUpdate) {
          // Update visitor with correct exhibition IDs
          await VisitorModel.findByIdAndUpdate(
            visitor._id,
            { $set: { registeredExhibitions: registrations } },
            { new: true }
          );
          
          updatedCount++;
          console.log(`✅ Updated visitor: ${visitor.name || visitor.email}`);
          console.log(`   Phone: ${visitor.phone}`);
          console.log(`   Exhibitions: ${currentExhibitions.length} → ${registrations.length}`);
          console.log(`   IDs: [${registrations.map((id: any) => id.toString().slice(-6)).join(', ')}]`);
          console.log('');
        } else {
          noChangesCount++;
          console.log(`⏭️  Skipped (already correct): ${visitor.name || visitor.email}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing visitor ${visitor._id}:`, error.message);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Updated: ${updatedCount} visitors`);
    console.log(`⏭️  Skipped: ${noChangesCount} visitors (already correct)`);
    console.log(`❌ Errors: ${errorCount} visitors`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (updatedCount > 0) {
      console.log('⚠️  IMPORTANT: MongoDB updated, but MeiliSearch NOT synced yet!');
      console.log('📝 Next step: Run npm run sync:visitors to update MeiliSearch\n');
    } else {
      console.log('✅ All visitors already have correct data!\n');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await app.close();
  }
}

fixRegisteredExhibitions();

