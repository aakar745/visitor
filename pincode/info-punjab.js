/**
 * Show Punjab fetch information
 */

const chalk = require('chalk');

const punjabRanges = [
  { start: 140001, end: 140999, name: 'Patiala, Fatehgarh Sahib' },
  { start: 141001, end: 141999, name: 'Ludhiana' },
  { start: 142001, end: 142999, name: 'Moga, Faridkot, Firozpur' },
  { start: 143001, end: 143999, name: 'Amritsar, Tarn Taran' },
  { start: 144001, end: 144999, name: 'Jalandhar, Kapurthala' },
  { start: 145001, end: 145999, name: 'Hoshiarpur, Nawanshahr (SBS Nagar)' },
  { start: 146001, end: 146999, name: 'Hoshiarpur, Ropar (Rupnagar)' },
  { start: 147001, end: 147999, name: 'Patiala, Sangrur, Barnala' },
  { start: 148001, end: 148999, name: 'Sangrur, Mansa' },
  { start: 151001, end: 151999, name: 'Bathinda, Mansa' },
  { start: 152001, end: 152999, name: 'Firozpur, Fazilka, Muktsar' },
  { start: 153001, end: 153999, name: 'Gurdaspur, Pathankot' },
  { start: 160001, end: 160999, name: 'Chandigarh (shared with Haryana/UT)' },
  { start: 161001, end: 161999, name: 'Patiala, Mohali (SAS Nagar)' },
];

const totalPins = punjabRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Punjab Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${punjabRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~5,000-6,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

punjabRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-punjab.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Golden Temple (Amritsar), Ludhiana, Chandigarh and all 23 districts\n'));

