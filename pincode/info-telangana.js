/**
 * Show Telangana fetch information
 */

const chalk = require('chalk');

const telanganaRanges = [
  { start: 500001, end: 500999, name: 'Hyderabad (Capital)' },
  { start: 501001, end: 501999, name: 'Hyderabad Suburbs, Rangareddy' },
  { start: 502001, end: 502999, name: 'Medak, Sangareddy' },
  { start: 503001, end: 503999, name: 'Nizamabad, Kamareddy' },
  { start: 504001, end: 504999, name: 'Adilabad, Nirmal, Mancherial' },
  { start: 505001, end: 505999, name: 'Karimnagar, Jagtial, Peddapalli' },
  { start: 506001, end: 506999, name: 'Warangal, Hanumakonda, Jangaon' },
  { start: 507001, end: 507999, name: 'Khammam, Bhadradri Kothagudem' },
  { start: 508001, end: 508999, name: 'Nalgonda, Yadadri Bhuvanagiri' },
  { start: 509001, end: 509999, name: 'Mahabubnagar, Nagarkurnool, Wanaparthy' },
];

const totalPins = telanganaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Telangana Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${telanganaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~4,000-5,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

telanganaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-telangana.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Hyderabad (capital), Warangal, Khammam and all 33 districts\n'));

