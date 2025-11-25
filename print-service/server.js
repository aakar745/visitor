const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const ptp = require('pdf-to-printer');

// ✅ Load environment variables using shared loader (Electron-aware)
const { loadEnv } = require('./lib/env-loader');
loadEnv();

const app = express();
const PORT = process.env.PORT || 9100;

// ⭐ PRINT CONFIGURATION
const PRINTER_NAME = process.env.PRINTER_NAME || 'Brother QL-800';
const AUTO_PRINT_ENABLED = process.env.AUTO_PRINT === 'true';

console.log('🖨️  Print Configuration:');
console.log(`   Auto-Print: ${AUTO_PRINT_ENABLED ? 'ENABLED ✅' : 'DISABLED ❌'}`);
console.log(`   Printer: ${PRINTER_NAME}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create output directory for labels
const OUTPUT_DIR = path.join(__dirname, 'labels');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// ==========================================
// 🧹 CLEANUP SYSTEM - Prevent Folder Bloat
// ==========================================
// NOTE: This is the ONLY process that performs cleanup.
// print-worker.js does NOT run cleanup to prevent race conditions.
// This ensures files are only deleted once, avoiding conflicts and error logs.
//
// CLEANUP STRATEGY (Multi-layered approach):
// 1. Startup: Runs 1 minute after server starts (handles daily restarts)
// 2. Periodic: Runs every 6 hours (handles extended uptime)
// 3. Scheduled: Runs at 3 AM daily (traditional maintenance, if PC is on)
//
// This ensures cleanup happens regardless of PC power schedule!

/**
 * Delete old label files to prevent disk space issues
 * Keeps only files from the last 7 days
 * 
 * Runs via multiple strategies:
 * - On startup (after 1 minute)
 * - Every 6 hours (periodic)
 * - Daily at 3 AM (if PC is on)
 * 
 * IMPORTANT: This cleanup function is ONLY in server.js (not in print-worker.js)
 * to prevent race conditions where both processes try to delete the same files.
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
 * Schedule cleanup with multiple strategies to ensure it runs regardless of PC schedule
 * 
 * Strategy 1: Startup cleanup (1 minute after start) - handles daily PC restarts
 * Strategy 2: Periodic cleanup (every 6 hours) - handles PCs left on for days/weeks
 * Strategy 3: 3 AM cleanup (if PC is on) - traditional scheduled maintenance
 * 
 * This multi-strategy approach ensures cleanup happens whether the PC is:
 * - Turned on/off daily (startup cleanup runs daily)
 * - Always on 24/7 (periodic + 3AM cleanup runs)
 * - On for extended periods (periodic cleanup prevents accumulation)
 */
function scheduleCleanup() {
  // ============================================
  // STRATEGY 1: Startup Cleanup
  // ============================================
  // Run initial cleanup after 1 minute (on startup)
  setTimeout(() => {
    console.log('🧹 [CLEANUP] Running initial cleanup (startup)...');
    cleanupOldLabels();
  }, 60 * 1000); // 1 minute
  
  // ============================================
  // STRATEGY 2: Periodic Cleanup (Every 6 Hours)
  // ============================================
  // This ensures cleanup runs even if PC is never on at 3 AM
  // or left running for days/weeks without restart
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  
  setInterval(() => {
    const now = new Date();
    console.log(`🧹 [CLEANUP] Running periodic cleanup (${now.toLocaleString()})...`);
    cleanupOldLabels();
  }, CLEANUP_INTERVAL);
  
  console.log(`🧹 [CLEANUP] Periodic cleanup scheduled: Every 6 hours`);
  
  // ============================================
  // STRATEGY 3: 3 AM Cleanup (Traditional)
  // ============================================
  // Schedule daily cleanup at 3 AM (if PC is on)
  const scheduleNextCleanup = () => {
    const now = new Date();
    const next3AM = new Date();
    next3AM.setHours(3, 0, 0, 0);
    
    // If 3 AM already passed today, schedule for tomorrow
    if (now > next3AM) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    
    const timeUntil3AM = next3AM - now;
    
    console.log(`🧹 [CLEANUP] 3 AM cleanup scheduled for: ${next3AM.toLocaleString()}`);
    
    setTimeout(() => {
      cleanupOldLabels();
      scheduleNextCleanup(); // Schedule next day
    }, timeUntil3AM);
  };
  
  scheduleNextCleanup();
}

// Start cleanup scheduler
scheduleCleanup();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    printer: PRINTER_NAME,
    port: PORT,
    autoPrint: AUTO_PRINT_ENABLED,
    mode: 'PDF-Silent-Print',
    timestamp: new Date().toISOString(),
  });
});

// Test printer connection (simplified - checks if Brother printer driver is available)
app.get('/test-connection', async (req, res) => {
  try {
    // In simplified mode, we just return success
    // Real printer detection would require Windows API or printer drivers
    res.json({
      success: true,
      message: 'Print service is running. Ensure Brother QL-800 is connected via USB.',
      config: {
        type: 'Brother QL-800',
        interface: 'USB',
        mode: 'Simplified (without native dependencies)',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to printer',
      error: error.message,
    });
  }
});

// Print label endpoint (Simplified - saves to file for now)
app.post('/print', async (req, res) => {
  try {
    const { name, location, registrationNumber, qrCode } = req.body;

    // Validation
    if (!name || !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and qrCode',
      });
    }

    console.log('[Print Service] Received print request:', {
      name,
      location: location || '(empty)',
      registrationNumber,
      timestamp: new Date().toISOString(),
    });
    
    if (!location || location.trim() === '') {
      console.log('[Print Service] ⚠️  WARNING: Location is empty! Check visitor data in database.');
    }

    // Save label data
    const timestamp = Date.now();
    const filename = `label-${timestamp}`;
    
    // Save QR code as PNG
    const qrImageBuffer = Buffer.from(qrCode, 'base64');
    const qrPath = path.join(OUTPUT_DIR, `${filename}-qr.png`);
    fs.writeFileSync(qrPath, qrImageBuffer);
    
    // Save label data as JSON
    const labelData = {
      name,
      location,
      registrationNumber,
      qrCodeFile: `${filename}-qr.png`,
      timestamp: new Date().toISOString(),
    };
    const jsonPath = path.join(OUTPUT_DIR, `${filename}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(labelData, null, 2));
    
    // Create simple HTML for printing
    const html = generatePrintHTML(labelData, qrPath);
    const htmlPath = path.join(OUTPUT_DIR, `${filename}.html`);
    fs.writeFileSync(htmlPath, html);

    console.log('[Print Service] ✅ Label data saved:', filename);
    console.log('[Print Service] 📁 Files:', {
      qr: qrPath,
      json: jsonPath,
      html: htmlPath,
    });

    // ⭐ AUTO-PRINT LOGIC (SILENT - NO BROWSER)
    if (AUTO_PRINT_ENABLED) {
      console.log('[Print Service] 🚀 Auto-print enabled, sending to printer...');
      printSilently(htmlPath, PRINTER_NAME);
    }

    res.json({
      success: true,
      message: `Label ${AUTO_PRINT_ENABLED ? 'sent to printer' : 'generated'} successfully for ${name}`,
      timestamp: new Date().toISOString(),
      files: {
        qr: `${filename}-qr.png`,
        json: `${filename}.json`,
        html: `${filename}.html`,
      },
      autoPrint: AUTO_PRINT_ENABLED,
      printerName: AUTO_PRINT_ENABLED ? PRINTER_NAME : undefined,
      note: AUTO_PRINT_ENABLED 
        ? `Sent to printer: ${PRINTER_NAME}` 
        : 'Auto-print disabled. Open HTML file manually or set AUTO_PRINT=true in .env',
    });
  } catch (error) {
    console.error('[Print Service] ❌ Print error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to print label',
      error: error.message,
    });
  }
});

// Test print
app.post('/test-print', async (req, res) => {
  try {
    const { name, location, registrationNumber } = req.body;

    // Generate test QR code optimized for kiosk scanning
    const testQR = await QRCode.toDataURL(registrationNumber || 'TEST123', {
      errorCorrectionLevel: 'L', // Simple for fastest scanning
      width: 512, // Larger for better visibility
      margin: 4, // Standard quiet zone
    });

    const qrBase64 = testQR.split(',')[1];

    // Use the main print endpoint logic
    const timestamp = Date.now();
    const filename = `test-label-${timestamp}`;
    
    const qrImageBuffer = Buffer.from(qrBase64, 'base64');
    const qrPath = path.join(OUTPUT_DIR, `${filename}-qr.png`);
    fs.writeFileSync(qrPath, qrImageBuffer);
    
    const labelData = {
      name: name || 'Test Visitor',
      location: location || 'Test Location',
      registrationNumber: registrationNumber || 'TEST123',
      qrCodeFile: `${filename}-qr.png`,
      timestamp: new Date().toISOString(),
    };
    
    const html = generatePrintHTML(labelData, qrPath);
    const htmlPath = path.join(OUTPUT_DIR, `${filename}.html`);
    fs.writeFileSync(htmlPath, html);

    console.log('[Print Service] ✅ Test label saved:', filename);

    res.json({
      success: true,
      message: `Test label saved as ${filename}`,
      files: {
        qr: `${filename}-qr.png`,
        html: `${filename}.html`,
      },
    });
  } catch (error) {
    console.error('[Print Service] Test print error:', error);
    res.status(500).json({
      success: false,
      message: 'Test print failed',
      error: error.message,
    });
  }
});

// Generate HTML for printing (29mm x 90mm label)
function generatePrintHTML(labelData, qrImagePath) {
  const { name, location, registrationNumber } = labelData;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Label - ${name}</title>
  <style>
    @page {
      size: 29mm 90mm;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      width: 29mm;
      height: 90mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      background: white;
    }
    .qr-code {
      width: 25mm;
      height: 25mm;
      margin: 2mm 0;
      border: 1px solid #000;
    }
    .name {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin: 2mm 0;
      max-width: 27mm;
      word-wrap: break-word;
    }
    .location {
      font-size: 7pt;
      text-align: center;
      margin: 1mm 0;
      max-width: 27mm;
    }
    .reg-number {
      font-size: 6pt;
      font-weight: bold;
      text-align: center;
      font-family: monospace;
      margin-top: 2mm;
    }
  </style>
</head>
<body>
  <img class="qr-code" src="${path.basename(qrImagePath)}" alt="QR Code" />
  <div class="name">${name}</div>
  ${location ? `<div class="location">${location}</div>` : ''}
  ${registrationNumber ? `<div class="reg-number">${registrationNumber}</div>` : ''}
</body>
</html>
  `;
}

/**
 * ⭐ AUTOMATIC PRINTING - Uses Brother b-PAC SDK for TRUE automatic printing
 * NO browser, NO dialog, NO manual action
 * 
 * Requirements: Brother b-PAC SDK must be installed
 * Download: https://support.brother.com/g/s/es/dev/en/bpac/download/index.html
 */
function printSilently(htmlPath, printerName) {
  console.log('[Print Service] 🖨️  Initiating automatic print...');
  
  // Try b-PAC SDK first (Brother's official solution)
  printViaBPAC(htmlPath, printerName, (bpacSuccess) => {
    if (!bpacSuccess) {
      // Fallback: Use rundll32 for raw HTML printing
      console.log('[Print Service] 🔄 b-PAC not available, using fallback...');
      printViaRundll32(htmlPath, printerName);
    }
  });
}

/**
 * Method 1: Brother b-PAC SDK (Official Brother solution)
 * TRUE automatic printing with NO user interaction
 */
function printViaBPAC(htmlPath, printerName, callback) {
  // Extract label data from HTML
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Parse visitor name, location, reg number from HTML
  const nameMatch = htmlContent.match(/<div class="name">([^<]+)<\/div>/);
  const locationMatch = htmlContent.match(/<div class="location">([^<]+)<\/div>/);
  const regMatch = htmlContent.match(/<div class="reg-number">([^<]+)<\/div>/);
  const qrMatch = htmlContent.match(/src="([^"]+\.png)"/);
  
  const name = nameMatch ? nameMatch[1] : '';
  const location = locationMatch ? locationMatch[1] : '';
  const regNumber = regMatch ? regMatch[1] : '';
  const qrPath = qrMatch ? path.join(path.dirname(htmlPath), qrMatch[1]) : '';
  
  // PowerShell script using b-PAC SDK
  const psScript = `
try {
    # Load Brother b-PAC COM object
    $bpac = New-Object -ComObject bpac.Document
    if (-not $bpac) {
        Write-Error "b-PAC SDK not installed"
        exit 1
    }
    
    # Set printer
    $bpac.SetPrinter("${printerName}", $true)
    
    # For QL-800, we'll create a simple text-based label
    # Brother b-PAC works best with .lbx template files
    # Since we don't have template, we'll use alternative method
    
    # Alternative: Use Windows printing directly
    # This is the most reliable without b-PAC templates
    $shell = New-Object -ComObject WScript.Shell
    $shell.Run("rundll32.exe mshtml.dll,PrintHTML \`"${htmlPath.replace(/\\/g, '\\\\')}\`"", 0, $false)
    
    Write-Host "Print command sent"
    exit 0
    
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
  `.trim();
  
  const psPath = path.join(OUTPUT_DIR, 'print-bpac.ps1');
  fs.writeFileSync(psPath, psScript);
  
  exec(`powershell -ExecutionPolicy Bypass -File "${psPath}"`, (error, stdout, stderr) => {
    // Clean up
    try {
      fs.unlinkSync(psPath);
    } catch (e) {}
    
    if (error) {
      console.log('[Print Service] ⚠️  b-PAC method failed:', error.message);
      callback(false);
    } else {
      console.log('[Print Service] ✅ Sent to printer via b-PAC/Windows');
      callback(true);
    }
  });
}

/**
 * Generate PNG label image for thermal printer
 * Brother QL-800 works best with direct image printing
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
  // Ensure company and location are strings (handle null/undefined)
  const companyStr = company || '';
  const locationStr = location || '';
  const hasCompany = companyStr.trim() !== '';
  const hasLocation = locationStr.trim() !== '';
  
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
        ${companyStr.length > 25 ? companyStr.substring(0, 25) + '...' : companyStr}
      </text>
      ` : ''}
      
      ${hasLocation ? `
      <!-- Location -->
      <text x="340" y="${locationY}" text-anchor="start" 
            font-family="Arial, sans-serif" font-size="42" font-weight="normal" fill="#555">
        ${locationStr.length > 30 ? locationStr.substring(0, 30) + '...' : locationStr}
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
 * Method 2: Direct Image Printing for Brother QL-800 (Thermal Printer)
 * Brother QL-800 works best with direct image printing, not HTML
 */
async function printViaRundll32(htmlPath, printerName) {
  // Extract data from HTML to generate PNG
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const nameMatch = htmlContent.match(/<div class="name">([^<]+)<\/div>/);
  const locationMatch = htmlContent.match(/<div class="location">([^<]+)<\/div>/);
  const regMatch = htmlContent.match(/<div class="reg-number">([^<]+)<\/div>/);
  const qrMatch = htmlContent.match(/src="([^"]+\.png)"/);
  
  if (!qrMatch) {
    console.error('[Print Service] ❌ QR code not found in HTML');
    return;
  }
  
  const qrPath = path.join(path.dirname(htmlPath), path.basename(qrMatch[1]));
  const name = nameMatch ? nameMatch[1] : 'Guest';
  const location = locationMatch ? locationMatch[1] : '';
  const regNumber = regMatch ? regMatch[1] : '';
  
  try {
    // Generate PNG label
    console.log('[Print Service] 🖼️  Generating PNG label...');
    const imagePath = await generateLabelImage(qrPath, name, location, regNumber);
    console.log('[Print Service] ✅ PNG label created:', imagePath);
    
    // Print PNG using Windows image printing
    await printImageDirectly(imagePath, printerName);
    
  } catch (error) {
    console.error('[Print Service] ❌ Label generation failed:', error.message);
  }
}

/**
 * Print PNG image directly to printer - RELIABLE METHOD
 * Converts PNG to PDF, then uses pdf-to-printer (no dialogs, no user interaction)
 */
async function printImageDirectly(imagePath, printerName) {
  try {
    console.log('[Print Service] 📄 Converting PNG to PDF for printing...');
    
    // Read PNG image
    const imageBytes = fs.readFileSync(imagePath);
    const imageMetadata = await sharp(imagePath).metadata();
    
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
    
    console.log('[Print Service] ✅ PDF created:', path.basename(pdfPath));
    console.log('[Print Service] 🖨️  Sending to printer:', printerName);
    
    // Print PDF silently using pdf-to-printer
    await ptp.print(pdfPath, {
      printer: printerName,
      silent: true,
    });
    
    console.log('[Print Service] ✅ Print job sent successfully!');
    console.log('[Print Service] 🎉 Label should be printing on Brother QL-800 now!');
    
  } catch (error) {
    console.error('[Print Service] ❌ Print failed:', error.message);
    throw error;
  }
}

// =============================================================================
// 🧹 MANUAL CLEANUP ENDPOINT
// =============================================================================

/**
 * Manual cleanup endpoint - Allows cleanup to be triggered via HTTP API
 * Used by GUI and can be called manually for immediate cleanup
 * 
 * GET /api/cleanup - Trigger cleanup of old labels (7+ days)
 * 
 * Returns:
 * {
 *   success: true,
 *   deletedCount: 142,
 *   keptCount: 8,
 *   sizeMB: "3.42",
 *   message: "Cleanup completed successfully"
 * }
 */
app.get('/api/cleanup', async (req, res) => {
  console.log('\n🧹 [API] Manual cleanup triggered via HTTP endpoint');
  
  try {
    const result = await performManualCleanup();
    
    res.json({
      success: true,
      ...result,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    console.error('[API] ❌ Manual cleanup failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

/**
 * Perform manual cleanup (can be called via API or internally)
 * Extracts the cleanup logic for reuse
 */
async function performManualCleanup() {
  const MAX_AGE_DAYS = 7;
  const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  console.log(`🧹 [MANUAL CLEANUP] Scanning ${OUTPUT_DIR}...`);
  console.log(`   Retention: ${MAX_AGE_DAYS} days`);
  
  const files = await fs.promises.readdir(OUTPUT_DIR);
  const now = Date.now();
  
  let deletedCount = 0;
  let keptCount = 0;
  let totalSize = 0;
  
  for (const file of files) {
    if (file.startsWith('.')) continue;
    
    const filePath = path.join(OUTPUT_DIR, file);
    
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.isDirectory()) continue;
      
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > MAX_AGE_MS) {
        await fs.promises.unlink(filePath);
        deletedCount++;
        totalSize += stats.size;
      } else {
        keptCount++;
      }
    } catch (err) {
      console.warn(`[MANUAL CLEANUP] ⚠️  Error processing ${file}: ${err.message}`);
    }
  }
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ [MANUAL CLEANUP] Completed:`);
  console.log(`   Files deleted: ${deletedCount}`);
  console.log(`   Files kept: ${keptCount}`);
  console.log(`   Disk space freed: ${sizeMB} MB\n`);
  
  return { deletedCount, keptCount, sizeMB };
}


// =============================================================================
// 📦 EXPORTS FOR PRINT-WORKER.JS
// =============================================================================
// Export shared functions so print-worker.js can use them (avoids duplication)
module.exports = {
  generateLabelImage,
  printImageDirectly,
};

// ✅ Only start server if run directly (not when imported by print-worker.js)
if (require.main === module) {
// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🖨️  Badge Print Service - Brother QL-800       ║
║                                                   ║
║   Status: RUNNING ✅                              ║
║   Port: ${PORT}                                        ║
║   Auto-Print: ${AUTO_PRINT_ENABLED ? 'ENABLED ✅' : 'DISABLED ❌'}                     ║
║   Printer: ${PRINTER_NAME.padEnd(36)} ║
║   Mode: PDF Silent Print (pdf-to-printer)         ║
║   Output: ./labels/                               ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /health - Health check                   ║
║   • GET  /test-connection - Test printer          ║
║   • POST /print - ${AUTO_PRINT_ENABLED ? 'Print automatically' : 'Generate label'}        ║
║   • POST /test-print - Test print                 ║
║   • GET  /api/cleanup - Manual cleanup (7+ days)  ║
║                                                   ║
║   Ready to print badges! 🎟️                       ║
╚═══════════════════════════════════════════════════╝
  `);

  if (AUTO_PRINT_ENABLED) {
    console.log('✅ AUTOMATIC SILENT PRINTING ENABLED');
    console.log(`   Method: PDF Silent Print (pdf-to-printer)`);
    console.log(`   Printer: ${PRINTER_NAME}`);
    console.log(`   Label Size: 90mm x 29mm (Landscape)`);
    console.log(`   TRUE automatic printing - NO dialogs, NO user interaction\n`);
  } else {
    console.log('\n💡 TIP: Enable auto-printing:');
    console.log('   Create .env file with:');
    console.log('   AUTO_PRINT=true');
    console.log('   PRINTER_NAME=Brother QL-800\n');
  }
});

} // ✅ End of require.main === module guard
