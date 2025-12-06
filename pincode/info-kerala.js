/**
 * Show Kerala fetch information
 */

const chalk = require('chalk');

const keralaRanges = [
  { start: 670001, end: 670999, name: 'Kannur, Kasaragod' },
  { start: 671001, end: 671999, name: 'Kasaragod, Kannur' },
  { start: 673001, end: 673999, name: 'Kozhikode (Calicut), Wayanad' },
  { start: 676001, end: 676999, name: 'Malappuram, Palakkad' },
  { start: 678001, end: 678999, name: 'Palakkad, Thrissur' },
  { start: 679001, end: 679999, name: 'Palakkad, Malappuram' },
  { start: 680001, end: 680999, name: 'Thrissur, Ernakulam' },
  { start: 682001, end: 682999, name: 'Ernakulam (Kochi), Thrissur' },
  { start: 683001, end: 683999, name: 'Ernakulam, Idukki' },
  { start: 685001, end: 685999, name: 'Idukki, Kottayam' },
  { start: 686001, end: 686999, name: 'Kottayam, Idukki' },
  { start: 688001, end: 688999, name: 'Alappuzha (Alleppey), Kottayam' },
  { start: 689001, end: 689999, name: 'Pathanamthitta, Kottayam' },
  { start: 690001, end: 690999, name: 'Pathanamthitta, Alappuzha' },
  { start: 691001, end: 691999, name: 'Kollam (Quilon), Pathanamthitta' },
  { start: 695001, end: 695999, name: 'Thiruvananthapuram (Trivandrum)' },
  { start: 697001, end: 697999, name: 'Kollam, Thiruvananthapuram' },
];

const totalPins = keralaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Kerala Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${keralaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~6,000-7,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

keralaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-kerala.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes backwaters (Alleppey), hill stations (Munnar), and beaches (Kovalam)\n'));

