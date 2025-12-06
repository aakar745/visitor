/**
 * Show Rajasthan fetch information
 */

const chalk = require('chalk');

const rajasthanRanges = [
  { start: 301001, end: 301999, name: 'Alwar' },
  { start: 302001, end: 302999, name: 'Jaipur' },
  { start: 303001, end: 303999, name: 'Jaipur Rural, Dausa' },
  { start: 304001, end: 304999, name: 'Tonk' },
  { start: 305001, end: 305999, name: 'Ajmer' },
  { start: 306001, end: 306999, name: 'Pali' },
  { start: 307001, end: 307999, name: 'Sirohi' },
  { start: 311001, end: 311999, name: 'Bhilwara' },
  { start: 312001, end: 312999, name: 'Chittorgarh' },
  { start: 313001, end: 313999, name: 'Udaipur' },
  { start: 314001, end: 314999, name: 'Dungarpur, Banswara' },
  { start: 321001, end: 321999, name: 'Bharatpur' },
  { start: 322001, end: 322999, name: 'Sawai Madhopur' },
  { start: 323001, end: 323999, name: 'Bundi, Kota' },
  { start: 324001, end: 324999, name: 'Kota, Jhalawar' },
  { start: 325001, end: 325999, name: 'Baran' },
  { start: 326001, end: 326999, name: 'Jhalawar' },
  { start: 327001, end: 327999, name: 'Banswara, Pratapgarh' },
  { start: 328001, end: 328999, name: 'Dholpur' },
  { start: 331001, end: 331999, name: 'Churu' },
  { start: 332001, end: 332999, name: 'Sikar' },
  { start: 333001, end: 333999, name: 'Jhunjhunu' },
  { start: 334001, end: 334999, name: 'Bikaner' },
  { start: 335001, end: 335999, name: 'Hanumangarh, Ganganagar' },
  { start: 341001, end: 341999, name: 'Nagaur' },
  { start: 342001, end: 342999, name: 'Jodhpur' },
  { start: 343001, end: 343999, name: 'Jalor' },
  { start: 344001, end: 344999, name: 'Barmer' },
  { start: 345001, end: 345999, name: 'Jaisalmer' },
];

const totalPins = rajasthanRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Rajasthan Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${rajasthanRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~10,000-12,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

rajasthanRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(30, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-rajasthan.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));

