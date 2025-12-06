/**
 * Show Madhya Pradesh fetch information
 */

const chalk = require('chalk');

const madhyaPradeshRanges = [
  { start: 450001, end: 450999, name: 'Indore' },
  { start: 451001, end: 451999, name: 'Indore Rural, Dhar' },
  { start: 452001, end: 452999, name: 'Indore, Dewas' },
  { start: 453001, end: 453999, name: 'Indore Rural, Dhar' },
  { start: 454001, end: 454999, name: 'Dhar, Jhabua' },
  { start: 455001, end: 455999, name: 'Dewas, Shajapur' },
  { start: 456001, end: 456999, name: 'Ujjain, Ratlam' },
  { start: 457001, end: 457999, name: 'Ratlam, Mandsaur' },
  { start: 458001, end: 458999, name: 'Mandsaur, Neemuch' },
  { start: 460001, end: 460999, name: 'Bhopal' },
  { start: 461001, end: 461999, name: 'Bhopal Rural, Sehore' },
  { start: 462001, end: 462999, name: 'Bhopal, Raisen' },
  { start: 464001, end: 464999, name: 'Vidisha, Raisen' },
  { start: 465001, end: 465999, name: 'Rajgarh, Shajapur' },
  { start: 466001, end: 466999, name: 'Sehore, Hoshangabad' },
  { start: 470001, end: 470999, name: 'Guna, Ashok Nagar' },
  { start: 471001, end: 471999, name: 'Chhatarpur, Tikamgarh' },
  { start: 472001, end: 472999, name: 'Tikamgarh, Chhatarpur' },
  { start: 473001, end: 473999, name: 'Shivpuri, Guna' },
  { start: 474001, end: 474999, name: 'Gwalior' },
  { start: 475001, end: 475999, name: 'Gwalior Rural, Bhind' },
  { start: 476001, end: 476999, name: 'Morena, Bhind' },
  { start: 477001, end: 477999, name: 'Bhind, Morena' },
  { start: 480001, end: 480999, name: 'Jabalpur' },
  { start: 481001, end: 481999, name: 'Jabalpur Rural, Mandla' },
  { start: 482001, end: 482999, name: 'Jabalpur, Seoni' },
  { start: 483001, end: 483999, name: 'Katni, Umaria' },
  { start: 484001, end: 484999, name: 'Shahdol, Anuppur' },
  { start: 485001, end: 485999, name: 'Satna, Rewa' },
  { start: 486001, end: 486999, name: 'Rewa, Sidhi' },
  { start: 487001, end: 487999, name: 'Sidhi, Singrauli' },
  { start: 488001, end: 488999, name: 'Panna, Chhatarpur' },
];

const totalPins = madhyaPradeshRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Madhya Pradesh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(75)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${madhyaPradeshRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~10,000-12,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.yellow(`   • Recommended: Run in background or overnight`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

madhyaPradeshRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(50, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(75)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-madhya-pradesh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: Includes Heart of India - Bhopal, Indore, Gwalior, Jabalpur, Ujjain\n'));

