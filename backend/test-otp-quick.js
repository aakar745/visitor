/**
 * Quick OTP test to verify phone number and Interakt connection
 */
require('dotenv').config({ path: './.env' });
const axios = require('axios');

const INTERAKT_API_URL = process.env.INTERAKT_API_URL;
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY;

async function testOTP() {
  console.log('\n🧪 Testing OTP (to verify phone number works)...\n');
  
  const testOTP = '123456';
  
  const payload = {
    countryCode: '+91',
    phoneNumber: '9558422743',
    type: 'Template',
    template: {
      name: 'otp',
      languageCode: 'en',
      bodyValues: [testOTP],
      buttonValues: {
        '0': [testOTP]
      }
    }
  };
  
  try {
    const response = await axios.post(INTERAKT_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${INTERAKT_API_KEY}`
      },
      timeout: 10000
    });
    
    console.log('✅ OTP Request Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📱 Check WhatsApp for OTP: 123456\n');
    console.log('If you receive this OTP, your phone number and Interakt are working correctly.');
    console.log('If not, the issue is with the new template approval.\n');
    
  } catch (error) {
    console.log('❌ OTP Request Failed');
    if (error.response) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testOTP();

