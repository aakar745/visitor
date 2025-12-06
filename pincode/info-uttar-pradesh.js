/**
 * Show Uttar Pradesh fetch information
 */

const chalk = require('chalk');

const uttarPradeshRanges = [
  { start: 201001, end: 201999, name: 'Ghaziabad, Gautam Buddha Nagar (Noida)' },
  { start: 202001, end: 202999, name: 'Aligarh, Hathras' },
  { start: 203001, end: 203999, name: 'Bulandshahr, Gautam Buddha Nagar' },
  { start: 204001, end: 204999, name: 'Hathras, Mathura' },
  { start: 205001, end: 205999, name: 'Mainpuri, Etah' },
  { start: 206001, end: 206999, name: 'Etawah, Auraiya' },
  { start: 207001, end: 207999, name: 'Etah, Kasganj' },
  { start: 208001, end: 208999, name: 'Kanpur Nagar, Kanpur Dehat' },
  { start: 209001, end: 209999, name: 'Kanpur Rural, Farrukhabad' },
  { start: 210001, end: 210999, name: 'Banda, Chitrakoot, Mahoba' },
  { start: 211001, end: 211999, name: 'Allahabad (Prayagraj)' },
  { start: 212001, end: 212999, name: 'Allahabad Rural, Fatehpur' },
  { start: 221001, end: 221999, name: 'Varanasi (Banaras)' },
  { start: 222001, end: 222999, name: 'Jaunpur, Sultanpur' },
  { start: 223001, end: 223999, name: 'Azamgarh, Mau' },
  { start: 224001, end: 224999, name: 'Ambedkar Nagar, Faizabad (Ayodhya)' },
  { start: 225001, end: 225999, name: 'Barabanki, Raebareli' },
  { start: 226001, end: 226999, name: 'Lucknow (Capital)' },
  { start: 227001, end: 227999, name: 'Lucknow Rural, Unnao' },
  { start: 228001, end: 228999, name: 'Sultanpur, Amethi' },
  { start: 229001, end: 229999, name: 'Raebareli, Pratapgarh' },
  { start: 230001, end: 230999, name: 'Pratapgarh, Kaushambi' },
  { start: 231001, end: 231999, name: 'Mirzapur, Sonbhadra' },
  { start: 232001, end: 232999, name: 'Sant Ravidas Nagar, Chandauli' },
  { start: 233001, end: 233999, name: 'Ghazipur, Ballia' },
  { start: 234001, end: 234999, name: 'Jhansi, Lalitpur' },
  { start: 241001, end: 241999, name: 'Meerut, Baghpat' },
  { start: 242001, end: 242999, name: 'Sambhal, Moradabad' },
  { start: 243001, end: 243999, name: 'Bareilly, Budaun' },
  { start: 244001, end: 244999, name: 'Moradabad, Rampur' },
  { start: 245001, end: 245999, name: 'Hapur, Ghaziabad Rural' },
  { start: 246001, end: 246999, name: 'Bijnor, Amroha' },
  { start: 247001, end: 247999, name: 'Saharanpur, Shamli' },
  { start: 248001, end: 248999, name: 'Dehradun (shares with Uttarakhand)' },
  { start: 249001, end: 249999, name: 'Muzaffarnagar, Shamli' },
  { start: 250001, end: 250999, name: 'Meerut Rural' },
  { start: 251001, end: 251999, name: 'Muzaffarnagar, Shamli' },
  { start: 261001, end: 261999, name: 'Sitapur, Hardoi' },
  { start: 262001, end: 262999, name: 'Pilibhit, Shahjahanpur' },
  { start: 263001, end: 263999, name: 'Lakhimpur Kheri' },
  { start: 271001, end: 271999, name: 'Gonda, Bahraich' },
  { start: 272001, end: 272999, name: 'Siddharthnagar, Basti' },
  { start: 273001, end: 273999, name: 'Gorakhpur, Deoria' },
  { start: 274001, end: 274999, name: 'Kushinagar, Deoria' },
  { start: 275001, end: 275999, name: 'Maharajganj, Sant Kabir Nagar' },
  { start: 276001, end: 276999, name: 'Azamgarh, Mau' },
  { start: 277001, end: 277999, name: 'Ballia' },
  { start: 281001, end: 281999, name: 'Mathura, Agra' },
  { start: 282001, end: 282999, name: 'Agra' },
  { start: 283001, end: 283999, name: 'Agra Rural, Firozabad' },
  { start: 284001, end: 284999, name: 'Jhansi, Jalaun' },
  { start: 285001, end: 285999, name: 'Hamirpur, Jalaun' },
];

const totalPins = uttarPradeshRanges.reduce((sum, range) => 
  sum + (range.end - range.start + 1), 0
);

console.log(chalk.blue.bold('\n📊 Uttar Pradesh Complete Fetch Information\n'));
console.log(chalk.gray('━'.repeat(80)));

console.log(chalk.cyan('\n📍 Coverage:'));
console.log(chalk.white(`   • Total ranges: ${uttarPradeshRanges.length}`));
console.log(chalk.white(`   • Total PINs to check: ${totalPins.toLocaleString()}`));
console.log(chalk.white(`   • Expected valid PINs: ~18,000-22,000`));

console.log(chalk.cyan('\n⏱️  Time Estimate:'));
console.log(chalk.white(`   • At 60 req/min: ~${Math.ceil(totalPins / 60)} minutes (~${(totalPins / 60 / 60).toFixed(1)} hours)`));
console.log(chalk.red.bold(`   • ⚠️  LARGEST FETCH! BEST TO RUN OVERNIGHT! ⚠️`));

console.log(chalk.cyan('\n📋 District Ranges:\n'));

uttarPradeshRanges.forEach((range, idx) => {
  const count = range.end - range.start + 1;
  console.log(chalk.white(`   ${String(idx + 1).padStart(2, ' ')}. ${range.start}-${range.end} | ${range.name.padEnd(55, ' ')} | ${count.toLocaleString().padStart(5, ' ')} PINs`));
});

console.log(chalk.gray('\n' + '━'.repeat(80)));
console.log(chalk.green('\n✅ To start complete fetch:\n'));
console.log(chalk.white('   node fetch-uttar-pradesh.js\n'));
console.log(chalk.yellow('💡 Tip: The script auto-saves progress every 500 PINs, safe to stop anytime!\n'));
console.log(chalk.cyan('📝 Note: India\'s most populous state - Includes Lucknow, Agra, Varanasi, Kanpur, Allahabad\n'));

