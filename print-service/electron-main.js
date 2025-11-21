/**
 * 🖨️ Print Service Manager - Electron Main Process
 * 
 * System tray application for managing the Brother QL-800 Print Service
 * Non-technical users can start/stop the service with one click
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const Redis = require('ioredis');

// Helper function to find Node.js executable
function findNodeExecutable() {
  // In development (npm run gui), use 'node' from PATH
  if (process.defaultApp || !app.isPackaged) {
    return 'node';
  }
  
  // In production (packaged .exe), use Electron's bundled Node.js
  // process.execPath points to the Electron executable which has Node.js built-in
  // We need to extract the bundled node.exe or use electron.exe to run Node scripts
  
  // Electron bundles Node.js - we can use it directly
  // For Windows packaged app, use the bundled node.exe
  const electronDir = path.dirname(process.execPath);
  const bundledNode = path.join(electronDir, 'node.exe');
  
  // Check if bundled node.exe exists (some Electron versions include it separately)
  if (fs.existsSync(bundledNode)) {
    console.log('✅ Using bundled Node.js:', bundledNode);
    return bundledNode;
  }
  
  // Otherwise, use electron.exe itself (it can run Node.js scripts)
  // This is the fallback - Electron can execute Node.js code
  console.log('✅ Using Electron executable as Node.js:', process.execPath);
  return process.execPath;
}

// Service management
let workerProcess = null;
let serverProcess = null;
let redisProcess = null;
let mainWindow = null;
let tray = null;
let isQuitting = false;

const iconPath = path.join(__dirname, 'gui', 'icon.ico');
const trayIconPath = path.join(__dirname, 'gui', 'icon.ico');

// Service status
let serviceStatus = {
  worker: false,
  server: false,
  redis: 'checking'
};

/**
 * Check if Redis is already running on a given port
 */
async function isRedisRunning(host = 'localhost', port = 6379, password = '') {
  try {
    const config = {
      host,
      port,
      retryStrategy: () => null, // Don't retry
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000
    };
    
    // Add password if provided
    if (password) {
      config.password = password;
    }
    
    const testRedis = new Redis(config);
    
    await testRedis.connect();
    await testRedis.ping();
    testRedis.disconnect();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Start bundled Redis server (only if not already running)
 */
async function startBundledRedis() {
  // Read Redis config from .env if exists
  let REDIS_HOST = 'localhost';
  let REDIS_PORT = 6379;
  let REDIS_PASSWORD = '';
  
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hostMatch = envContent.match(/REDIS_HOST=(.+)/);
      const portMatch = envContent.match(/REDIS_PORT=(.+)/);
      const passMatch = envContent.match(/REDIS_PASSWORD=(.+)/);
      
      if (hostMatch) REDIS_HOST = hostMatch[1].trim();
      if (portMatch) REDIS_PORT = parseInt(portMatch[1].trim(), 10);
      if (passMatch) REDIS_PASSWORD = passMatch[1].trim();
    }
  } catch (err) {
    // Use defaults
  }
  
  // First, check if Redis is already running (external or production)
  console.log('🔍 Checking if Redis is already running...');
  const alreadyRunning = await isRedisRunning(REDIS_HOST, REDIS_PORT, REDIS_PASSWORD);
  
  if (alreadyRunning) {
    console.log(`✅ Redis is already running on ${REDIS_HOST}:${REDIS_PORT}`);
    if (REDIS_HOST !== 'localhost' && REDIS_HOST !== '127.0.0.1') {
      console.log(`🌐 Using PRODUCTION Redis server at ${REDIS_HOST}`);
    } else {
      console.log('ℹ️  Using existing Redis instance (no need to start bundled Redis)');
    }
    serviceStatus.redis = 'external';
    return;
  }
  
  console.log('ℹ️  No Redis found - starting bundled Redis server...');
  
  const redisExePath = path.join(__dirname, 'redis', 'redis-server.exe');
  
  // Check if Redis executable exists
  if (!fs.existsSync(redisExePath)) {
    console.error('❌ Redis executable not found at:', redisExePath);
    console.log('ℹ️  Redis will need to be installed separately or kiosks must connect to central Redis server');
    serviceStatus.redis = 'missing';
    return;
  }
  
  console.log('🚀 Starting bundled Redis server...');
  console.log('   Redis Path:', redisExePath);
  console.log('   Mode: Command-line arguments (no config file)');
  
  try {
    // Start Redis with command-line arguments (no config file needed)
    // This avoids Windows path issues with msys2 Redis
    const redisArgs = [
      '--port', REDIS_PORT.toString(),
      '--bind', REDIS_HOST,
      '--protected-mode', 'no',
      '--daemonize', 'no',
      '--save', '""',           // Disable RDB snapshots
      '--appendonly', 'no',     // Disable AOF
      '--loglevel', 'notice',
      '--maxclients', '3000'    // Reduced for Windows compatibility
    ];
    
    redisProcess = spawn(redisExePath, redisArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],  // Capture stdout and stderr for debugging
      detached: false,  // Keep tied to parent process
      windowsHide: true, // Hide window on Windows
      cwd: path.join(__dirname, 'redis')  // Set working directory to redis folder
    });
    
    // Capture Redis output for debugging
    redisProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      // Only log important messages
      if (output.includes('Ready to accept connections') || output.includes('Running mode')) {
        console.log('[Redis]', output);
      }
    });
    
    redisProcess.stderr.on('data', (data) => {
      console.error('[Redis Error]', data.toString().trim());
    });
    
    redisProcess.on('error', (err) => {
      console.error('❌ Redis failed to start:', err.message);
      serviceStatus.redis = 'failed';
    });
    
    redisProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        console.log(`⚠️ Redis process exited with code: ${code}, signal: ${signal}`);
      }
      serviceStatus.redis = 'stopped';
      redisProcess = null;
    });
    
    console.log('✅ Bundled Redis server started on port 6379');
    serviceStatus.redis = 'running';
    
  } catch (err) {
    console.error('❌ Error starting Redis:', err.message);
    serviceStatus.redis = 'failed';
  }
}

/**
 * Stop bundled Redis server
 */
function stopBundledRedis() {
  if (redisProcess) {
    console.log('🛑 Stopping Redis server...');
    try {
      redisProcess.kill();
      redisProcess = null;
      serviceStatus.redis = 'stopped';
      console.log('✅ Redis server stopped');
    } catch (err) {
      console.error('❌ Error stopping Redis:', err.message);
    }
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    show: false, // Don't show until ready
    autoHideMenuBar: true,
    // Only set icon if file exists
    ...(fs.existsSync(iconPath) && { icon: iconPath }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'gui', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * Create system tray icon and menu
 */
function createTray() {
  // Use a simple icon if tray icon doesn't exist
  // Skip tray creation if no icon available (will just use window)
  let iconFile = null;
  
  if (fs.existsSync(trayIconPath)) {
    iconFile = trayIconPath;
  } else if (fs.existsSync(iconPath)) {
    iconFile = iconPath;
  }
  
  // If no icon exists, skip tray creation (app will work without it)
  if (!iconFile) {
    console.log('⚠️ No icon found - skipping system tray. App will work normally.');
    return;
  }
  
  tray = new Tray(iconFile);
  
  updateTrayMenu();
  
  tray.setToolTip('Print Service Manager');
  
  // Click to show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

/**
 * Update tray context menu
 */
function updateTrayMenu() {
  // Skip if tray not created (no icon available)
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Print Worker: ${serviceStatus.worker ? '🟢 Running' : '🔴 Stopped'}`,
      enabled: false
    },
    {
      label: `HTTP Server: ${serviceStatus.server ? '🟢 Running' : '🔴 Stopped'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: serviceStatus.worker ? 'Stop Print Worker' : 'Start Print Worker',
      click: () => {
        if (serviceStatus.worker) {
          stopWorker();
        } else {
          startWorker();
        }
      }
    },
    {
      label: serviceStatus.server ? 'Stop HTTP Server' : 'Start HTTP Server',
      click: () => {
        if (serviceStatus.server) {
          stopServer();
        } else {
          startServer();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

/**
 * Start the Print Worker (BullMQ consumer)
 */
async function startWorker() {
  if (workerProcess) {
    sendToWindow('log', '⚠️ Worker already running');
    return;
  }

  // Check Redis before starting worker
  if (serviceStatus.redis !== 'running') {
    sendToWindow('log', '⚠️ Checking Redis connection before starting worker...');
    await checkRedis();
    
    if (serviceStatus.redis !== 'running') {
      sendToWindow('log', '❌ Cannot start worker: Redis is not running!');
      sendToWindow('log', '💡 Please start Redis first (Docker or Windows service)');
      return;
    }
  }

  sendToWindow('log', '🚀 Starting Print Worker...');
  
  const nodePath = findNodeExecutable();
  
  // In production (asar disabled), resources are in app folder
  const appPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'app')
    : __dirname;
  
  const workerPath = path.join(appPath, 'print-worker.js');
  
  sendToWindow('log', `Using Node.js: ${nodePath}`);
  sendToWindow('log', `Worker path: ${workerPath}`);
  
  const userDataPath = app.getPath('userData');
  
  workerProcess = spawn(nodePath, [workerPath], {
    cwd: appPath, // Set working directory so worker can find node_modules
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1', // Critical: Run as Node.js, not as GUI!
      USER_DATA_PATH: userDataPath // Pass user data path for .env file location
    }
  });

  workerProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    sendToWindow('log', `[Worker] ${message}`);
  });

  workerProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    sendToWindow('log', `[Worker Error] ${message}`);
  });

  workerProcess.on('error', (error) => {
    sendToWindow('log', `❌ Worker error: ${error.message}`);
    if (error.code === 'ENOENT') {
      sendToWindow('log', '⚠️ Node.js not found! Please install Node.js from https://nodejs.org/');
      sendToWindow('log', '💡 The packaged app requires Node.js to be installed on this computer.');
    }
    workerProcess = null;
    serviceStatus.worker = false;
    updateTrayMenu();
    sendToWindow('status-update', serviceStatus);
  });

  workerProcess.on('close', (code) => {
    sendToWindow('log', `⛔ Worker stopped (exit code: ${code})`);
    workerProcess = null;
    serviceStatus.worker = false;
    updateTrayMenu();
    sendToWindow('status-update', serviceStatus);
  });

  serviceStatus.worker = true;
  updateTrayMenu();
  sendToWindow('status-update', serviceStatus);
  sendToWindow('log', '✅ Print Worker started');
}

/**
 * Stop the Print Worker
 */
function stopWorker() {
  if (!workerProcess) {
    sendToWindow('log', '⚠️ Worker not running');
    return;
  }

  sendToWindow('log', '🛑 Stopping Print Worker...');
  
  workerProcess.kill();
  workerProcess = null;
  serviceStatus.worker = false;
  updateTrayMenu();
  sendToWindow('status-update', serviceStatus);
  sendToWindow('log', '✅ Print Worker stopped');
}

/**
 * Start the HTTP Server (legacy direct print endpoint)
 */
function startServer() {
  if (serverProcess) {
    sendToWindow('log', '⚠️ Server already running');
    return;
  }

  sendToWindow('log', '🚀 Starting HTTP Server...');
  
  const nodePath = findNodeExecutable();
  
  // In production (asar disabled), resources are in app folder
  const appPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'app')
    : __dirname;
  
  const serverPath = path.join(appPath, 'server.js');
  
  sendToWindow('log', `Using Node.js: ${nodePath}`);
  sendToWindow('log', `Server path: ${serverPath}`);
  
  const userDataPath = app.getPath('userData');
  
  serverProcess = spawn(nodePath, [serverPath], {
    cwd: appPath, // Set working directory so server can find node_modules
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1', // Critical: Run as Node.js, not as GUI!
      USER_DATA_PATH: userDataPath // Pass user data path for .env file location
    }
  });

  serverProcess.stdout.on('data', (data) => {
    const message = data.toString().trim();
    sendToWindow('log', `[Server] ${message}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString().trim();
    sendToWindow('log', `[Server Error] ${message}`);
  });

  serverProcess.on('close', (code) => {
    sendToWindow('log', `⛔ Server stopped (exit code: ${code})`);
    serverProcess = null;
    serviceStatus.server = false;
    updateTrayMenu();
    sendToWindow('status-update', serviceStatus);
  });

  serviceStatus.server = true;
  updateTrayMenu();
  sendToWindow('status-update', serviceStatus);
  sendToWindow('log', '✅ HTTP Server started');
}

/**
 * Stop the HTTP Server
 */
function stopServer() {
  if (!serverProcess) {
    sendToWindow('log', '⚠️ Server not running');
    return;
  }

  sendToWindow('log', '🛑 Stopping HTTP Server...');
  
  serverProcess.kill();
  serverProcess = null;
  serviceStatus.server = false;
  updateTrayMenu();
  sendToWindow('status-update', serviceStatus);
  sendToWindow('log', '✅ HTTP Server stopped');
}

/**
 * Send message to renderer process
 */
function sendToWindow(channel, data) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

/**
 * Check if Redis is running using proper Redis client
 * Uses ioredis to connect and ping Redis server
 */
async function checkRedis() {
  sendToWindow('log', '🔍 Checking Redis connection...');
  
  // Read Redis config from .env if exists
  let redisHost = 'localhost';
  let redisPort = 6379;
  let redisPassword = '';
  let redisDb = 0;
  
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hostMatch = envContent.match(/REDIS_HOST=(.+)/);
      const portMatch = envContent.match(/REDIS_PORT=(.+)/);
      const passMatch = envContent.match(/REDIS_PASSWORD=(.+)/);
      const dbMatch = envContent.match(/REDIS_DB=(.+)/);
      
      if (hostMatch) redisHost = hostMatch[1].trim();
      if (portMatch) redisPort = parseInt(portMatch[1].trim(), 10);
      if (passMatch) redisPassword = passMatch[1].trim();
      if (dbMatch) redisDb = parseInt(dbMatch[1].trim(), 10);
    }
  } catch (err) {
    // Use defaults
  }
  
  // Create Redis client with timeout
  const config = {
    host: redisHost,
    port: redisPort,
    db: redisDb,
    connectTimeout: 3000,
    retryStrategy: () => null, // Don't retry, fail fast
    lazyConnect: true,
  };
  
  // Add password if provided
  if (redisPassword) {
    config.password = redisPassword;
  }
  
  const redisClient = new Redis(config);
  
  try {
    // Try to connect
    await redisClient.connect();
    
    // Try to ping
    const result = await redisClient.ping();
    
    if (result === 'PONG') {
      serviceStatus.redis = 'running';
      sendToWindow('log', `✅ Redis is running at ${redisHost}:${redisPort}`);
    } else {
      serviceStatus.redis = 'error';
      sendToWindow('log', '⚠️ Redis responded but with unexpected result');
    }
    
    await redisClient.quit();
  } catch (error) {
    serviceStatus.redis = 'not_running';
    sendToWindow('log', `❌ Redis not running at ${redisHost}:${redisPort}`);
    sendToWindow('log', `⚠️ Worker will NOT function without Redis!`);
    sendToWindow('log', `💡 Make sure Redis is running (Docker or Windows service)`);
  }
  
  sendToWindow('status-update', serviceStatus);
}

/**
 * Get list of available printers using PowerShell
 * wmic doesn't work on all systems, PowerShell is more reliable
 */
async function getPrinters() {
  return new Promise((resolve, reject) => {
    // Use PowerShell to get printers (more reliable than wmic)
    exec('powershell -Command "Get-Printer | Select-Object -ExpandProperty Name"', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n').map(line => line.trim()).filter(line => line && line !== '');
      resolve(lines);
    });
  });
}

// =============================================================================
// IPC Handlers
// =============================================================================

ipcMain.handle('start-worker', async () => {
  startWorker();
  return { success: true };
});

ipcMain.handle('stop-worker', async () => {
  stopWorker();
  return { success: true };
});

ipcMain.handle('start-server', async () => {
  startServer();
  return { success: true };
});

ipcMain.handle('stop-server', async () => {
  stopServer();
  return { success: true };
});

ipcMain.handle('get-status', async () => {
  return serviceStatus;
});

ipcMain.handle('check-redis', async () => {
  checkRedis();
  return { success: true };
});

ipcMain.handle('get-printers', async () => {
  try {
    const printers = await getPrinters();
    return { success: true, printers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-folder', async () => {
  const labelsPath = path.join(__dirname, 'labels');
  require('electron').shell.openPath(labelsPath);
  return { success: true };
});

/**
 * Manual cleanup trigger for GUI
 * Delete old label files (older than 7 days)
 * 
 * NOTE: This cleanup logic mirrors server.js performManualCleanup()
 * Both use the same retention period (7 days) and logic.
 * 
 * The automated cleanup schedule in server.js:
 * 1. On startup (after 1 minute) - handles daily PC restarts
 * 2. Every 6 hours - handles extended uptime (PC left on for days/weeks)
 * 3. Daily at 3 AM - traditional maintenance (if PC is on)
 * 
 * This GUI button allows manual cleanup on demand, independent of the schedule.
 */
ipcMain.handle('cleanup-labels', async () => {
  const labelsPath = path.join(__dirname, 'labels');
  const MAX_AGE_DAYS = 7; // Must match server.js MAX_AGE_DAYS
  const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  sendToWindow('log', '🧹 Starting manual cleanup...');
  
  try {
    const files = await fs.promises.readdir(labelsPath);
    const now = Date.now();
    
    let deletedCount = 0;
    let keptCount = 0;
    let totalSize = 0;
    
    for (const file of files) {
      if (file.startsWith('.')) continue;
      
      const filePath = path.join(labelsPath, file);
      
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
        sendToWindow('log', `⚠️ Error processing ${file}: ${err.message}`);
      }
    }
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    sendToWindow('log', `✅ Cleanup complete:`);
    sendToWindow('log', `   Deleted: ${deletedCount} files`);
    sendToWindow('log', `   Kept: ${keptCount} files`);
    sendToWindow('log', `   Freed: ${sizeMB} MB`);
    
    return { 
      success: true, 
      deletedCount, 
      keptCount, 
      sizeMB 
    };
  } catch (error) {
    sendToWindow('log', `❌ Cleanup failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-config', async () => {
  try {
    // Use user data directory (writable, no admin required)
    const userDataPath = app.getPath('userData');
    const envPath = path.join(userDataPath, '.env');
    
    if (!fs.existsSync(envPath)) {
      return { success: true, config: { kioskId: '', printerName: '' } };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const config = {};
    
    lines.forEach(line => {
      const match = line.match(/^(KIOSK_ID|PRINTER_NAME)=(.*)$/);
      if (match) {
        const key = match[1] === 'KIOSK_ID' ? 'kioskId' : 'printerName';
        config[key] = match[2].trim();
      }
    });
    
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message, config: {} };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    // Use user data directory (writable, no admin required)
    const userDataPath = app.getPath('userData');
    const envPath = path.join(userDataPath, '.env');
    
    console.log(`💾 Saving config to: ${envPath}`);
    sendToWindow('log', `💾 Config location: ${envPath}`);
    
    let envContent = '';
    
    // Try to load existing .env from new location
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      // If new location doesn't exist, try to migrate from old location
      const oldEnvPath = path.join(__dirname, '.env');
      if (fs.existsSync(oldEnvPath)) {
        try {
          envContent = fs.readFileSync(oldEnvPath, 'utf8');
          sendToWindow('log', '🔄 Migrating configuration from old location...');
        } catch (error) {
          // Can't read old location (permission denied), start fresh
          sendToWindow('log', '⚠️ Creating new configuration file...');
        }
      }
    }
    
    // Parse existing env content into key-value pairs
    const envVars = {};
    if (envContent) {
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }
    
    // Update only the values we manage
    if (config.printerName !== undefined) {
      envVars['PRINTER_NAME'] = config.printerName;
    }
    if (config.kioskId !== undefined) {
      envVars['KIOSK_ID'] = config.kioskId;
    }
    
    // Rebuild .env content preserving ALL variables
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, newEnvContent + '\n');
    
    // Debug: Show what was saved
    sendToWindow('log', '✅ Configuration file updated successfully');
    sendToWindow('log', '📝 File contents:');
    const savedLines = envContent.trim().split('\n');
    savedLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        // Hide password values
        if (line.includes('PASSWORD')) {
          const key = line.split('=')[0];
          sendToWindow('log', `   ${key}=***`);
        } else {
          sendToWindow('log', `   ${line}`);
        }
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// =============================================================================
// App Lifecycle
// =============================================================================

app.whenReady().then(async () => {
  // PRODUCTION MODE: Connect to external Redis (no bundled Redis)
  // Redis credentials must be configured in .env file
  console.log('🔍 Production Mode: Looking for external Redis...');
  
  createWindow();
  createTray();
  
  // Check Redis connection after a brief delay
  setTimeout(() => {
    checkRedis();
  }, 1000);
  
  // Periodically check Redis status (every 30 seconds)
  setInterval(() => {
    checkRedis();
  }, 30000);
  
  // Auto-start worker if configured
  const autoStart = process.env.AUTO_START_WORKER === 'true';
  if (autoStart) {
    setTimeout(() => {
      startWorker();
    }, 2000);
  }
});

app.on('window-all-closed', () => {
  // Don't quit on window close (minimize to tray)
  // Only quit when explicitly requested
});

app.on('before-quit', () => {
  isQuitting = true;
  
  // Clean up processes
  stopBundledRedis(); // Stop Redis first
  
  if (workerProcess) {
    workerProcess.kill();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

