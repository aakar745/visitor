/**
 * Show Bihar fetch information
 */

const chalk = require('chalk');

const biharRanges = [
  { start: 800001, end: 800999, name: 'Patna' },
  { start: 801001, end: 801999, name: 'Patna Rural, Nalanda' },
  { start: 802001, end: 802999, name: 'Bhojpur, Buxar' },
  { start: 803001, end: 803999, name: 'Nalanda, Nawada' },
  { start: 804001, end: 804999, name: 'Gaya, Jehanabad' },
  { start: 805001, end: 805999, name: 'Nawada, Jamui' },
  { start: 811001, end: 811999, name: 'Munger, Lakhisarai' },
  { start: 812001, end: 812999, name: 'Bhagalpur, Banka' },
  { start: 813001, end: 813999, name: 'Bhagalpur Rural' },
  { start: 814001, end: 814999, name: 'Dumka, Godda (Jharkhand border)' },
  { start: 821001, end: 821999, name: 'Rohtas, Kaimur' },
  { start: 823001, end: 823999, name: 'Gaya Rural, Aurangabad' },
  { start: 824001, end: 824999, name: 'Aurangabad, Arwal' },
  { start: 841001, end: 841999, name: 'Saran, Chapra' },
  { start: 842001, end: 842999, name: 'Siwan, Gopalganj' },
  { start: 843001, end: 843999, name: 'Muzaffarpur, Vaishali' },
  { start: 844001, end: 844999, name: 'East Champaran, Motihari' },
  { start: 845001, end: 845999, name: 'West Champaran, Bettiah' },
  { start: 846001, end: 846999, name: 'Darbhanga, Madhubani' },
  { start: 847001, end: 847999, name: 'Madhubani, Supaul' },
  { start: 848001, end: 848999, name: 'Samastipur, Begusarai' },
  { start: 851001, end: 851999, name: 'Saharsa, Madhepura' },
  { start: 852001, end: 852999, name: 'Madhepura, Supaul' },
  { start: 853001, end: 853999, name: 'Araria, Kishanganj' },
  { start: 854001, end: 854999, name: 'Purnia, Katihar' },
  { start: 855001, end: 855999, name: 'Kishanganj, Araria' },
  { start: 856001, end: 856999, name: 'Katihar, Purnia Rural' },
];

const totalPins = biharRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Bihar Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${biharRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~8,000-10,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

biharRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(40, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-bihar.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Covers all 38 districts of Bihar\n'));

