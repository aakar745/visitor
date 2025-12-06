/**
 * Show Odisha fetch information
 */

const chalk = require('chalk');

const odishaRanges = [
  { start: 750001, end: 750999, name: 'Cuttack, Jagatsinghpur' },
  { start: 751001, end: 751999, name: 'Bhubaneswar (Capital), Khordha' },
  { start: 752001, end: 752999, name: 'Puri, Nayagarh' },
  { start: 753001, end: 753999, name: 'Cuttack Rural, Jajapur, Kendrapara' },
  { start: 754001, end: 754999, name: 'Cuttack, Kendrapara, Jajapur' },
  { start: 755001, end: 755999, name: 'Jajapur, Kendujhar (Keonjhar)' },
  { start: 756001, end: 756999, name: 'Bhadrak, Balasore' },
  { start: 757001, end: 757999, name: 'Balasore, Mayurbhanj' },
  { start: 758001, end: 758999, name: 'Kendujhar (Keonjhar)' },
  { start: 759001, end: 759999, name: 'Dhenkanal, Angul' },
  { start: 760001, end: 760999, name: 'Balangir, Bargarh' },
  { start: 761001, end: 761999, name: 'Ganjam, Gajapati' },
  { start: 762001, end: 762999, name: 'Kalahandi, Nuapada' },
  { start: 763001, end: 763999, name: 'Phulbani (Kandhamal), Boudh' },
  { start: 764001, end: 764999, name: 'Koraput, Nabarangpur' },
  { start: 765001, end: 765999, name: 'Rayagada, Kalahandi' },
  { start: 766001, end: 766999, name: 'Malkangiri, Koraput' },
  { start: 767001, end: 767999, name: 'Balangir, Sonepur' },
];

const totalPins = odishaRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Odisha Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${odishaRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~6,000-8,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

odishaRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-odisha.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Bhubaneswar (capital), Puri (Jagannath Temple), and all 30 districts\n'));

