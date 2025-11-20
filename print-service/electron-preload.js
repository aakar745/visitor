/**
 * 🔒 Electron Preload Script
 * 
 * Securely exposes IPC methods to the renderer process
 * Uses contextBridge to prevent direct Node.js access in renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Service control
  startWorker: () => ipcRenderer.invoke('start-worker'),
  stopWorker: () => ipcRenderer.invoke('stop-worker'),
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  
  // Status and configuration
  getStatus: () => ipcRenderer.invoke('get-status'),
  checkRedis: () => ipcRenderer.invoke('check-redis'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Utilities
  openFolder: () => ipcRenderer.invoke('open-folder'),
  cleanupLabels: () => ipcRenderer.invoke('cleanup-labels'),
  
  // Listeners for main process events
  onLog: (callback) => ipcRenderer.on('log', (event, message) => callback(message)),
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (event, status) => callback(status)),
  
  // Remove listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

