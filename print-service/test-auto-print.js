// Test Auto-Print with Real QR Code
const QRCode = require('qrcode');
const axios = require('axios');

async function testAutoPrint() {
  console.log('🧪 Testing Auto-Print Feature...\n');

  try {
    // 1. Check service status
    console.log('1️⃣  Checking print service status...');
    const healthResponse = await axios.get('http://localhost:9100/health');
    console.log('✅ Print Service:', healthResponse.data);
    
    if (!healthResponse.data.autoPrint) {
      console.log('⚠️  WARNING: Auto-Print is DISABLED');
      console.log('   Enable it by setting AUTO_PRINT=true in .env file\n');
    } else {
      console.log('✅ Auto-Print: ENABLED\n');
    }

    // 2. Generate test QR code
    console.log('2️⃣  Generating QR code...');
    const registrationData = {
      registrationId: '507f1f77bcf86cd799439011',
      registrationNumber: 'TEST-2025-0001',
      exhibitionName: 'Tech Expo 2025',
      visitorName: 'John Doe Test',
      type: 'visitor-registration'
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(registrationData), {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
    
    const qrCodeBase64 = qrCodeDataUrl.split(',')[1];
    console.log('✅ QR Code generated\n');

    // 3. Send print request
    console.log('3️⃣  Sending print request...');
    const printResponse = await axios.post('http://localhost:9100/print', {
      name: 'John Doe Test',
      location: 'Mumbai, Maharashtra',
      registrationNumber: 'TEST-2025-0001',
      qrCode: qrCodeBase64,
    });

    console.log('✅ Print Response:', printResponse.data);
    console.log('\n📋 Files created:');
    console.log('   - QR Code:', printResponse.data.files.qr);
    console.log('   - HTML:', printResponse.data.files.html);
    console.log('   - JSON:', printResponse.data.files.json);

    if (printResponse.data.autoPrint) {
      console.log('\n🖨️  Label should be printing now!');
      console.log('   Check your Brother QL-800 printer.');
    } else {
      console.log('\n⚠️  Auto-Print is disabled.');
      console.log('   Open the HTML file manually to print:');
      console.log(`   labels/${printResponse.data.files.html}`);
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testAutoPrint();

