/**
 * Show Maharashtra fetch information
 */

const chalk = require('chalk');

const maharashtraRanges = [
  { start: 400001, end: 400999, name: 'Mumbai City' },
  { start: 401001, end: 401999, name: 'Mumbai Suburban, Thane' },
  { start: 402001, end: 402999, name: 'Raigad' },
  { start: 403001, end: 403999, name: 'Sindhudurg, Goa border' },
  { start: 410001, end: 410999, name: 'Pune' },
  { start: 411001, end: 411999, name: 'Pune City' },
  { start: 412001, end: 412999, name: 'Pune Rural' },
  { start: 413001, end: 413999, name: 'Solapur' },
  { start: 414001, end: 414999, name: 'Ahmednagar' },
  { start: 415001, end: 415999, name: 'Satara' },
  { start: 416001, end: 416999, name: 'Sangli' },
  { start: 421001, end: 421999, name: 'Thane' },
  { start: 422001, end: 422999, name: 'Nashik' },
  { start: 423001, end: 423999, name: 'Nashik Rural' },
  { start: 424001, end: 424999, name: 'Dhule, Nandurbar' },
  { start: 425001, end: 425999, name: 'Jalgaon' },
  { start: 431001, end: 431999, name: 'Aurangabad' },
  { start: 441001, end: 441999, name: 'Nagpur' },
  { start: 442001, end: 442999, name: 'Wardha' },
  { start: 443001, end: 443999, name: 'Buldhana' },
  { start: 444001, end: 444999, name: 'Akola, Washim' },
  { start: 445001, end: 445999, name: 'Yavatmal' },
  { start: 446001, end: 446999, name: 'Amravati' },
  { start: 451001, end: 451999, name: 'Bhandara' },
  { start: 452001, end: 452999, name: 'Indore (border area)' },
  { start: 461001, end: 461999, name: 'Betul (border area)' },
];

const totalPins = maharashtraRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Maharashtra Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${maharashtraRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~12,000-15,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

maharashtraRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(30, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-maharashtra.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));

