/**
 * Print Service Worker
 * 
 * Consumes print jobs from Redis queue (BullMQ)
 * Processes jobs and sends them to the Brother QL-800 printer
 * 
 * Features:
 * - Auto-retry on failure (3 attempts)
 * - Rate limiting (1 job per 2 seconds)
 * - Job status tracking
 * - Error handling and logging
 * - Graceful shutdown
 */

const { Worker } = require('bullmq');
const { Redis } = require('ioredis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const ptp = require('pdf-to-printer');

// ✅ Load environment variables using shared loader (Electron-aware)
const { loadEnv, getUserDataDir } = require('./lib/env-loader');
const envPath = loadEnv();

// ✅ Import shared functions from server.js (avoids duplication)
const { generateLabelImage, printImageDirectly } = require('./server');

// Configuration
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');
const PRINTER_NAME = process.env.PRINTER_NAME || 'Brother QL-800';
const KIOSK_ID = process.env.KIOSK_ID || ''; // Unique identifier for this kiosk

// Validate required Redis configuration
if (!REDIS_HOST || !REDIS_PASSWORD) {
  console.error('\n❌ ERROR: Missing Redis Configuration!\n');
  console.error('Please configure Redis credentials in .env file:');
  console.error(`Location: ${envPath || 'Not found'}\n`);
  console.error('Required settings:');
  console.error('  REDIS_HOST=<your-redis-host>');
  console.error('  REDIS_PORT=6379');
  console.error('  REDIS_PASSWORD=<your-redis-password>');
  console.error('  REDIS_DB=0\n');
  console.error('Current values:');
  console.error(`  REDIS_HOST: ${REDIS_HOST || '(NOT SET)'}`);
  // ✅ SECURITY FIX: Never log password value, only whether it's configured
  console.error(`  REDIS_PASSWORD: ${REDIS_PASSWORD ? '***CONFIGURED***' : '(NOT SET)'}\n`);
  console.error('Worker cannot start without Redis configuration.');
  console.error('Exiting...\n');
  process.exit(1);
}

// ✅ Use same writable directory as server.js (user data directory)
// This ensures all components use the same location for generated files
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(getUserDataDir(), 'labels');

const RATE_LIMIT_DELAY = 2000; // 2 seconds between jobs

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
}

// Determine queue name based on kiosk ID
const QUEUE_NAME = KIOSK_ID ? `print-jobs-${KIOSK_ID}` : 'print-jobs';

console.log(`
╔═══════════════════════════════════════════════════╗
║   🖨️  Print Service Worker - Starting...         ║
║                                                   ║
║   Kiosk ID: ${(KIOSK_ID || 'default').padEnd(36)} ║
║   Queue: ${QUEUE_NAME.padEnd(39)} ║
║   Redis: ${REDIS_HOST}:${REDIS_PORT} (Auth: ${REDIS_PASSWORD ? '✓' : '✗'})              ║
║   Printer: ${PRINTER_NAME.padEnd(36)} ║
║   Output: ${OUTPUT_DIR.substring(0, 44)}...   ║
║   Rate Limit: ${RATE_LIMIT_DELAY}ms between jobs                  ║
╚═══════════════════════════════════════════════════╝
`);

// Test Redis connection before starting worker
console.log('🔍 Testing Redis connection...');
const { Redis: RedisTest } = require('ioredis');
const testClient = new RedisTest({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
});

testClient.on('error', (err) => {
  console.error('\n❌ Redis connection test failed!');
  console.error(`Error: ${err.message}`);
  console.error(`\nCannot start worker without Redis connection.`);
  process.exit(1);
});

testClient.on('ready', () => {
  console.log('✅ Redis connection successful!\n');
  testClient.disconnect();
});

// ==========================================
// 🧹 CLEANUP SYSTEM - Removed
// ==========================================
// NOTE: File cleanup is now handled exclusively by server.js
// This prevents race conditions where both processes try to delete the same files.
// The worker's responsibility is to process print jobs only.
//
// Cleanup details:
// - Managed by: server.js (ONLY)
// - Multi-strategy schedule:
//   1. On startup (after 1 minute) - handles daily PC restarts
//   2. Every 6 hours - handles extended uptime (PC left on for days/weeks)
//   3. Daily at 3 AM - traditional maintenance (if PC is on)
// - Retention: 7 days
// - Location: ./labels/ directory
//
// This multi-layered approach ensures cleanup happens regardless of PC power schedule!

// ✅ REFACTORED: generateLabelImage() and printImageDirectly() are now imported from server.js
// This eliminates 180+ lines of duplicate code and ensures consistency between HTTP API and queue worker

/**
 * Process print job
 * Main worker function that processes each job
 */
async function processPrintJob(job) {
  const { 
    registrationNumber, 
    visitorName, 
    visitorCompany,
    visitorLocation, 
    qrCode, 
    exhibitionName,
    timestamp 
  } = job.data;

  // Validate required fields
  if (!registrationNumber || !visitorName || !qrCode) {
    const error = new Error('Missing required fields in job data (registrationNumber, visitorName, or qrCode)');
    console.error(`❌ [INVALID JOB] ID: ${job.id} - ${error.message}`);
    throw error; // This will cause the job to fail permanently after retries
  }

  console.log(`
╭───────────────────────────────────────────────────╮
│ 🖨️  Processing Print Job                          │
├───────────────────────────────────────────────────┤
│ Job ID: ${job.id.padEnd(42)}│
│ Visitor: ${(visitorName || 'Unknown').substring(0, 40).padEnd(40)}│
│ Company: ${(visitorCompany || 'N/A').substring(0, 41).padEnd(41)}│
│ Registration: ${(registrationNumber || 'N/A').padEnd(36)}│
│ Exhibition: ${(exhibitionName || 'Unknown').substring(0, 38).padEnd(38)}│
│ Location: ${(visitorLocation || 'N/A').substring(0, 40).padEnd(40)}│
│ Queued At: ${new Date(timestamp || Date.now()).toLocaleTimeString().padEnd(39)}│
╰───────────────────────────────────────────────────╯
  `);

  try {
    // Update progress: 10%
    await job.updateProgress(10);

    // Save QR code
    const filename = `label-${Date.now()}`;
    const qrPath = path.join(OUTPUT_DIR, `${filename}-qr.png`);
    const qrBuffer = Buffer.from(qrCode, 'base64');
    fs.writeFileSync(qrPath, qrBuffer);
    
    console.log('[Worker] ✅ QR code saved');
    await job.updateProgress(30);

    // Generate label image
    const labelPath = await generateLabelImage(
      qrPath, 
      visitorName, 
      visitorLocation || '',
      registrationNumber,
      visitorCompany || ''
    );
    
    console.log('[Worker] ✅ Label image generated');
    await job.updateProgress(60);

    // Print label
    await printImageDirectly(labelPath, PRINTER_NAME);
    
    console.log('[Worker] ✅ Label printed successfully!');
    await job.updateProgress(100);

    return {
      success: true,
      message: `Label printed for ${visitorName}`,
      files: {
        qr: path.basename(qrPath),
        label: path.basename(labelPath),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Worker] ❌ Job failed:', error.message);
    throw error; // Will trigger retry
  }
}

/**
 * Create and start the worker
 * Each kiosk consumes from its own queue to ensure jobs are printed on the correct printer
 */
const worker = new Worker(
  QUEUE_NAME, // Queue name (kiosk-specific or default)
  processPrintJob,
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      db: REDIS_DB,
    },
    limiter: {
      max: 1, // Max 1 job at a time
      duration: RATE_LIMIT_DELAY, // Per 2 seconds (printer hardware limit)
    },
    concurrency: 1, // IMPORTANT: Keep at 1 if using ONE printer
    // 🔧 For MULTIPLE PRINTERS: Increase concurrency to number of printers
    // Example: concurrency: 3 (if you have 3 printers on same PC)
  }
);

// Event handlers
worker.on('completed', (job, result) => {
  console.log(`\n✅ [JOB COMPLETED] ID: ${job.id} | Visitor: ${job.data.visitorName}`);
  console.log(`   Result: ${result.message}\n`);
});

worker.on('failed', (job, error) => {
  console.error(`\n❌ [JOB FAILED] ID: ${job?.id} | Attempt: ${job?.attemptsMade}/${job?.opts?.attempts || 3}`);
  console.error(`   Error: ${error.message}`);
  
  if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
    console.error(`   🚨 MAX RETRIES REACHED - Job moved to dead letter queue\n`);
  } else {
    console.log(`   🔄 Will retry...\n`);
  }
});

worker.on('active', (job) => {
  console.log(`\n⚙️  [JOB STARTED] ID: ${job.id} | Queue position was: ${job.processedOn}\n`);
});

worker.on('error', (error) => {
  console.error('\n🚨 [WORKER ERROR] Connection failed!');
  console.error(`Error: ${error.message}`);
  
  // Provide helpful context based on error type
  if (error.code === 'ECONNREFUSED') {
    console.error('\n❌ Cannot connect to Redis server!');
    console.error(`   Tried to connect to: ${REDIS_HOST}:${REDIS_PORT}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if Redis is running');
    console.error('   2. Verify REDIS_HOST and REDIS_PORT in .env');
    console.error('   3. Check firewall/security group settings');
  } else if (error.message.includes('WRONGPASS') || error.message.includes('NOAUTH')) {
    console.error('\n❌ Redis authentication failed!');
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check REDIS_PASSWORD in .env file');
    console.error('   2. Verify password is correct');
  }
  console.error('\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n📴 [SHUTDOWN] Gracefully closing worker...');
  await worker.close();
  console.log('✅ [SHUTDOWN] Worker closed\n');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n📴 [SHUTDOWN] Gracefully closing worker...');
  await worker.close();
  console.log('✅ [SHUTDOWN] Worker closed\n');
  process.exit(0);
});

console.log(`
✅ Worker started successfully!
🎧 Listening for print jobs on queue: "${QUEUE_NAME}"
🖨️  Ready to print badges on ${PRINTER_NAME}

Press Ctrl+C to stop the worker.
`);

