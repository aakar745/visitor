/**
 * Show West Bengal fetch information
 */

const chalk = require('chalk');

const westBengalRanges = [
  { start: 700001, end: 700999, name: 'Kolkata (Capital)' },
  { start: 711001, end: 711999, name: 'Howrah, Hooghly' },
  { start: 712001, end: 712999, name: 'Hooghly, Purba Bardhaman' },
  { start: 713001, end: 713999, name: 'Purba Bardhaman, Paschim Bardhaman' },
  { start: 721001, end: 721999, name: 'Paschim Medinipur, Jhargram' },
  { start: 722001, end: 722999, name: 'Paschim Medinipur, Bankura' },
  { start: 723001, end: 723999, name: 'Bankura, Purulia' },
  { start: 731001, end: 731999, name: 'Birbhum, Murshidabad' },
  { start: 732001, end: 732999, name: 'Malda, Dakshin Dinajpur' },
  { start: 733001, end: 733999, name: 'Darjeeling, Jalpaiguri' },
  { start: 734001, end: 734999, name: 'Darjeeling, Kalimpong' },
  { start: 735001, end: 735999, name: 'Jalpaiguri, Alipurduar' },
  { start: 736001, end: 736999, name: 'Cooch Behar, Alipurduar' },
  { start: 741001, end: 741999, name: 'Nadia, Murshidabad' },
  { start: 742001, end: 742999, name: 'Murshidabad' },
  { start: 743001, end: 743999, name: 'North 24 Parganas' },
  { start: 744001, end: 744999, name: 'North 24 Parganas, South 24 Parganas' },
  { start: 751001, end: 751999, name: 'Purba Medinipur (shares some with Odisha)' },
];

const totalPins = westBengalRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 West Bengal Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(80)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${westBengalRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~8,000-10,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Moderate-Large fetch - Recommended to run overnight`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

westBengalRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(80)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-west-bengal.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: City of Joy - Includes Kolkata, Darjeeling, Howrah, Durgapur\n'));

