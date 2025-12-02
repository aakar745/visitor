/**
 * Show Gujarat fetch information
 */

const chalk = require('chalk');

const gujaratRanges = [
  { start: 360001, end: 360999, name: 'Porbandar, Jamnagar' },
  { start: 361001, end: 361999, name: 'Jamnagar' },
  { start: 362001, end: 362999, name: 'Junagadh' },
  { start: 363001, end: 363999, name: 'Surendranagar' },
  { start: 364001, end: 364999, name: 'Bhavnagar' },
  { start: 365001, end: 365999, name: 'Amreli' },
  { start: 370001, end: 370999, name: 'Kutch (Bhuj)' },
  { start: 380001, end: 380999, name: 'Ahmedabad' },
  { start: 381001, end: 381999, name: 'Ahmedabad Rural' },
  { start: 382001, end: 382999, name: 'Gandhinagar' },
  { start: 383001, end: 383999, name: 'Sabarkantha' },
  { start: 384001, end: 384999, name: 'Mehsana' },
  { start: 385001, end: 385999, name: 'Banaskantha' },
  { start: 387001, end: 387999, name: 'Kheda' },
  { start: 388001, end: 388999, name: 'Anand' },
  { start: 389001, end: 389999, name: 'Panchmahal' },
  { start: 390001, end: 390999, name: 'Vadodara' },
  { start: 391001, end: 391999, name: 'Vadodara Rural' },
  { start: 392001, end: 392999, name: 'Bharuch' },
  { start: 393001, end: 393999, name: 'Narmada' },
  { start: 394001, end: 394999, name: 'Surat' },
  { start: 395001, end: 395999, name: 'Surat Rural' },
  { start: 396001, end: 396999, name: 'Valsad, Dang' },
];

const totalPins = gujaratRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Gujarat Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${gujaratRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~8,000-10,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

gujaratRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(25, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-gujarat.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));

