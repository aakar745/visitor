/**
 * Show Goa fetch information
 */

const chalk = require('chalk');

const goaRanges = [
  { start: 403001, end: 403999, name: 'North & South Goa (All districts)' },
];

const totalPins = goaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Goa Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${goaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~150-250 (smallest state)`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Quick fetch! Can run in foreground (~17 minutes)`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

goaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(40, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.cyan('\n📝 Note:'));
console.log(chalk.white('   • Goa is India\'s smallest state by area'));
console.log(chalk.white('   • Only 2 districts: North Goa & South Goa'));
console.log(chalk.white('   • All PINs in single 403xxx range'));
console.log(chalk.white('   • Includes: Panaji (capital), Margao, Vasco, Mapusa, Ponda'));
console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-goa.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('⚡ This will be one of the fastest fetches! (~17 minutes)\n'));

