# 🖨️ Auto-Print Setup Guide

## ✅ Quick Setup (3 Steps)

### **Step 1: Create `.env` file**

Create a new file named `.env` in the `print-service` folder with this content:

```env
# Print Service Configuration
PORT=9100

# ⭐ Enable Auto-Print
AUTO_PRINT=true

# Printer Name (must match EXACTLY as shown in Windows)
PRINTER_NAME=Brother QL-800

# Print Method (powershell is most reliable on Windows)
PRINT_METHOD=powershell
```

---

### **Step 2: Find Your Exact Printer Name**

1. **Open:** Control Panel → Devices and Printers
2. **Find:** Your Brother QL-800 printer
3. **Right-click** → Properties
4. **Copy the EXACT printer name** (including spaces, dashes, etc.)
5. **Update** `PRINTER_NAME` in `.env` file

**Examples:**
```env
# If your printer shows as "Brother QL-800"
PRINTER_NAME=Brother QL-800

# If your printer shows as "Brother QL-800 (USB)"
PRINTER_NAME=Brother QL-800 (USB)

# If your printer shows as "QL-800"
PRINTER_NAME=QL-800
```

---

### **Step 3: Restart Print Service**

```bash
# Stop the service (Ctrl+C if running)
# Then restart:
npm start
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   🖨️  Badge Print Service for Brother QL-800     ║
║   Auto-Print: ENABLED ✅                          ║
║   Printer: Brother QL-800                         ║
║   Method: powershell                              ║
╚═══════════════════════════════════════════════════╝
```

---

## 🧪 Test Auto-Print

### **Test 1: Test Print Endpoint**

```bash
# Send test print request
curl -X POST http://localhost:9100/test-print ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Visitor\",\"location\":\"Mumbai\",\"registrationNumber\":\"TEST123\"}"
```

**Expected Result:** Label should print automatically!

---

### **Test 2: Full Print with QR Code**

```bash
curl -X POST http://localhost:9100/print ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"location\":\"Mumbai, Maharashtra\",\"registrationNumber\":\"EXP2025-0001\",\"qrCode\":\"iVBORw0KGgoAAAANSUhEUgAA...\"}"
```

---

## 📋 Configuration Options

### **AUTO_PRINT**
- `true` = Automatic printing enabled
- `false` = Manual printing (HTML files only)

### **PRINT_METHOD**

#### **Option 1: powershell (Recommended)**
```env
PRINT_METHOD=powershell
```
- ✅ Direct printing via Windows
- ✅ Most reliable
- ✅ No user interaction needed
- ❌ Windows only

#### **Option 2: browser**
```env
PRINT_METHOD=browser
```
- ✅ Opens HTML in browser
- ✅ Cross-platform
- ❌ Requires user to click "Print" or Ctrl+P
- ❌ Semi-automatic

---

## 🔄 Complete Workflow with Auto-Print

```
Visitor scans QR at kiosk
        ↓
Frontend validates registration
        ↓
Backend checks in visitor
        ↓
Frontend sends to Print Service:
  POST http://localhost:9100/print
        ↓
Print Service generates label
        ↓
[AUTO_PRINT=true]
        ↓
PowerShell sends to Brother QL-800
        ↓
✅ Label prints automatically!
        ↓
Visitor receives physical badge
```

---

## ⚠️ Troubleshooting

### **Issue: Nothing prints**

**Solution 1: Check printer name**
```bash
# Run this in PowerShell to list all printers:
Get-Printer | Select-Object Name

# Copy the EXACT name and update .env
```

**Solution 2: Check printer status**
```bash
# Visit: http://localhost:9100/test-connection
# Should show: "Printer is connected"
```

**Solution 3: Test manual print**
```bash
# Set AUTO_PRINT=false in .env
# Restart service
# Send print request
# Open HTML file from ./labels/ folder
# Try printing manually (Ctrl+P)
```

---

### **Issue: HTML opens but doesn't print**

This happens with `PRINT_METHOD=browser`

**Solution:** Switch to PowerShell method:
```env
PRINT_METHOD=powershell
```

---

### **Issue: Permission denied**

**Solution:** Run PowerShell as Administrator:
```powershell
# Check execution policy
Get-ExecutionPolicy

# If Restricted, change to RemoteSigned
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎯 Production Deployment

### **Option 1: Run as Startup Application**

Create `print-service-startup.bat`:
```bat
@echo off
cd /d "E:\Project\visitor\print-service"
start /min npm start
```

Add to Windows Startup folder:
- Press `Win+R`
- Type: `shell:startup`
- Copy `print-service-startup.bat` here

---

### **Option 2: Run as Windows Service**

```bash
# Install nssm (Service Manager)
choco install nssm

# Install service
nssm install BadgePrintService "C:\Program Files\nodejs\node.exe"
nssm set BadgePrintService AppDirectory "E:\Project\visitor\print-service"
nssm set BadgePrintService AppParameters "server.js"

# Start service
nssm start BadgePrintService

# Service will auto-start on boot
```

---

## 📊 Label Specifications

- **Size:** 29mm × 90mm
- **QR Code:** 25mm × 25mm (center)
- **Content:**
  - QR Code (top)
  - Visitor Name (bold, 10pt)
  - Location (7pt)
  - Registration Number (6pt, monospace)

---

## ✅ Summary

1. **Create `.env`** with `AUTO_PRINT=true`
2. **Set exact printer name** from Windows
3. **Restart service** → See "Auto-Print: ENABLED ✅"
4. **Test print** → Label should print automatically!
5. **Deploy** as Windows service for production

**That's it! Your kiosk will now print badges automatically. 🎉**

