/**
 * Show Andhra Pradesh fetch information
 */

const chalk = require('chalk');

const andhraPradeshRanges = [
  { start: 500001, end: 500999, name: 'Hyderabad (shared/border)' },
  { start: 501001, end: 501999, name: 'Rangareddy (border areas)' },
  { start: 502001, end: 502999, name: 'Medak (border areas)' },
  { start: 503001, end: 503999, name: 'Nizamabad (border areas)' },
  { start: 504001, end: 504999, name: 'Adilabad (border areas)' },
  { start: 505001, end: 505999, name: 'Karimnagar (border areas)' },
  { start: 506001, end: 506999, name: 'Warangal (border areas)' },
  { start: 507001, end: 507999, name: 'Khammam' },
  { start: 508001, end: 508999, name: 'Nalgonda' },
  { start: 509001, end: 509999, name: 'Mahabubnagar (border areas)' },
  { start: 515001, end: 515999, name: 'Anantapur' },
  { start: 516001, end: 516999, name: 'Kadapa (Cuddapah)' },
  { start: 517001, end: 517999, name: 'Chittoor' },
  { start: 518001, end: 518999, name: 'Kurnool' },
  { start: 520001, end: 520999, name: 'Krishna, Vijayawada' },
  { start: 521001, end: 521999, name: 'Guntur' },
  { start: 522001, end: 522999, name: 'Prakasam, Ongole' },
  { start: 523001, end: 523999, name: 'Prakasam' },
  { start: 524001, end: 524999, name: 'Nellore' },
  { start: 525001, end: 525999, name: 'Vizianagaram' },
  { start: 530001, end: 530999, name: 'Visakhapatnam' },
  { start: 531001, end: 531999, name: 'East Godavari, Kakinada' },
  { start: 532001, end: 532999, name: 'Srikakulam' },
  { start: 533001, end: 533999, name: 'East Godavari' },
  { start: 534001, end: 534999, name: 'West Godavari' },
];

const totalPins = andhraPradeshRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Andhra Pradesh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(70)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${andhraPradeshRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~8,000-10,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run overnight or in background`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

andhraPradeshRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(35, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(70)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-andhra-pradesh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes border areas shared with Telangana (post-2014 split)\n'));

