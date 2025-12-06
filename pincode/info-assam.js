/**
 * Show Assam fetch information
 */

const chalk = require('chalk');

const assamRanges = [
  { start: 781001, end: 781999, name: 'Kamrup, Guwahati' },
  { start: 782001, end: 782999, name: 'Nagaon, Morigaon' },
  { start: 783001, end: 783999, name: 'Bongaigaon, Kokrajhar, Dhubri' },
  { start: 784001, end: 784999, name: 'Lakhimpur, Dhemaji' },
  { start: 785001, end: 785999, name: 'Jorhat, Sivasagar, Golaghat' },
  { start: 786001, end: 786999, name: 'Dibrugarh, Tinsukia' },
  { start: 787001, end: 787999, name: 'Karbi Anglong, North Cachar Hills' },
  { start: 788001, end: 788999, name: 'Cachar, Karimganj, Hailakandi' },
];

const totalPins = assamRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Assam Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${assamRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~3,000-4,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

assamRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(40, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-assam.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Covers all 33 districts including tea-growing regions\n'));

