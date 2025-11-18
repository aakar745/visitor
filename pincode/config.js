/**
 * Configuration for India Postal Data Fetcher
 * Copy this file and create your own config if needed
 */

module.exports = {
  // Postal API Configuration
  api: {
    baseUrl: 'https://api.postalpincode.in/pincode',
    rateLimitPerMinute: 60,
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 10000,
  },

  // PIN Code Range
  pincode: {
    start: 110001,
    end: 855116,
    // Known valid ranges (optional optimization)
    validRanges: [
      { start: 110001, end: 110099, name: 'Delhi' },
      { start: 380001, end: 382490, name: 'Gujarat' },
      { start: 400001, end: 421605, name: 'Maharashtra' },
      { start: 560001, end: 562162, name: 'Karnataka' },
      { start: 600001, end: 643253, name: 'Tamil Nadu' },
      // Add more known ranges to optimize
    ],
  },

  // Output Settings
  paths: {
    output: './data',
    raw: './data/raw',
    processed: './data/processed',
    excel: './data/output/excel',
    logs: './logs',
    progress: './data/progress.json',
  },

  // Batch Settings
  batch: {
    size: 1000,
    saveProgressEvery: 100,
  },

  // MongoDB Connection (optional - for direct import)
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/visitor_management',
    database: 'visitor_management',
  },
};

