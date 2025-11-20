/**
 * 🎨 Print Service Manager - Renderer Process
 * 
 * Handles UI interactions and communicates with main process via IPC
 */

// State
let serviceStatus = {
  worker: false,
  server: false,
  redis: 'checking'
};

// =============================================================================
// UI Elements
// =============================================================================

const elements = {
  // Worker controls
  btnStartWorker: document.getElementById('btn-start-worker'),
  btnStopWorker: document.getElementById('btn-stop-worker'),
  workerStatus: document.getElementById('worker-status'),
  
  // Server controls
  btnStartServer: document.getElementById('btn-start-server'),
  btnStopServer: document.getElementById('btn-stop-server'),
  serverStatus: document.getElementById('server-status'),
  
  // Redis
  btnCheckRedis: document.getElementById('btn-check-redis'),
  redisStatus: document.getElementById('redis-status'),
  
  // Configuration
  printerSelect: document.getElementById('printer-select'),
  kioskIdInput: document.getElementById('kiosk-id-input'),
  btnRefreshPrinters: document.getElementById('btn-refresh-printers'),
  btnSaveConfig: document.getElementById('btn-save-config'),
  btnOpenFolder: document.getElementById('btn-open-folder'),
  btnCleanupLabels: document.getElementById('btn-cleanup-labels'),
  
  // Logs
  logsContainer: document.getElementById('logs'),
  btnClearLogs: document.getElementById('btn-clear-logs')
};

// =============================================================================
// Initialization
// =============================================================================

async function initialize() {
  addLog('🚀 Print Service Manager started');
  addLog('💡 System tray icon is active - you can minimize this window');
  
  // Load configuration
  await loadConfiguration();
  
  // Load status
  await updateStatus();
  
  // Load printers
  await loadPrinters();
  
  // Set up event listeners
  setupEventListeners();
  
  // Set up IPC listeners
  setupIPCListeners();
  
  addLog('✅ Ready to manage print services');
}

// =============================================================================
// Event Listeners
// =============================================================================

function setupEventListeners() {
  // Worker controls
  elements.btnStartWorker.addEventListener('click', async () => {
    setButtonLoading(elements.btnStartWorker, true);
    await window.electronAPI.startWorker();
    setButtonLoading(elements.btnStartWorker, false);
  });

  elements.btnStopWorker.addEventListener('click', async () => {
    setButtonLoading(elements.btnStopWorker, true);
    await window.electronAPI.stopWorker();
    setButtonLoading(elements.btnStopWorker, false);
  });

  // Server controls
  elements.btnStartServer.addEventListener('click', async () => {
    setButtonLoading(elements.btnStartServer, true);
    await window.electronAPI.startServer();
    setButtonLoading(elements.btnStartServer, false);
  });

  elements.btnStopServer.addEventListener('click', async () => {
    setButtonLoading(elements.btnStopServer, true);
    await window.electronAPI.stopServer();
    setButtonLoading(elements.btnStopServer, false);
  });

  // Redis
  elements.btnCheckRedis.addEventListener('click', async () => {
    setButtonLoading(elements.btnCheckRedis, true);
    await window.electronAPI.checkRedis();
    setButtonLoading(elements.btnCheckRedis, false);
  });

  // Printer refresh
  elements.btnRefreshPrinters.addEventListener('click', async () => {
    setButtonLoading(elements.btnRefreshPrinters, true);
    await loadPrinters();
    setButtonLoading(elements.btnRefreshPrinters, false);
  });

  // Save config
  elements.btnSaveConfig.addEventListener('click', async () => {
    setButtonLoading(elements.btnSaveConfig, true);
    await saveConfiguration();
    setButtonLoading(elements.btnSaveConfig, false);
  });

  // Open folder
  elements.btnOpenFolder.addEventListener('click', async () => {
    await window.electronAPI.openFolder();
    addLog('📁 Opened labels folder');
  });

  // Cleanup old labels
  elements.btnCleanupLabels.addEventListener('click', async () => {
    if (!confirm('Delete label files older than 7 days?\n\nThis will free up disk space but cannot be undone.')) {
      return;
    }
    
    setButtonLoading(elements.btnCleanupLabels, true);
    addLog('🧹 Starting cleanup...');
    
    const result = await window.electronAPI.cleanupLabels();
    
    if (result.success) {
      addLog(`✅ Cleanup complete: Deleted ${result.deletedCount} files, freed ${result.sizeMB} MB`);
    } else {
      addLog(`❌ Cleanup failed: ${result.error}`);
    }
    
    setButtonLoading(elements.btnCleanupLabels, false);
  });

  // Clear logs
  elements.btnClearLogs.addEventListener('click', () => {
    elements.logsContainer.innerHTML = '';
    addLog('🗑️ Logs cleared');
  });
}

function setupIPCListeners() {
  // Listen for logs from main process
  window.electronAPI.onLog((message) => {
    addLog(message);
  });

  // Listen for status updates
  window.electronAPI.onStatusUpdate((status) => {
    serviceStatus = status;
    updateUI();
  });
}

// =============================================================================
// Service Control Functions
// =============================================================================

async function updateStatus() {
  try {
    const status = await window.electronAPI.getStatus();
    serviceStatus = status;
    updateUI();
  } catch (error) {
    addLog(`❌ Error updating status: ${error.message}`);
  }
}

function updateUI() {
  // Update worker status
  if (serviceStatus.worker) {
    elements.workerStatus.textContent = '🟢 Running';
    elements.workerStatus.className = 'status-badge running';
    elements.btnStartWorker.disabled = true;
    elements.btnStopWorker.disabled = false;
  } else {
    elements.workerStatus.textContent = '🔴 Stopped';
    elements.workerStatus.className = 'status-badge stopped';
    elements.btnStartWorker.disabled = false;
    elements.btnStopWorker.disabled = true;
  }

  // Update server status
  if (serviceStatus.server) {
    elements.serverStatus.textContent = '🟢 Running';
    elements.serverStatus.className = 'status-badge running';
    elements.btnStartServer.disabled = true;
    elements.btnStopServer.disabled = false;
  } else {
    elements.serverStatus.textContent = '🔴 Stopped';
    elements.serverStatus.className = 'status-badge stopped';
    elements.btnStartServer.disabled = false;
    elements.btnStopServer.disabled = true;
  }

  // Update Redis status
  switch (serviceStatus.redis) {
    case 'running':
      elements.redisStatus.textContent = '🟢 Connected';
      elements.redisStatus.className = 'status-badge running';
      break;
    case 'not_running':
      elements.redisStatus.textContent = '🔴 Not Running';
      elements.redisStatus.className = 'status-badge stopped';
      break;
    case 'checking':
      elements.redisStatus.textContent = '⏳ Checking...';
      elements.redisStatus.className = 'status-badge checking';
      break;
    default:
      elements.redisStatus.textContent = '⚠️ Error';
      elements.redisStatus.className = 'status-badge';
  }
}

// =============================================================================
// Printer Management
// =============================================================================

async function loadPrinters() {
  try {
    addLog('🖨️ Loading available printers...');
    const result = await window.electronAPI.getPrinters();
    
    if (result.success) {
      const printers = result.printers;
      elements.printerSelect.innerHTML = '';
      
      if (printers.length === 0) {
        elements.printerSelect.innerHTML = '<option value="">No printers found</option>';
        addLog('⚠️ No printers detected on system');
      } else {
        printers.forEach(printer => {
          const option = document.createElement('option');
          option.value = printer;
          option.textContent = printer;
          
          // Pre-select Brother QL-800 if found
          if (printer.includes('QL-800')) {
            option.selected = true;
          }
          
          elements.printerSelect.appendChild(option);
        });
        addLog(`✅ Found ${printers.length} printer(s)`);
      }
    } else {
      addLog(`❌ Error loading printers: ${result.error}`);
      elements.printerSelect.innerHTML = '<option value="">Error loading printers</option>';
    }
  } catch (error) {
    addLog(`❌ Error loading printers: ${error.message}`);
  }
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Load configuration from .env file
 */
async function loadConfiguration() {
  try {
    const result = await window.electronAPI.getConfig();
    
    if (result.success && result.config) {
      // Set kiosk ID if available
      if (result.config.kioskId) {
        elements.kioskIdInput.value = result.config.kioskId;
        addLog(`📋 Loaded kiosk ID: ${result.config.kioskId}`);
      }
    }
  } catch (error) {
    addLog(`⚠️ Could not load configuration: ${error.message}`);
  }
}

/**
 * Save configuration to .env file
 */
async function saveConfiguration() {
  try {
    const config = {
      printerName: elements.printerSelect.value,
      kioskId: elements.kioskIdInput.value.trim()
    };

    const result = await window.electronAPI.saveConfig(config);
    
    if (result.success) {
      addLog('✅ Configuration saved successfully');
      if (config.kioskId) {
        addLog(`📋 Kiosk ID: ${config.kioskId}`);
      }
      addLog('💡 Restart the worker for changes to take effect');
    } else {
      addLog(`❌ Error saving configuration: ${result.error}`);
    }
  } catch (error) {
    addLog(`❌ Error saving configuration: ${error.message}`);
  }
}

// =============================================================================
// Logging
// =============================================================================

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  
  // Determine log type
  if (message.includes('❌') || message.includes('Error') || message.includes('Failed')) {
    logEntry.classList.add('error');
  } else if (message.includes('✅') || message.includes('Success')) {
    logEntry.classList.add('success');
  } else if (message.includes('⚠️') || message.includes('Warning')) {
    logEntry.classList.add('warning');
  } else if (message.includes('🚀') || message.includes('Starting')) {
    logEntry.classList.add('info');
  }
  
  logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${escapeHtml(message)}`;
  elements.logsContainer.appendChild(logEntry);
  
  // Auto-scroll to bottom
  elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
  
  // Limit logs to 500 entries
  const logs = elements.logsContainer.children;
  if (logs.length > 500) {
    elements.logsContainer.removeChild(logs[0]);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.dataset.originalText = originalText;
    button.innerHTML = '<span class="loading"></span> Loading...';
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// =============================================================================
// Start the application
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

