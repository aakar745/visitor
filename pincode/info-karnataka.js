/**
 * Show Karnataka fetch information
 */

const chalk = require('chalk');

const karnatakaRanges = [
  { start: 560001, end: 560999, name: 'Bangalore (Bengaluru) Urban' },
  { start: 561001, end: 561999, name: 'Bangalore Rural, Chikkaballapura' },
  { start: 562001, end: 562999, name: 'Bangalore Rural, Tumkur' },
  { start: 563001, end: 563999, name: 'Kolar, Chikkaballapura' },
  { start: 571001, end: 571999, name: 'Mysore (Mysuru), Mandya' },
  { start: 572001, end: 572999, name: 'Tumkur, Chitradurga' },
  { start: 573001, end: 573999, name: 'Hassan, Kodagu (Coorg)' },
  { start: 574001, end: 574999, name: 'Dakshina Kannada (Mangalore), Udupi' },
  { start: 575001, end: 575999, name: 'Dakshina Kannada, Udupi, Kasaragod' },
  { start: 576001, end: 576999, name: 'Udupi, Dakshina Kannada' },
  { start: 577001, end: 577999, name: 'Davangere, Chitradurga, Shimoga' },
  { start: 581001, end: 581999, name: 'Haveri, Uttara Kannada' },
  { start: 582001, end: 582999, name: 'Gadag, Koppal' },
  { start: 583001, end: 583999, name: 'Bellary (Ballari), Raichur' },
  { start: 584001, end: 584999, name: 'Raichur, Koppal' },
  { start: 585001, end: 585999, name: 'Bijapur (Vijayapura), Bagalkot' },
  { start: 586001, end: 586999, name: 'Bijapur, Bagalkot' },
  { start: 587001, end: 587999, name: 'Gulbarga (Kalaburagi), Bidar' },
  { start: 590001, end: 590999, name: 'Belgaum (Belagavi), Dharwad' },
  { start: 591001, end: 591999, name: 'Belgaum, Dharwad, Uttara Kannada' },
];

const totalPins = karnatakaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Karnataka Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${karnatakaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~8,000-10,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

karnatakaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-karnataka.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes IT hub Bangalore and tourist destinations (Mysore, Coorg, Mangalore)\n'));

