/**
 * Show Chhattisgarh fetch information
 */

const chalk = require('chalk');

const chhattisgarhRanges = [
  { start: 490001, end: 490999, name: 'Durg, Bhilai' },
  { start: 491001, end: 491999, name: 'Durg Rural, Rajnandgaon' },
  { start: 492001, end: 492999, name: 'Raipur' },
  { start: 493001, end: 493999, name: 'Raipur Rural, Mahasamund' },
  { start: 494001, end: 494999, name: 'Bastar, Jagdalpur' },
  { start: 495001, end: 495999, name: 'Bilaspur, Janjgir-Champa' },
  { start: 496001, end: 496999, name: 'Raigarh, Jashpur' },
  { start: 497001, end: 497999, name: 'Surguja, Korba' },
];

const totalPins = chhattisgarhRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Chhattisgarh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${chhattisgarhRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~2,500-3,500`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in foreground or background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

chhattisgarhRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(35, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-chhattisgarh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Covers all 27 districts including industrial hubs\n'));

