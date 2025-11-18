// Test print without actual printer
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function testPrint() {
  console.log('🧪 Testing label generation...\n');

  // Generate test QR code
  const testQR = await QRCode.toDataURL('TEST-REG-2025-0001', {
    errorCorrectionLevel: 'H',
    width: 200,
    margin: 1,
  });

  const qrBase64 = testQR.split(',')[1];

  // Generate label
  const label = await generateLabel({
    name: 'JOHN DOE',
    location: 'Ahmedabad, Gujarat',
    registrationNumber: 'EXP2025-0001',
    qrCode: qrBase64,
  });

  // Save to file
  const fileName = `test-label-${Date.now()}.png`;
  const buffer = label.toBuffer('image/png');
  fs.writeFileSync(fileName, buffer);

  console.log(`✅ Test label saved: ${fileName}`);
  console.log('Open the file to verify label layout\n');
}

async function generateLabel({ name, location, registrationNumber, qrCode }) {
  const width = 342; // 29mm at 300 DPI
  const height = 1063; // 90mm at 300 DPI
  const padding = 20;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // QR code
  const qrSize = 280;
  const qrX = (width - qrSize) / 2;
  const qrY = padding;

  const qrImage = await loadImage(`data:image/png;base64,${qrCode}`);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

  // Name
  const textStartY = qrY + qrSize + 40;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px Arial';
  
  const nameLines = wrapText(ctx, name, width - padding * 2);
  nameLines.forEach((line, index) => {
    ctx.fillText(line, width / 2, textStartY + index * 50);
  });

  // Location
  if (location) {
    ctx.font = '28px Arial';
    ctx.fillText(location, width / 2, textStartY + nameLines.length * 50 + 40);
  }

  // Registration number
  if (registrationNumber) {
    ctx.font = 'bold 24px monospace';
    ctx.fillText(registrationNumber, width / 2, height - padding - 10);
  }

  return canvas;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Run test
testPrint().catch(console.error);

