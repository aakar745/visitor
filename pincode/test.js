/**
 * Quick Test Script
 * Tests the postal API with a few known PIN codes
 * 
 * Usage: node test.js
 */

const axios = require('axios');
const chalk = require('chalk');

const testPincodes = [
  '110001', // Delhi
  '380006', // Ahmedabad
  '400001', // Mumbai
  '560001', // Bangalore
  '600001', // Chennai
];

async function testAPI() {
  console.log(chalk.blue.bold('\n🧪 Testing India Postal API\n'));
  console.log(chalk.gray('━'.repeat(60)));

  for (const pincode of testPincodes) {
    try {
      console.log(chalk.cyan(`\n📍 Testing PIN: ${pincode}`));
      
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`, {
        timeout: 10000,
      });

      const data = response.data[0];

      if (data.Status === 'Success' && data.PostOffice) {
        const office = data.PostOffice[0];
        console.log(chalk.green(`✅ Valid`));
        console.log(chalk.white(`   Area: ${office.Name}`));
        console.log(chalk.white(`   City: ${office.District}`));
        console.log(chalk.white(`   State: ${office.State}`));
      } else {
        console.log(chalk.yellow(`⚠️  Invalid or not found`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(chalk.gray('\n' + '━'.repeat(60)));
  console.log(chalk.green('\n✅ Test complete! API is working.\n'));
}

testAPI().catch(error => {
  console.error(chalk.red('\n❌ Test failed:'), error.message);
  process.exit(1);
});

