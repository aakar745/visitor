/**
 * Show Sikkim fetch information
 */

const chalk = require('chalk');

const sikkimRanges = [
  { start: 737001, end: 737999, name: 'All districts (Gangtok, Namchi, Mangan, Gyalshing, Pakyong, Soreng)' },
];

const totalPins = sikkimRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Sikkim Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${sikkimRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~200-300`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Range:\n'));

sikkimRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-sikkim.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Gangtok (capital) and all 6 districts of the Himalayan state\n'));

