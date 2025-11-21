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

// Load environment variables from user data directory (writable location)
// Try multiple locations for .env file
let envPath = null;

// 1. User data path (set by Electron when running from GUI)
if (process.env.USER_DATA_PATH) {
  const userEnvPath = path.join(process.env.USER_DATA_PATH, '.env');
  if (fs.existsSync(userEnvPath)) {
    envPath = userEnvPath;
  }
}

// 2. Current directory (for development/manual runs)
if (!envPath && fs.existsSync(path.join(__dirname, '.env'))) {
  envPath = path.join(__dirname, '.env');
}

// Load environment variables
if (envPath) {
  require('dotenv').config({ path: envPath });
  console.log(`📁 Loaded config from: ${envPath}`);
} else {
  require('dotenv').config(); // Try default location
  console.log('⚠️ No .env file found, using environment variables');
}

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
  console.error(`  REDIS_PASSWORD: ${REDIS_PASSWORD ? 'SET' : '(NOT SET)'}\n`);
  console.error('Worker cannot start without Redis configuration.');
  console.error('Exiting...\n');
  process.exit(1);
}

// Use a writable directory (AppData/Local for Windows, or system temp)
// C:\Program Files is read-only, so we use user's local app data folder
const OUTPUT_DIR = process.env.OUTPUT_DIR || 
  path.join(process.env.LOCALAPPDATA || process.env.TMPDIR || '/tmp', 'VisitorPrintService', 'labels');

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
║   Redis: ${REDIS_HOST}:${REDIS_PORT}                            ║
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
// 🧹 CLEANUP SYSTEM - Prevent Folder Bloat
// ==========================================

/**
 * Delete old label files to prevent disk space issues
 * Keeps only files from the last 7 days
 * Runs daily at 3 AM (or on startup if never run)
 */
async function cleanupOldLabels() {
  const MAX_AGE_DAYS = 7; // Keep files for 7 days
  const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  console.log('\n🧹 [CLEANUP] Starting label folder cleanup...');
  console.log(`   Keeping files newer than ${MAX_AGE_DAYS} days`);
  
  try {
    const files = await fs.promises.readdir(OUTPUT_DIR);
    const now = Date.now();
    
    let deletedCount = 0;
    let keptCount = 0;
    let totalSize = 0;
    
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
        
        if (fileAge > MAX_AGE_MS) {
          // Delete old file
          await fs.promises.unlink(filePath);
          deletedCount++;
          totalSize += stats.size;
        } else {
          keptCount++;
        }
      } catch (err) {
        console.warn(`[CLEANUP] ⚠️  Error processing file ${file}: ${err.message}`);
      }
    }
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ [CLEANUP] Completed:`);
    console.log(`   Files deleted: ${deletedCount}`);
    console.log(`   Files kept: ${keptCount}`);
    console.log(`   Disk space freed: ${sizeMB} MB`);
    
  } catch (err) {
    console.error(`❌ [CLEANUP] Error: ${err.message}`);
  }
}

/**
 * Schedule daily cleanup at 3 AM
 * Also runs once on startup (after 5 minutes to avoid interfering with worker init)
 */
function scheduleCleanup() {
  // Run initial cleanup after 5 minutes (on startup)
  // Delay longer than server.js to avoid both cleaning at same time
  setTimeout(() => {
    console.log('🧹 [CLEANUP] Running initial cleanup (startup)...');
    cleanupOldLabels();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Schedule daily cleanup at 3 AM
  const scheduleNextCleanup = () => {
    const now = new Date();
    const next3AM = new Date();
    next3AM.setHours(3, 0, 0, 0);
    
    // If 3 AM already passed today, schedule for tomorrow
    if (now > next3AM) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    
    const timeUntil3AM = next3AM - now;
    
    console.log(`🧹 [CLEANUP] Next cleanup scheduled for: ${next3AM.toLocaleString()}`);
    
    setTimeout(() => {
      cleanupOldLabels();
      scheduleNextCleanup(); // Schedule next day
    }, timeUntil3AM);
  };
  
  scheduleNextCleanup();
}

// Start cleanup scheduler
scheduleCleanup();

/**
 * Generate label image (PNG)
 * Same function as in server.js but standalone for worker
 */
async function generateLabelImage(qrPath, name, location, regNumber, company) {
  const outputPath = qrPath.replace('-qr.png', '-label.png');

  // Label dimensions for Brother QL-800 (90mm x 29mm LANDSCAPE at 300 DPI)
  const width = 1063;  // 90mm at 300 DPI (horizontal)
  const height = 325;  // 29mm at 300 DPI (vertical)

  // Read QR code image - fits 29mm height with SHARP edges (no blur)
  const qrSize = 280; // Fits in 29mm height with margins
  const qrImage = await sharp(qrPath)
    .resize(qrSize, qrSize, { 
      kernel: 'nearest' // Critical: prevents blurring for QR codes
    })
    .png({ 
      quality: 100, 
      compressionLevel: 0 
    })
    .toBuffer();

  // Determine layout based on which fields are present
  const hasCompany = company && company.trim() !== '';
  const hasLocation = location && location.trim() !== '';
  
  // Calculate dynamic Y positions
  let currentY = hasCompany || hasLocation ? 85 : 140; // Start higher if we have more fields
  const nameY = currentY;
  currentY += 65; // Space after name
  
  const companyY = currentY;
  if (hasCompany) currentY += 50; // Space after company
  
  const locationY = currentY;
  if (hasLocation) currentY += 50; // Space after location
  
  const regNumberY = currentY;

  // Create label with white background (LANDSCAPE LAYOUT)
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="white"/>

      <!-- QR Code placeholder (will be composited on LEFT) -->
      <rect x="20" y="23" width="${qrSize}" height="${qrSize}" fill="#f0f0f0"/>

      <!-- Name (RIGHT SIDE) -->
      <text x="340" y="${nameY}" text-anchor="start"
            font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#000">
        ${name.substring(0, 20)}
      </text>

      ${hasCompany ? `
      <!-- Company -->
      <text x="340" y="${companyY}" text-anchor="start"
            font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#333">
        ${company.length > 25 ? company.substring(0, 25) + '...' : company}
      </text>
      ` : ''}

      ${hasLocation ? `
      <!-- Location -->
      <text x="340" y="${locationY}" text-anchor="start"
            font-family="Arial, sans-serif" font-size="42" font-weight="normal" fill="#555">
        ${location.length > 30 ? location.substring(0, 30) + '...' : location}
      </text>
      ` : ''}

      <!-- Registration Number -->
      <text x="340" y="${regNumberY}" text-anchor="start"
            font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#666">
        ${regNumber}
      </text>
    </svg>
  `;

  // Create label image with maximum quality
  await sharp(Buffer.from(svg))
    .composite([
      {
        input: qrImage,
        top: 23,
        left: 20
      }
    ])
    .png({ 
      quality: 100, // Maximum quality for printing
      compressionLevel: 0, // No compression for QR clarity
      palette: false // Full color depth
    })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Print image directly to printer
 * Converts PNG to PDF, then uses pdf-to-printer
 */
async function printImageDirectly(imagePath, printerName) {
  try {
    console.log('[Worker] 📄 Converting PNG to PDF for printing...');
    
    // Read PNG image
    const imageBytes = fs.readFileSync(imagePath);
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed PNG image
    const pngImage = await pdfDoc.embedPng(imageBytes);
    
    // Brother QL-800 label size: 90mm x 29mm (LANDSCAPE)
    // Convert to points (1mm = 2.83465 points)
    const pageWidth = 90 * 2.83465;  // ~255.1 points
    const pageHeight = 29 * 2.83465; // ~82.2 points
    
    // Add page with label dimensions
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Draw image to fit the page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfPath = imagePath.replace('-label.png', '-label.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);
    
    console.log('[Worker] ✅ PDF created:', path.basename(pdfPath));
    console.log('[Worker] 🖨️  Sending to printer:', printerName);
    
    // Print PDF silently using pdf-to-printer
    await ptp.print(pdfPath, {
      printer: printerName,
      silent: true,
    });
    
    console.log('[Worker] ✅ Print job sent successfully!');
    
    return true;
  } catch (error) {
    console.error('[Worker] ❌ Print failed:', error.message);
    throw error;
  }
}

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

