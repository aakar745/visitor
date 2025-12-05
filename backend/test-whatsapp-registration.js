/**
 * 🧪 TEST FILE: WhatsApp Registration Confirmation with Badge Image
 * 
 * This test file demonstrates sending the exhibition registration confirmation
 * template via Interakt WhatsApp API with a header image (badge).
 * 
 * Prerequisites:
 * 1. Template "exhibition_registration_confirmation" must be approved in Interakt/Meta
 * 2. Badge image must be publicly accessible (HTTPS URL)
 * 3. INTERAKT_API_KEY must be set in .env
 * 
 * Run: node backend/test-whatsapp-registration.js
 */

require('dotenv').config({ path: './.env' });
const axios = require('axios');

// =============================================================================
// CONFIGURATION
// =============================================================================

const INTERAKT_API_URL = process.env.INTERAKT_API_URL || 'https://api.interakt.ai/v1/public/message/';
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY;

// Test Data - UPDATE THESE VALUES
const TEST_CONFIG = {
  // Test recipient phone number (YOUR WhatsApp number for testing)
  phoneNumber: '+919558422743', // ⚠️ UPDATE THIS
  countryCode: '+91',
  phone: '9558422743',
  
  // Template Details
  templateName: 'exhibition_registration_confirmation', // Must match approved template name
  languageCode: 'en',
  
  // Badge Details
  visitorName: 'Prachi Sen',
  // Using a reliable test image from imgbb (public CDN)
  badgeImageUrl: 'https://api.aakarvisit.com/uploads/badges/69327ad2d4dca56616bd691d-v1764915922947.png', // ⚠️ UPDATE THIS with actual badge URL when ready
  
  // Exhibition Details (for message body)
  registrationNumber: 'REG-2025-00001',
  exhibitionName: 'Gujarat Industrial Exhibition 2025',
  venue: 'Helipad Exhibition Centre, Gandhinagar',
  dates: '10th - 15th Jan 2025',
  timings: '10:00 AM - 8:00 PM'
};

// =============================================================================
// VALIDATION
// =============================================================================

function validateConfig() {
  const errors = [];

  if (!INTERAKT_API_KEY) {
    errors.push('❌ INTERAKT_API_KEY not found in .env file');
  }

  if (TEST_CONFIG.phoneNumber === '+919558422743') {
    errors.push('⚠️  WARNING: Update TEST_CONFIG.phoneNumber with your actual WhatsApp number');
  }

  if (TEST_CONFIG.badgeImageUrl.includes('your-domain.com')) {
    errors.push('⚠️  WARNING: Update TEST_CONFIG.badgeImageUrl with actual badge image URL');
  }

  if (!TEST_CONFIG.badgeImageUrl.startsWith('https://')) {
    errors.push('❌ Badge image URL must be HTTPS (required by WhatsApp)');
  }

  return errors;
}

// =============================================================================
// INTERAKT API FUNCTIONS
// =============================================================================

/**
 * Send WhatsApp Template Message with Header Image
 * 
 * Payload Structure (Interakt API):
 * {
 *   "countryCode": "+91",
 *   "phoneNumber": "9558422743",
 *   "type": "Template",
 *   "template": {
 *     "name": "template_name",
 *     "languageCode": "en",
 *     "headerValues": ["https://example.com/image.png"],  // For media header
 *     "bodyValues": ["John", "Event Name"],                // For {{1}}, {{2}} in body
 *     "buttonValues": {}                                   // For buttons if any
 *   }
 * }
 */
async function sendRegistrationConfirmation() {
  console.log('\n🚀 Starting WhatsApp Registration Confirmation Test\n');
  console.log('━'.repeat(70));
  
  try {
    // Step 1: Validation
    console.log('\n📋 Step 1: Validating Configuration...');
    const validationErrors = validateConfig();
    
    if (validationErrors.length > 0) {
      console.log('\n❌ Configuration Issues:');
      validationErrors.forEach(error => console.log(`   ${error}`));
      
      if (validationErrors.some(e => e.includes('❌'))) {
        console.log('\n⛔ Critical errors found. Please fix them before testing.\n');
        process.exit(1);
      } else {
        console.log('\n⚠️  Warnings found. Proceeding anyway...\n');
      }
    } else {
      console.log('✅ Configuration valid\n');
    }
    
    // Step 2: Prepare Payload
    console.log('📦 Step 2: Preparing Interakt API Payload...\n');
    
    const payload = {
      countryCode: TEST_CONFIG.countryCode,
      phoneNumber: TEST_CONFIG.phone,
      type: 'Template',
      template: {
        name: TEST_CONFIG.templateName,
        languageCode: TEST_CONFIG.languageCode,
        
        // Header: Badge Image URL
        // {{1}} in header = Badge image URL
        headerValues: [
          TEST_CONFIG.badgeImageUrl
        ],
        
        // Body: Visitor Name
        // {{1}} in body = Visitor name
        bodyValues: [
          TEST_CONFIG.visitorName
        ],
        
        // No buttons in this template
        buttonValues: {}
      }
    };
    
    console.log('📄 Payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    
    // Step 3: Send Request
    console.log('📡 Step 3: Sending Request to Interakt API...\n');
    console.log(`   Endpoint: ${INTERAKT_API_URL}`);
    console.log(`   To: ${TEST_CONFIG.countryCode}${TEST_CONFIG.phone}`);
    console.log(`   Template: ${TEST_CONFIG.templateName} (${TEST_CONFIG.languageCode})`);
    console.log('');
    
    const startTime = Date.now();
    
    const response = await axios.post(INTERAKT_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${INTERAKT_API_KEY}`
      },
      timeout: 10000 // 10 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    // Step 4: Handle Response
    console.log(`✅ Response received in ${duration}ms\n`);
    console.log('━'.repeat(70));
    console.log('\n📨 RESPONSE:\n');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n' + '━'.repeat(70));
    
    // Check success
    if (response.data && response.data.result === true) {
      console.log('\n🎉 SUCCESS! WhatsApp message sent successfully!\n');
      console.log(`   ✅ Message ID: ${response.data.id || 'N/A'}`);
      console.log(`   ✅ Status: ${response.data.status || 'Queued'}`);
      console.log(`   📱 Check WhatsApp on: ${TEST_CONFIG.phoneNumber}`);
      console.log('');
      
      // Expected Message Preview
      console.log('━'.repeat(70));
      console.log('\n📲 EXPECTED MESSAGE ON WHATSAPP:\n');
      console.log('┌─────────────────────────────────────────┐');
      console.log('│ [Badge Image Displayed Here]            │');
      console.log('├─────────────────────────────────────────┤');
      console.log(`│ 🎉 Thank you for registering, ${TEST_CONFIG.visitorName}!│`);
      console.log('│                                         │');
      console.log('│ Your badge is attached above.           │');
      console.log('│                                         │');
      console.log('│ 💡 Important Instructions               │');
      console.log('│ • Save your badge (attached above)     │');
      console.log('│ • Show QR code at entry                │');
      console.log('│ • Bring valid ID proof                 │');
      console.log('│                                         │');
      console.log('│ See you at the exhibition! 🎉          │');
      console.log('├─────────────────────────────────────────┤');
      console.log('│ Powered by Aakar Visitors              │');
      console.log('└─────────────────────────────────────────┘');
      console.log('');
      
      return { success: true, data: response.data };
    } else {
      console.log('\n⚠️  UNEXPECTED RESPONSE FORMAT\n');
      console.log('   Expected: result: true');
      console.log(`   Received: result: ${response.data?.result}`);
      console.log('');
      return { success: false, data: response.data };
    }
    
  } catch (error) {
    console.log('\n❌ ERROR OCCURRED\n');
    console.log('━'.repeat(70));
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error
        console.log(`\n🔴 HTTP ${error.response.status} Error\n`);
        console.log('Response Data:');
        console.log(JSON.stringify(error.response.data, null, 2));
        console.log('');
        
        // Common error explanations
        const status = error.response.status;
        console.log('💡 Possible Causes:');
        
        if (status === 401 || status === 403) {
          console.log('   • Invalid INTERAKT_API_KEY');
          console.log('   • API key not authorized for this account');
        } else if (status === 400) {
          console.log('   • Invalid payload structure');
          console.log('   • Template not found or not approved');
          console.log('   • Invalid phone number format');
          console.log('   • Badge image URL not accessible');
        } else if (status === 404) {
          console.log('   • Template name does not exist');
          console.log('   • Check template name in Interakt dashboard');
        } else if (status === 429) {
          console.log('   • Rate limit exceeded');
          console.log('   • Wait a few minutes and try again');
        }
        
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('⏱️  Request Timeout');
        console.log('   • Check your internet connection');
        console.log('   • Interakt API may be slow/down');
        
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log('🌐 Network Error');
        console.log('   • Cannot reach Interakt API');
        console.log('   • Check INTERAKT_API_URL in .env');
        console.log('   • Check your internet connection');
      }
    } else {
      console.log('Unexpected Error:');
      console.log(error.message);
    }
    
    console.log('\n' + '━'.repeat(70));
    console.log('');
    
    throw error;
  }
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║     WhatsApp Registration Confirmation Test (Interakt API)        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  try {
    // Main test
    await sendRegistrationConfirmation();
    
    console.log('━'.repeat(70));
    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Check WhatsApp on your test phone');
    console.log('   2. Verify badge image displays correctly');
    console.log('   3. Verify visitor name is correct');
    console.log('   4. If successful, integrate into main system');
    console.log('');
    
  } catch (error) {
    console.log('━'.repeat(70));
    console.log('\n❌ TEST FAILED\n');
    console.log('📋 Troubleshooting Steps:');
    console.log('   1. Verify INTERAKT_API_KEY in .env');
    console.log('   2. Check template is approved in Interakt dashboard');
    console.log('   3. Ensure badge image URL is publicly accessible (HTTPS)');
    console.log('   4. Verify phone number format');
    console.log('   5. Check Interakt API status');
    console.log('');
    process.exit(1);
  }
}

// =============================================================================
// RUN
// =============================================================================

if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 Unhandled Error:', error.message);
    process.exit(1);
  });
}

module.exports = { sendRegistrationConfirmation };

