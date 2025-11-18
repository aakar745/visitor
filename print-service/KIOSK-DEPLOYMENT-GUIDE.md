# 🖥️ **KIOSK DEPLOYMENT GUIDE**
## For Non-Technical Staff

---

## 📦 **What You Need:**

1. ✅ Windows 10/11 PC
2. ✅ Brother QL-800 printer (connected via USB)
3. ✅ USB flash drive (to copy installer)
4. ✅ 5 minutes

---

## 🚀 **ONE-TIME SETUP (Per Kiosk):**

### Step 1: Copy Files to USB
Copy this entire folder to a USB drive:
```
print-service/
```

### Step 2: On Each Kiosk PC

1. **Install Node.js** (one-time):
   - Download from: https://nodejs.org/
   - Run installer
   - Use all default settings
   - Restart PC after installation

2. **Copy folder from USB** to:
   ```
   C:\BadgePrintService\
   ```

3. **Right-click** on `SETUP-KIOSK.bat`
   - Select **"Run as Administrator"**
   - Wait for installation (2-3 minutes)
   - Done! ✅

---

## 🎯 **That's It!**

The service will:
- ✅ Auto-start when Windows boots
- ✅ Run in background (no window)
- ✅ Restart automatically if it crashes

---

## 🧪 **How to Test:**

1. Open Chrome/Edge
2. Go to: `http://localhost:9100/health`
3. Should see: `{"status": "running"}`
4. ✅ Working!

---

## 🔧 **Staff Troubleshooting:**

### Problem: Service not running

**Solution:**
1. Double-click desktop shortcut: **"Print Service"**
2. Wait 5 seconds
3. Test again

### Problem: Labels not printing

**Check:**
1. ✅ Brother QL-800 is powered on
2. ✅ USB cable is connected
3. ✅ Label roll is loaded
4. ✅ Restart print service (use desktop shortcut)

### Problem: Everything broken

**Emergency Fix:**
1. Restart the kiosk PC
2. Service will auto-start
3. Call IT support if still broken

---

## 📞 **Support Contact:**

For technical issues, contact:
- **IT Admin:** [Your contact info]
- **Remote Support:** [TeamViewer/AnyDesk ID]

---

## 🗑️ **To Uninstall:**

Right-click **"UNINSTALL.bat"** → Run as Administrator

---

## 🎨 **Optional: Kiosk Mode Setup**

To make the kiosk full-screen:

1. Create file on Desktop: `Start-Kiosk.bat`
2. Add this content:
   ```batch
   @echo off
   start chrome.exe --kiosk --app=http://localhost:3001/kiosk/auto-print
   ```
3. Put this in Windows **Startup** folder:
   - Press `Win+R`
   - Type: `shell:startup`
   - Copy `Start-Kiosk.bat` here

Now kiosk opens automatically on boot! 🚀

---

## 📋 **Deployment Checklist:**

For each kiosk, verify:

- [ ] Node.js installed
- [ ] Print service installed (`SETUP-KIOSK.bat`)
- [ ] Service running (test health endpoint)
- [ ] Brother QL-800 connected
- [ ] Labels loaded in printer
- [ ] Kiosk URL opens: `http://localhost:3001/kiosk/auto-print`
- [ ] Test scan works
- [ ] Auto-start on boot tested
- [ ] Staff trained on basic troubleshooting

---

**🎉 Done! Kiosk is production-ready!**

