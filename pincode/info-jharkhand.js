/**
 * Show Jharkhand fetch information
 */

const chalk = require('chalk');

const jharkhandRanges = [
  { start: 814001, end: 814999, name: 'Dumka, Deoghar, Godda' },
  { start: 815001, end: 815999, name: 'Jamtara, Sahibganj, Pakur' },
  { start: 816001, end: 816999, name: 'Dhanbad, Bokaro (part)' },
  { start: 822001, end: 822999, name: 'Palamau, Garhwa, Latehar' },
  { start: 823001, end: 823999, name: 'Hazaribagh, Chatra, Koderma' },
  { start: 825001, end: 825999, name: 'Giridih, Jamui' },
  { start: 826001, end: 826999, name: 'Bokaro, Ramgarh' },
  { start: 827001, end: 827999, name: 'Dhanbad Rural' },
  { start: 828001, end: 828999, name: 'Bokaro Steel City area' },
  { start: 829001, end: 829999, name: 'Lohardaga, Gumla, Simdega' },
  { start: 831001, end: 831999, name: 'Jamshedpur (Tatanagar), East Singhbhum' },
  { start: 832001, end: 832999, name: 'Seraikela-Kharsawan, West Singhbhum' },
  { start: 833001, end: 833999, name: 'Chaibasa, West Singhbhum' },
  { start: 834001, end: 834999, name: 'Ranchi (Capital)' },
  { start: 835001, end: 835999, name: 'Ranchi Rural, Khunti' },
];

const totalPins = jharkhandRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Jharkhand Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${jharkhandRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~5,000-6,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

jharkhandRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(45, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-jharkhand.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes industrial cities (Jamshedpur, Dhanbad, Ranchi)\n'));

