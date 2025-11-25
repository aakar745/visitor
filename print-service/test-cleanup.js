/**
 * 🧪 Test Script for Label Cleanup System
 * 
 * Tests the cleanup functionality by:
 * 1. Creating test files with various ages
 * 2. Running cleanup
 * 3. Verifying old files are deleted, recent files are kept
 */

const fs = require('fs');
const path = require('path');
const { getUserDataDir } = require('./lib/env-loader');

// Use same writable directory as server.js and print-worker.js
const OUTPUT_DIR = path.join(getUserDataDir(), 'labels');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🧪 TESTING LABEL CLEANUP SYSTEM');
console.log('═══════════════════════════════════════════════\n');

/**
 * Create test files with different ages
 */
function createTestFiles() {
  console.log('📝 Creating test files with different ages...\n');
  
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const testFiles = [
    // Recent files (should be kept)
    { name: 'label-recent-1.png', age: 0 },
    { name: 'label-recent-2.pdf', age: 2 * oneDay },
    { name: 'label-recent-3.html', age: 5 * oneDay },
    
    // Old files (should be deleted)
    { name: 'label-old-1.png', age: 8 * oneDay },
    { name: 'label-old-2.pdf', age: 10 * oneDay },
    { name: 'label-old-3.html', age: 15 * oneDay },
    { name: 'label-old-4.png', age: 30 * oneDay },
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file.name);
    const content = `Test file created for cleanup testing - Age: ${file.age / oneDay} days`;
    
    // Create file
    fs.writeFileSync(filePath, content);
    
    // Set modified time to simulate age
    const targetTime = now - file.age;
    fs.utimesSync(filePath, new Date(targetTime), new Date(targetTime));
    
    const ageInDays = Math.floor(file.age / oneDay);
    const status = ageInDays > 7 ? '🔴 OLD (will be deleted)' : '🟢 RECENT (will be kept)';
    console.log(`   Created: ${file.name.padEnd(25)} - ${ageInDays} days old ${status}`);
  });
  
  console.log('\n✅ Test files created\n');
}

/**
 * Cleanup function (same as in server.js and print-worker.js)
 */
async function cleanupOldLabels() {
  const MAX_AGE_DAYS = 7; // Keep files for 7 days
  const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  console.log('🧹 Starting cleanup...');
  console.log(`   Max age: ${MAX_AGE_DAYS} days\n`);
  
  try {
    const files = await fs.promises.readdir(OUTPUT_DIR);
    const now = Date.now();
    
    let deletedCount = 0;
    let keptCount = 0;
    let totalSize = 0;
    let deletedFiles = [];
    let keptFiles = [];
    
    for (const file of files) {
      // Skip hidden files and directories
      if (file.startsWith('.')) {
        continue;
      }
      
      const filePath = path.join(OUTPUT_DIR, file);
      
      try {
        const stats = await fs.promises.stat(filePath);
        
        // Skip directories
        if (stats.isDirectory()) {
          continue;
        }
        
        const fileAge = now - stats.mtimeMs;
        const ageInDays = Math.floor(fileAge / (24 * 60 * 60 * 1000));
        
        if (fileAge > MAX_AGE_MS) {
          // Delete old file
          await fs.promises.unlink(filePath);
          deletedCount++;
          totalSize += stats.size;
          deletedFiles.push({ name: file, age: ageInDays });
        } else {
          keptCount++;
          keptFiles.push({ name: file, age: ageInDays });
        }
      } catch (err) {
        console.warn(`⚠️  Error processing file ${file}: ${err.message}`);
      }
    }
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    console.log('📊 CLEANUP RESULTS:');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log(`🗑️  DELETED (${deletedCount} files):`);
    if (deletedFiles.length === 0) {
      console.log('   (none)');
    } else {
      deletedFiles.forEach(f => {
        console.log(`   ❌ ${f.name.padEnd(30)} (${f.age} days old)`);
      });
    }
    
    console.log(`\n💾 KEPT (${keptCount} files):`);
    if (keptFiles.length === 0) {
      console.log('   (none)');
    } else {
      keptFiles.forEach(f => {
        console.log(`   ✅ ${f.name.padEnd(30)} (${f.age} days old)`);
      });
    }
    
    console.log('\n📈 SUMMARY:');
    console.log(`   Files deleted: ${deletedCount}`);
    console.log(`   Files kept: ${keptCount}`);
    console.log(`   Disk space freed: ${sizeMB} MB`);
    
    // Verification
    console.log('\n✅ VERIFICATION:');
    const expectedDeleted = 4; // 4 old files
    const expectedKept = 3; // 3 recent files
    
    if (deletedCount === expectedDeleted && keptCount === expectedKept) {
      console.log('   ✅ TEST PASSED! Cleanup worked correctly.');
      console.log(`   ✅ ${expectedDeleted} old files deleted as expected`);
      console.log(`   ✅ ${expectedKept} recent files kept as expected`);
    } else {
      console.log('   ❌ TEST FAILED!');
      console.log(`   Expected: ${expectedDeleted} deleted, ${expectedKept} kept`);
      console.log(`   Got: ${deletedCount} deleted, ${keptCount} kept`);
    }
    
  } catch (err) {
    console.error(`❌ Cleanup error: ${err.message}`);
  }
}

/**
 * Run the test
 */
async function runTest() {
  try {
    // Step 1: Create test files
    createTestFiles();
    
    // Step 2: Run cleanup
    await cleanupOldLabels();
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎉 Test completed!');
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();

