# 🚀 Auto-Print System Deployment Guide

Complete step-by-step guide to deploy the auto-print badge system at your kiosk.

## 📋 System Overview

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐      ┌──────────────┐
│   Visitor   │ ───> │   Frontend   │ ───> │ Print Service │ ───> │ Brother QL   │
│  (QR Code)  │      │ /kiosk/auto  │      │  localhost    │      │  Thermal     │
└─────────────┘      │    -print    │      │    :9100      │      │  Printer     │
                     └──────────────┘      └───────────────┘      └──────────────┘
```

## 🖥️ Kiosk PC Requirements

### Hardware
- ✅ **PC/Laptop**: Windows 10/11 (4GB RAM minimum)
- ✅ **Printer**: Brother QL-800 thermal label printer
- ✅ **USB Cable**: For printer connection
- ✅ **Labels**: 29mm × 90mm continuous rolls (Brother DK-11201 or compatible)
- ✅ **Camera**: For QR code scanning (built-in or USB webcam)
- ✅ **Touch Screen**: Optional but recommended for kiosk

### Software
- ✅ **Node.js 18+**: [Download](https://nodejs.org/)
- ✅ **Brother QL-800 Drivers**: [Download](https://support.brother.com/)
- ✅ **Modern Browser**: Chrome/Edge (for frontend)

## 📦 Installation Steps

### Step 1: Configure Backend (Admin Panel)

1. Open Admin Panel: `http://localhost:3000`
2. Navigate to: **Kiosk Settings**
3. Scroll to: **Auto-Print Badge System**
4. Configure:
   ```
   ✓ Enable Auto-Print: ON
   ✓ Printer Model: Brother QL-800
   ✓ Connection Type: USB
   ✓ Print Service URL: http://localhost:9100
   ✓ Label Width: 29 mm
   ✓ Label Height: 90 mm
   ✓ Show Location: ON (optional)
   ✓ Show Registration Number: ON (optional)
   ✓ Test Mode: OFF (turn ON for testing without printer)
   ```
5. Click **Save Settings**

### Step 2: Install Print Service

1. Navigate to print service folder:
   ```bash
   cd E:\Project\visitor\print-service
   ```

2. Run installer:
   ```bash
   install.bat
   ```
   This will:
   - Install all dependencies (Express, Canvas, QRCode, etc.)
   - Create `.env` configuration file
   - Verify Node.js installation

3. Verify installation:
   ```bash
   npm test
   ```
   This creates a test label image without printing.

### Step 3: Start Print Service

#### Option A: Manual Start (for testing)

```bash
start.bat
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   🖨️  Badge Print Service for Brother QL-800     ║
║                                                   ║
║   Status: RUNNING ✅                              ║
║   Port: 9100                                      ║
║   Ready to print badges! 🎟️                       ║
╚═══════════════════════════════════════════════════╝
```

#### Option B: Auto-Start as Windows Service (production)

1. Install NSSM:
   ```bash
   choco install nssm
   ```

2. Create service:
   ```bash
   nssm install BadgePrintService "C:\Program Files\nodejs\node.exe" "E:\Project\visitor\print-service\server.js"
   ```

3. Start service:
   ```bash
   nssm start BadgePrintService
   ```

4. Set to auto-start on boot:
   ```bash
   nssm set BadgePrintService Start SERVICE_AUTO_START
   ```

### Step 4: Connect Brother QL-800

1. Connect printer to PC via USB
2. Power on the printer
3. Install drivers from Brother website
4. Load 29mm × 90mm label roll
5. Test connection:
   ```bash
   curl http://localhost:9100/test-connection
   ```

### Step 5: Deploy Frontend Kiosk Page

1. Open frontend in kiosk mode:
   ```
   http://localhost:3001/kiosk/auto-print
   ```

2. For production, use full-screen mode:
   - Press **F11** in browser
   - Or use kiosk mode: `chrome.exe --kiosk http://localhost:3001/kiosk/auto-print`

## 🧪 Testing

### Test 1: Print Service Health

```bash
curl http://localhost:9100/health
```

**Expected:**
```json
{
  "status": "running",
  "printer": "Brother QL-800",
  "port": 9100
}
```

### Test 2: Printer Connection

```bash
curl http://localhost:9100/test-connection
```

**Expected:**
```json
{
  "success": true,
  "message": "Printer is connected"
}
```

### Test 3: End-to-End Flow (Test Mode)

1. Enable **Test Mode** in admin panel
2. Open auto-print page: `http://localhost:3001/kiosk/auto-print`
3. Scan any visitor QR code
4. Verify:
   - ✅ QR code detected
   - ✅ Visitor name displayed
   - ✅ Check-in successful
   - ✅ "TEST MODE" message shown
   - ✅ No actual printing (simulated)

### Test 4: Real Printing

1. Disable **Test Mode** in admin panel
2. Scan visitor QR code
3. Verify:
   - ✅ Label prints within 2 seconds
   - ✅ QR code is clear and scannable
   - ✅ Name is readable
   - ✅ Success message displays

## 🎨 Label Layout Preview

```
┌───────────────────────┐
│                       │ ← Top margin
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │ ← QR Code (280x280px)
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │
│                       │
│     JOHN DOE          │ ← Name (bold, 40px)
│  Mumbai, Maharashtra  │ ← Location (28px, optional)
│                       │
│   EXP2025-0001        │ ← Reg. Number (24px, optional)
│                       │ ← Bottom margin
└───────────────────────┘
    29mm × 90mm
```

## ⚙️ Kiosk Configuration

### Full-Screen Kiosk Mode (Windows)

Create `start-kiosk.bat`:
```batch
@echo off
start chrome.exe --kiosk --app=http://localhost:3001/kiosk/auto-print
```

### Auto-Start on Windows Login

1. Press `Win + R`
2. Type: `shell:startup`
3. Copy `start-kiosk.bat` to this folder

### Disable Sleep Mode

```
Settings > System > Power & sleep
- When plugged in, PC goes to sleep: Never
- When plugged in, turn off screen: Never
```

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **Print Speed** | ~2 seconds/label |
| **Throughput** | ~30 labels/minute |
| **QR Scan Time** | ~0.5 seconds |
| **Total Time** | ~2.5 seconds per visitor |
| **Daily Capacity** | 10,000+ visitors |

## 🔧 Troubleshooting

### Issue: "Printer not connected"

**Solutions:**
1. Check USB cable
2. Restart printer
3. Reinstall Brother drivers
4. Restart print service

### Issue: "Port already in use"

**Solutions:**
1. Check if another service is using port 9100
2. Change port in `.env` file
3. Update "Print Service URL" in admin panel

### Issue: Print quality poor

**Solutions:**
1. Clean print head with Brother cleaning sheet
2. Check label roll alignment
3. Adjust print density in driver settings
4. Replace label roll if old

### Issue: QR codes not scanning well

**Solutions:**
1. Increase QR size in `server.js` (change `qrSize` variable)
2. Use higher error correction level ('H')
3. Ensure good lighting for camera
4. Print test label and verify with phone

## 🛡️ Security Considerations

- ✅ Print service runs on localhost only
- ✅ Not exposed to internet
- ✅ No authentication needed (local network)
- ✅ Input validation on all API requests
- ✅ Rate limiting handled by backend

## 📈 Scaling for Large Events

### For 1000+ visitors per day:

1. **Multiple kiosks**: Deploy print service on each kiosk PC
2. **Load balancing**: Use multiple Brother QL-800 printers
3. **Redis queue**: Coming in Phase 2 (future upgrade)
4. **Monitoring**: Add Grafana dashboard for print metrics

### Recommended Hardware per Kiosk:

- **1 PC** (Windows 10/11)
- **1 Brother QL-800** printer
- **1 Touchscreen** monitor
- **1 Webcam** (if monitor doesn't have built-in)
- **10 rolls** of 29mm × 90mm labels (backup)

## 🎯 Production Checklist

Before going live:

- [ ] Backend configured and running
- [ ] Admin panel kiosk settings saved
- [ ] Print service installed and started
- [ ] Brother QL-800 connected via USB
- [ ] Drivers installed
- [ ] Label roll loaded (29mm × 90mm)
- [ ] Test print successful
- [ ] Frontend auto-print page opened
- [ ] Full-screen/kiosk mode enabled
- [ ] Auto-start configured (optional)
- [ ] Test with real visitor QR code
- [ ] Backup label rolls available
- [ ] Test mode disabled

## 📞 Support

### Print Service Issues
- Check console logs for errors
- Verify printer connection
- Restart print service

### Hardware Issues
- Contact Brother support: [https://support.brother.com/](https://support.brother.com/)
- Check printer manual

### Software Issues
- Check backend logs
- Verify kiosk settings in admin panel
- Test with browser developer tools

---

**🎉 You're ready to print badges at scale!**

For questions or issues, check the logs or contact your system administrator.

