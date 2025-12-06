/**
 * Show Uttarakhand fetch information
 */

const chalk = require('chalk');

const uttarakhandRanges = [
  { start: 244001, end: 244999, name: 'Udham Singh Nagar (shares with UP)' },
  { start: 246001, end: 246999, name: 'Haridwar, Dehradun (shares with UP)' },
  { start: 247001, end: 247999, name: 'Dehradun, Haridwar' },
  { start: 248001, end: 248999, name: 'Dehradun (Capital), Tehri Garhwal' },
  { start: 249001, end: 249999, name: 'Haridwar, Dehradun Rural' },
  { start: 261001, end: 261999, name: 'Udham Singh Nagar (shares with UP)' },
  { start: 262001, end: 262999, name: 'Udham Singh Nagar, Nainital' },
  { start: 263001, end: 263999, name: 'Nainital, Almora' },
  { start: 249401, end: 249410, name: 'Rishikesh area (specific range)' },
];

const totalPins = uttarakhandRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Uttarakhand Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(80)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${uttarakhandRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~2,500-3,500`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

uttarakhandRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(80)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-uttarakhand.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Land of Gods - Includes Dehradun, Haridwar, Rishikesh, Nainital\n'));

