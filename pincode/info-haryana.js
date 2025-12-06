/**
 * Show Haryana fetch information
 */

const chalk = require('chalk');

const haryanaRanges = [
  { start: 121001, end: 121999, name: 'Faridabad' },
  { start: 122001, end: 122999, name: 'Gurgaon, Mewat' },
  { start: 123001, end: 123999, name: 'Rewari, Mahendragarh' },
  { start: 124001, end: 124999, name: 'Rohtak, Jhajjar' },
  { start: 125001, end: 125999, name: 'Hisar, Fatehabad' },
  { start: 126001, end: 126999, name: 'Jind, Kaithal' },
  { start: 127001, end: 127999, name: 'Bhiwani, Charkhi Dadri' },
  { start: 128001, end: 128999, name: 'Sonipat' },
  { start: 131001, end: 131999, name: 'Karnal, Panipat' },
  { start: 132001, end: 132999, name: 'Kurukshetra, Yamuna Nagar' },
  { start: 133001, end: 133999, name: 'Ambala, Panchkula' },
  { start: 134001, end: 134999, name: 'Ambala Rural (shares with Chandigarh)' },
  { start: 135001, end: 135999, name: 'Yamunanagar, Sirsa' },
  { start: 136001, end: 136999, name: 'Kaithal, Kurukshetra Rural' },
];

const totalPins = haryanaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Haryana Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${haryanaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~4,000-5,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

haryanaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(40, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-haryana.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes NCR regions (Gurgaon, Faridabad) near Delhi\n'));

