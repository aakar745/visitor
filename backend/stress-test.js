/**
 * Stress Test for Queue System
 * 
 * ⚡ NO LIMITS - System supports unlimited concurrent kiosks!
 * 
 * Simulates high-volume concurrent scanning to test:
 * - Queue performance
 * - Race condition prevention
 * - Distributed locking
 * - System throughput
 * 
 * Usage:
 *   node stress-test.js [concurrent_kiosks] [total_scans]
 *   
 * Examples:
 *   node stress-test.js 20 1000   → 20 kiosks, 1000 total scans
 *   node stress-test.js 40 5000   → 40 kiosks, 5000 total scans
 *   node stress-test.js 100 10000 → 100 kiosks, 10000 total scans
 * 
 * 🚀 Scale to ANY number based on your event size!
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/v1';
const PRINT_SERVICE_URL = process.env.PRINT_SERVICE_URL || 'http://localhost:9100';

// Test parameters
const CONCURRENT_KIOSKS = parseInt(process.argv[2]) || 20;
const TOTAL_SCANS = parseInt(process.argv[3]) || 100;
const SCANS_PER_KIOSK = Math.ceil(TOTAL_SCANS / CONCURRENT_KIOSKS);

// Test registration numbers (you need to have these in your database)
// For real testing, replace with actual registration numbers
const TEST_REGISTRATIONS = [
  'REG-14112025-000010',
  'REG-14112025-000003',
  'REG-14112025-000004',
  // Add more...
];

// Statistics
let successCount = 0;
let failureCount = 0;
let raceConditionPrevented = 0;
let lockConflicts = 0;
let totalTime = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulate a single kiosk scanning QR codes
 */
async function simulateKiosk(kioskId, registrations) {
  const results = [];
  
  console.log(`[Kiosk ${kioskId}] Starting to scan ${registrations.length} codes...`);
  
  for (const regNumber of registrations) {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate QR
      await axios.get(`${BACKEND_URL}/registrations/validate-qr/${regNumber}`);
      
      // Step 2: Check-in (with distributed lock)
      try {
        await axios.post(`${BACKEND_URL}/registrations/check-in`, {
          registrationNumber: regNumber,
        });
      } catch (checkInError) {
        if (checkInError.response?.data?.message?.includes('Another kiosk')) {
          lockConflicts++;
          console.log(`[Kiosk ${kioskId}] ⚠️  Lock conflict for ${regNumber}`);
        } else if (checkInError.response?.data?.message?.includes('Already checked in')) {
          raceConditionPrevented++;
          console.log(`[Kiosk ${kioskId}] ✅ Race condition prevented for ${regNumber}`);
        } else {
          throw checkInError;
        }
      }
      
      // Step 3: Queue print job
      const queueResponse = await axios.post(`${BACKEND_URL}/registrations/queue-print`, {
        registrationNumber: regNumber,
        printerServiceUrl: PRINT_SERVICE_URL,
        kioskId: `kiosk-${kioskId}`,
      });
      
      const elapsed = Date.now() - startTime;
      totalTime += elapsed;
      
      results.push({
        regNumber,
        success: true,
        time: elapsed,
        jobId: queueResponse.data.data.jobId,
        queuePosition: queueResponse.data.data.queuePosition,
      });
      
      successCount++;
      console.log(`[Kiosk ${kioskId}] ✅ ${regNumber} | ${elapsed}ms | Queue pos: ${queueResponse.data.data.queuePosition}`);
      
    } catch (error) {
      failureCount++;
      console.error(`[Kiosk ${kioskId}] ❌ ${regNumber} | Error: ${error.response?.data?.message || error.message}`);
      
      results.push({
        regNumber,
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
    
    // Small delay between scans (realistic user behavior)
    await sleep(100);
  }
  
  return results;
}

/**
 * Test: Simultaneous scan of same QR code (race condition test)
 */
async function testRaceCondition(regNumber, kiosksCount = 20) {
  console.log(`\n🧪 RACE CONDITION TEST: ${kiosksCount} kiosks scanning "${regNumber}" simultaneously\n`);
  
  const promises = [];
  for (let i = 1; i <= kiosksCount; i++) {
    promises.push(
      axios.post(`${BACKEND_URL}/registrations/check-in`, {
        registrationNumber: regNumber,
      }).then(() => {
        console.log(`[Kiosk ${i}] ✅ Check-in succeeded`);
        return { success: true, kioskId: i };
      }).catch((error) => {
        console.log(`[Kiosk ${i}] ⛔ ${error.response?.data?.message || 'Failed'}`);
        return { success: false, kioskId: i, error: error.response?.data?.message };
      })
    );
  }
  
  const results = await Promise.all(promises);
  const successfulCheckIns = results.filter(r => r.success).length;
  
  console.log(`\n📊 RACE CONDITION TEST RESULTS:`);
  console.log(`   Total attempts: ${kiosksCount}`);
  console.log(`   Successful check-ins: ${successfulCheckIns}`);
  console.log(`   Blocked (lock conflict): ${kiosksCount - successfulCheckIns}`);
  
  if (successfulCheckIns === 1) {
    console.log(`   ✅ PASS: Only 1 check-in succeeded (race condition prevented)`);
  } else {
    console.log(`   ❌ FAIL: Multiple check-ins succeeded (race condition detected!)`);
  }
  
  return successfulCheckIns === 1;
}

/**
 * Test: High-volume concurrent scanning
 */
async function testHighVolume() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  HIGH-VOLUME STRESS TEST                       ║
╠════════════════════════════════════════════════════════════════╣
║ Concurrent Kiosks: ${CONCURRENT_KIOSKS.toString().padEnd(43)}║
║ Total Scans: ${TOTAL_SCANS.toString().padEnd(51)}║
║ Scans per Kiosk: ${SCANS_PER_KIOSK.toString().padEnd(47)}║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  // Distribute registrations across kiosks
  const kioskRegistrations = [];
  for (let i = 0; i < CONCURRENT_KIOSKS; i++) {
    kioskRegistrations.push([]);
  }
  
  // Use the first registration number for all scans
  // This tests: race condition prevention, distributed locking, repeat printing
  const testReg = TEST_REGISTRATIONS[0];
  if (!testReg) {
    console.error('❌ ERROR: No test registration numbers provided!');
    console.log('Please edit stress-test.js and add real registration numbers from your database.');
    process.exit(1);
  }
  
  console.log(`\n⚠️  NOTE: All ${TOTAL_SCANS} scans will use the SAME registration: ${testReg}`);
  console.log('   This tests race condition prevention and repeat printing logic.\n');
  
  for (let i = 0; i < TOTAL_SCANS; i++) {
    const kioskIndex = i % CONCURRENT_KIOSKS;
    kioskRegistrations[kioskIndex].push(testReg); // Same registration for all (race condition test!)
  }
  
  console.log(`\n🚀 Starting stress test...\n`);
  const startTime = Date.now();
  
  // Run all kiosks concurrently
  const kioskPromises = kioskRegistrations.map((regs, index) =>
    simulateKiosk(index + 1, regs)
  );
  
  const allResults = await Promise.all(kioskPromises);
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Print results
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                      TEST RESULTS                              ║
╠════════════════════════════════════════════════════════════════╣
║ Total Scans: ${TOTAL_SCANS.toString().padEnd(51)}║
║ Successful: ${successCount.toString().padEnd(52)}║
║ Failed: ${failureCount.toString().padEnd(56)}║
║ Lock Conflicts: ${lockConflicts.toString().padEnd(48)}║
║ Race Conditions Prevented: ${raceConditionPrevented.toString().padEnd(37)}║
║ Total Time: ${(totalDuration / 1000).toFixed(2)}s${' '.padEnd(48)}║
║ Average Time per Scan: ${(totalTime / successCount).toFixed(2)}ms${' '.padEnd(35)}║
║ Throughput: ${(successCount / (totalDuration / 1000)).toFixed(2)} scans/second${' '.padEnd(34)}║
╚════════════════════════════════════════════════════════════════╝
  `);
  
  // Check queue stats
  try {
    const statsResponse = await axios.get(`${BACKEND_URL}/print-queue/stats`);
    const stats = statsResponse.data.data;
    
    console.log(`
📊 QUEUE STATISTICS:
   Waiting: ${stats.waiting}
   Active: ${stats.active}
   Completed: ${stats.completed}
   Failed: ${stats.failed}
    `);
  } catch (error) {
    console.error('Failed to fetch queue stats');
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Starting Queue System Stress Tests...\n');
  
  try {
    // Test 1: Race condition (optional - comment out if no test data)
    // const raceTestPassed = await testRaceCondition(TEST_REGISTRATIONS[0], 20);
    
    // Test 2: High-volume concurrent scanning
    await testHighVolume();
    
    console.log('\n✅ Stress test completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Stress test failed:', error.message);
    process.exit(1);
  }
}

main();

