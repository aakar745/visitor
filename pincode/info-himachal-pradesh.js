/**
 * Show Himachal Pradesh fetch information
 */

const chalk = require('chalk');

const himachalPradeshRanges = [
  { start: 171001, end: 171999, name: 'Shimla' },
  { start: 172001, end: 172999, name: 'Shimla Rural, Kinnaur' },
  { start: 173001, end: 173999, name: 'Solan, Sirmaur' },
  { start: 174001, end: 174999, name: 'Bilaspur, Hamirpur' },
  { start: 175001, end: 175999, name: 'Mandi, Kullu' },
  { start: 176001, end: 176999, name: 'Kangra, Una' },
  { start: 177001, end: 177999, name: 'Chamba, Lahaul-Spiti' },
];

const totalPins = himachalPradeshRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Himachal Pradesh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${himachalPradeshRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~2,500-3,500`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

himachalPradeshRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(40, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-himachal-pradesh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes mountain regions (Shimla, Manali, Dharamshala)\n'));

