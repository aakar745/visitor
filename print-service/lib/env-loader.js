/**
 * 🔧 Environment Variable Loader
 * 
 * Handles .env file loading with Electron GUI support
 * 
 * Loading Strategy:
 * 1. Try Electron user data path (writable location for packaged app)
 * 2. Try current directory (development/manual runs)
 * 3. Fall back to default dotenv behavior
 */

const fs = require('fs');
const path = require('path');

/**
 * Get the writable user data directory
 * 
 * Priority:
 * 1. Electron user data path (C:\Users\...\AppData\Roaming\...)
 * 2. Current directory (development)
 * 
 * @returns {string} Writable directory path
 */
function getUserDataDir() {
  // 1. Electron user data path (packaged app)
  if (process.env.USER_DATA_PATH) {
    return process.env.USER_DATA_PATH;
  }

  // 2. Current directory (development)
  return path.join(__dirname, '..');
}

/**
 * Load environment variables with Electron-aware path resolution
 * 
 * @returns {string|null} Path to loaded .env file, or null if none found
 */
function loadEnv() {
  let envPath = null;

  // 1. User data path (set by Electron when running from GUI)
  if (process.env.USER_DATA_PATH) {
    const userEnvPath = path.join(process.env.USER_DATA_PATH, '.env');
    if (fs.existsSync(userEnvPath)) {
      envPath = userEnvPath;
    }
  }

  // 2. Current directory (for development/manual runs)
  if (!envPath && fs.existsSync(path.join(__dirname, '..', '.env'))) {
    envPath = path.join(__dirname, '..', '.env');
  }

  // Load environment variables
  if (envPath) {
    require('dotenv').config({ path: envPath });
    console.log(`📁 Loaded config from: ${envPath}`);
    return envPath;
  } else {
    require('dotenv').config(); // Try default location
    console.log('⚠️ No .env file found, using environment variables');
    return null;
  }
}

module.exports = { loadEnv, getUserDataDir };

