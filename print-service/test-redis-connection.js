/**
 * Redis Connection Test Script
 * 
 * This script tests connection to the production Redis server
 * Run this from a kiosk PC to see if Redis is accessible
 */

const Redis = require('ioredis');

// Redis configuration from EasyPanel
// Use correct password with 9ff (not 91f)
const REDIS_URL = 'redis://:bf8df9ffb632eb37adb2@13.233.97.220:6379';

const REDIS_CONFIG = {
  host: '13.233.97.220',
  port: 6379,
  password: 'bf8df9ffb632eb37adb2', // Correct password with 9ff
  db: 0,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 200, 1000);
  },
};

console.log('═══════════════════════════════════════════════════════');
console.log('🔍 REDIS CONNECTION TEST');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📋 Configuration:');
console.log(`   Host:     ${REDIS_CONFIG.host}`);
console.log(`   Port:     ${REDIS_CONFIG.port}`);
console.log(`   Password: ${REDIS_CONFIG.password ? REDIS_CONFIG.password.substring(0, 10) + '...' : 'NONE'}`);
console.log(`   Database: ${REDIS_CONFIG.db}`);
console.log('');

// Try config object format with ACL
const redis = new Redis(REDIS_CONFIG);

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Connection
redis.on('connect', () => {
  console.log('✅ Test 1: TCP Connection - SUCCESS');
  testsPassed++;
});

redis.on('ready', async () => {
  console.log('✅ Test 2: Redis Authentication - SUCCESS');
  testsPassed++;

  try {
    // Test 3: PING
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      console.log('✅ Test 3: PING command - SUCCESS');
      testsPassed++;
    } else {
      console.log('❌ Test 3: PING command - FAILED (unexpected response)');
      testsFailed++;
    }

    // Test 4: SET
    await redis.set('test:connection:timestamp', Date.now());
    console.log('✅ Test 4: SET command - SUCCESS');
    testsPassed++;

    // Test 5: GET
    const value = await redis.get('test:connection:timestamp');
    if (value) {
      console.log('✅ Test 5: GET command - SUCCESS');
      testsPassed++;
    } else {
      console.log('❌ Test 5: GET command - FAILED');
      testsFailed++;
    }

    // Test 6: DELETE
    await redis.del('test:connection:timestamp');
    console.log('✅ Test 6: DEL command - SUCCESS');
    testsPassed++;

    // Test 7: Check BullMQ queues
    const queueKeys = await redis.keys('bull:*');
    console.log(`✅ Test 7: BullMQ queues found - ${queueKeys.length} keys`);
    testsPassed++;

    // Test 8: INFO command
    const info = await redis.info('server');
    if (info.includes('redis_version')) {
      const version = info.match(/redis_version:([\d.]+)/)?.[1];
      console.log(`✅ Test 8: INFO command - SUCCESS (Redis ${version})`);
      testsPassed++;
    } else {
      console.log('❌ Test 8: INFO command - FAILED');
      testsFailed++;
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Redis is fully accessible from this machine');
      console.log('✅ You can now install the Print Service Manager');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('Check the errors above for details');
    }

    await redis.quit();
    process.exit(0);

  } catch (error) {
    console.log(`❌ Test failed with error: ${error.message}`);
    testsFailed++;
    await redis.quit();
    process.exit(1);
  }
});

redis.on('error', (error) => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('❌ CONNECTION FAILED');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('🔍 Full Error Message:', error.message);
  console.log('🔍 Error Code:', error.code);
  console.log('');
  
  if (error.code === 'ECONNREFUSED') {
    console.log('🔴 Error: Connection Refused');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Redis port (6379) is not exposed in EasyPanel');
    console.log('  2. AWS Security Group is blocking port 6379');
    console.log('  3. Server firewall is blocking the connection');
    console.log('');
    console.log('✅ Fix:');
    console.log('  1. In AWS EC2 → Security Groups:');
    console.log('     - Add Inbound Rule: TCP port 6379');
    console.log(`     - Source: Your IP (${error.address || 'current IP'})`);
    console.log('  2. In EasyPanel:');
    console.log('     - Make sure Redis service is exposed on port 6379');
  } 
  else if (error.code === 'ETIMEDOUT') {
    console.log('🔴 Error: Connection Timeout');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. AWS Security Group is not allowing your IP');
    console.log('  2. Network firewall is blocking outgoing connections');
    console.log('  3. Redis server is not responding');
    console.log('');
    console.log('✅ Fix:');
    console.log('  1. Check your public IP: https://ifconfig.me');
    console.log('  2. Add your IP to AWS Security Group for port 6379');
  }
  else if (error.message.includes('WRONGPASS') || error.message.includes('NOAUTH')) {
    console.log('🔴 Error: Authentication Failed');
    console.log('');
    console.log('✅ Fix:');
    console.log('  - Check the password in EasyPanel Redis credentials');
    console.log('  - Update the password in this script');
  }
  else {
    console.log('🔴 Error:', error.message);
    console.log('');
    console.log('Error details:');
    console.log('  Code:', error.code);
    console.log('  Address:', error.address);
    console.log('  Port:', error.port);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  
  redis.quit();
  process.exit(1);
});

redis.on('close', () => {
  console.log('\n🔌 Connection closed');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⏱️  Connection timeout (10 seconds)');
  console.log('❌ Could not connect to Redis');
  redis.quit();
  process.exit(1);
}, 10000);

