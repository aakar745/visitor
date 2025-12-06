/**
 * Show Arunachal Pradesh fetch information
 */

const chalk = require('chalk');

const arunachalPradeshRanges = [
  { start: 790001, end: 790999, name: 'Papum Pare, Itanagar (Capital)' },
  { start: 791001, end: 791999, name: 'Lower Subansiri, East Kameng' },
  { start: 792001, end: 792999, name: 'West Kameng, Tawang' },
  { start: 793001, end: 793999, name: 'West Siang, Upper Siang' },
  { start: 794001, end: 794999, name: 'East Siang, Dibang Valley' },
  { start: 795001, end: 795999, name: 'Lohit, Anjaw, Changlang' },
  { start: 796001, end: 796999, name: 'Tirap, Longding' },
];

const totalPins = arunachalPradeshRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Arunachal Pradesh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${arunachalPradeshRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~200-400 (low population density)`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Can run in foreground (relatively quick)`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

arunachalPradeshRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(35, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-arunachal-pradesh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Arunachal Pradesh has fewer PINs due to low population density and remote terrain\n'));

