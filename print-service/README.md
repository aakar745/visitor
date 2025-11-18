# 🖨️ Visitor Badge Print Service

Local print service for **Brother QL-800** thermal label printer.

## 📋 Features

- ✅ High-speed thermal printing (29mm × 90mm labels)
- ✅ REST API for integration with kiosk systems
- ✅ QR code + Name layout (optimized for Brother QL-800)
- ✅ USB connection (Network support coming soon)
- ✅ Auto-reconnection and error handling
- ✅ Test mode for development

## 🚀 Quick Start

### Prerequisites

1. **Brother QL-800** thermal label printer
2. **USB cable** connected to kiosk PC
3. **Node.js 18+** installed
4. **Label roll**: 29mm × 90mm (Brother DK-11201 or compatible)

### Installation

#### Windows (Recommended)

1. Double-click `install.bat` (will install dependencies automatically)
2. Copy `.env.example` to `.env`
3. Run `start.bat` to start the service

#### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start service
npm start
```

## ⚙️ Configuration

Edit `.env` file:

```env
PORT=9100
PRINTER_INTERFACE=usb://Brother/QL-800
```

## 🧪 Testing

### Test without printer

```bash
npm run test
```

This will generate a test label image file without requiring a printer.

### Test with printer

```bash
curl http://localhost:9100/test-connection
```

Should return:
```json
{
  "success": true,
  "message": "Printer is connected"
}
```

## 📡 API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "running",
  "printer": "Brother QL-800",
  "port": 9100,
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### 2. Test Connection

```http
GET /test-connection
```

**Response:**
```json
{
  "success": true,
  "message": "Printer is connected"
}
```

### 3. Print Label

```http
POST /print
Content-Type: application/json

{
  "name": "John Doe",
  "location": "Mumbai, Maharashtra",
  "registrationNumber": "EXP2025-0001",
  "qrCode": "base64_encoded_qr_image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Label printed successfully for John Doe",
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

### 4. Test Print (No Printer)

```http
POST /test-print
Content-Type: application/json

{
  "name": "Test Visitor",
  "location": "Test City",
  "registrationNumber": "TEST123"
}
```

Saves a PNG file instead of printing.

## 🏷️ Label Layout

```
┌─────────────────────┐
│                     │
│    ▀▀▀▀▀▀▀▀▀▀▀     │
│    ▀  QR    ▀     │
│    ▀ CODE   ▀     │
│    ▀▀▀▀▀▀▀▀▀▀▀     │
│                     │
│   JOHN DOE          │
│   Mumbai, MH        │
│                     │
│   EXP2025-0001      │
└─────────────────────┘
    29mm × 90mm
```

## 🔧 Troubleshooting

### Printer not detected

1. Check USB cable connection
2. Install Brother QL-800 drivers from [Brother website](https://support.brother.com/)
3. Ensure printer is powered on
4. Restart the print service

### Print quality issues

1. Clean the print head
2. Check label roll alignment
3. Adjust print density in Brother driver settings

### Port already in use

Change `PORT` in `.env` file and update the admin panel's "Print Service URL" setting.

## 🚀 Production Deployment

### Windows Service (Recommended)

Use `nssm` (Non-Sucking Service Manager) to run as a Windows service:

```bash
# Install nssm
choco install nssm

# Install service
nssm install BadgePrintService "C:\Program Files\nodejs\node.exe" "E:\Project\visitor\print-service\server.js"

# Start service
nssm start BadgePrintService
```

### Auto-start on boot

Add to Windows Task Scheduler:
- Trigger: At system startup
- Action: Start program `node.exe`
- Arguments: `E:\Project\visitor\print-service\server.js`

## 📊 Performance

- **Print speed**: ~2 seconds per label (including QR generation)
- **Throughput**: ~30 labels/minute
- **Queue support**: Coming soon with Redis integration

## 🛡️ Security

- Runs on localhost only (not exposed to internet)
- No authentication (local network only)
- Input validation for all API requests

## 📝 License

MIT

## 🆘 Support

For issues with:
- **Print service**: Check logs in console
- **Printer hardware**: Contact Brother support
- **Integration**: Check admin panel Kiosk Settings

---

**Ready to print at scale!** 🎟️ 🚀

