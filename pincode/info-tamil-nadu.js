/**
 * Show Tamil Nadu fetch information
 */

const chalk = require('chalk');

const tamilNaduRanges = [
  { start: 600001, end: 600999, name: 'Chennai (Madras)' },
  { start: 601001, end: 601999, name: 'Chennai Suburbs, Kanchipuram' },
  { start: 602001, end: 602999, name: 'Tiruvallur, Chennai Rural' },
  { start: 603001, end: 603999, name: 'Kanchipuram, Chengalpattu' },
  { start: 604001, end: 604999, name: 'Villupuram, Cuddalore' },
  { start: 605001, end: 605999, name: 'Puducherry (UT), Cuddalore' },
  { start: 606001, end: 606999, name: 'Cuddalore, Villupuram' },
  { start: 607001, end: 607999, name: 'Cuddalore, Perambalur' },
  { start: 608001, end: 608999, name: 'Thanjavur, Tiruvarur' },
  { start: 609001, end: 609999, name: 'Nagapattinam, Karaikal' },
  { start: 610001, end: 610999, name: 'Tiruchirappalli (Trichy)' },
  { start: 611001, end: 611999, name: 'Thanjavur, Pudukkottai' },
  { start: 612001, end: 612999, name: 'Thanjavur, Ariyalur' },
  { start: 613001, end: 613999, name: 'Thanjavur, Pudukkottai' },
  { start: 614001, end: 614999, name: 'Pudukkottai, Sivaganga' },
  { start: 620001, end: 620999, name: 'Tiruchirappalli, Karur' },
  { start: 621001, end: 621999, name: 'Tiruchirappalli, Perambalur, Ariyalur' },
  { start: 622001, end: 622999, name: 'Pudukkottai, Sivaganga' },
  { start: 623001, end: 623999, name: 'Ramanathapuram, Sivaganga' },
  { start: 624001, end: 624999, name: 'Dindigul, Madurai' },
  { start: 625001, end: 625999, name: 'Madurai' },
  { start: 626001, end: 626999, name: 'Virudhunagar, Ramanathapuram' },
  { start: 627001, end: 627999, name: 'Tirunelveli, Thoothukudi (Tuticorin)' },
  { start: 628001, end: 628999, name: 'Thoothukudi, Tirunelveli' },
  { start: 629001, end: 629999, name: 'Kanyakumari' },
  { start: 630001, end: 630999, name: 'Karur, Namakkal' },
  { start: 631001, end: 631999, name: 'Krishnagiri, Vellore' },
  { start: 632001, end: 632999, name: 'Vellore, Tiruvannamalai' },
  { start: 633001, end: 633999, name: 'Vellore, Tirupattur' },
  { start: 635001, end: 635999, name: 'Krishnagiri, Dharmapuri' },
  { start: 636001, end: 636999, name: 'Salem, Namakkal' },
  { start: 637001, end: 637999, name: 'Namakkal, Salem' },
  { start: 638001, end: 638999, name: 'Erode, Karur' },
  { start: 639001, end: 639999, name: 'Karur, Dindigul' },
  { start: 641001, end: 641999, name: 'Coimbatore' },
  { start: 642001, end: 642999, name: 'Coimbatore, Tiruppur' },
  { start: 643001, end: 643999, name: 'Nilgiris (Ooty)' },
  { start: 644001, end: 644999, name: 'Tiruppur, Erode' },
  { start: 645001, end: 645999, name: 'Theni, Dindigul' },
];

const totalPins = tamilNaduRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Tamil Nadu Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${tamilNaduRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~12,000-15,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background or overnight`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

tamilNaduRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-tamil-nadu.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Chennai, Coimbatore, Madurai, Trichy, and all 38 districts\n'));

