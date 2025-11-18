# 🖨️ Print Service Manager - User Guide

## 📋 Quick Start Guide for Non-Technical Users

This guide will help you set up and use the Print Service Manager for the Brother QL-800 label printer.

---

## ✅ Prerequisites (What You Need)

Before installing, make sure you have:

1. **Windows PC** (Windows 10 or later)
2. **Brother QL-800 Printer** connected via USB
3. **Brother Printer Drivers** installed (comes with the printer CD or download from Brother website)
4. **Redis Server** running (see Redis setup below)

---

## 📦 Installation Steps

### Step 1: Install Redis (Required)

Redis is required for the print queue system. Choose ONE of these methods:

#### Option A: Using Docker (Recommended)
```powershell
# Install Docker Desktop for Windows first
# Then run this command:
docker run -d --name redis-print -p 6379:6379 redis:alpine
```

#### Option B: Using Windows Installer
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Run the installer
3. Keep default settings
4. Redis will start automatically

### Step 2: Install Print Service Manager

1. **Download** `Print-Service-Manager-Setup.exe` from your administrator
2. **Double-click** the installer
3. **Choose** installation location (or keep default)
4. Click **Install**
5. The application will start automatically after installation

---

## 🚀 Using the Application

### First Time Setup

1. **System Tray Icon**: After installation, you'll see a printer icon in your system tray (next to the clock)

2. **Open the Manager**: 
   - Click the system tray icon
   - OR double-click the desktop shortcut

3. **Configure Printer**:
   - In the Configuration section, select your **Brother QL-800** from the dropdown
   - Click **Refresh** button if you don't see it
   - Click **Save Configuration**

4. **Check Redis**:
   - The Redis status should show **🟢 Connected**
   - If it shows **🔴 Not Running**, make sure Redis is installed and running
   - Click **Check Redis** button to recheck

---

## 🎮 Main Controls

### Print Worker (Queue)
This is the main service that processes print jobs from the queue.

- **Start Worker**: Click to start processing print jobs
- **Stop Worker**: Click to stop processing

💡 **Keep this running** during exhibition hours!

### HTTP Server (Legacy)
This is the old direct print method. Usually not needed.

- Only start if specifically instructed by your administrator

### Service Logs
- All activity is shown in the **Service Logs** section at the bottom
- Green messages = Success
- Red messages = Errors
- Yellow messages = Warnings

---

## 🔧 Configuration Settings

### Printer Selection
- Select your **Brother QL-800** from the dropdown
- If you have multiple printers, make sure to choose the correct one
- Click **Save Configuration** after making changes

### Redis Settings
- **Host**: Usually `localhost` (leave as default)
- **Port**: Usually `6379` (leave as default)
- Only change if your administrator instructs you

### Labels Folder
- Click **Open Labels Folder** to see all printed labels
- Labels are saved as PNG and PDF files

---

## 💡 Tips for Daily Use

### Starting Your Day
1. **Open the Print Service Manager** (if not already running)
2. **Check** that Redis is connected (🟢 green)
3. **Start the Print Worker**
4. Look for "✅ Print Worker started" in logs
5. **Minimize** the window (it will stay in system tray)

### During the Day
- The service runs in the background
- Check logs occasionally for any errors
- The system tray icon shows if services are running

### End of Day
- You can leave it running (it will start automatically on PC restart)
- OR click **Stop Worker** and close the application

### If Print is Not Working
1. Check **Worker Status** - should be 🟢 Running
2. Check **Redis Status** - should be 🟢 Connected
3. Check **Service Logs** for error messages
4. Make sure printer is turned on and has labels loaded
5. Try **Stop Worker** then **Start Worker** again

---

## 🆘 Troubleshooting

### "Redis not running" Error
**Solution**:
1. Make sure Redis is installed
2. If using Docker: `docker start redis-print`
3. If using Windows installer: Open Services app and start "Redis" service

### "No printers found"
**Solution**:
1. Make sure printer is connected via USB
2. Make sure Brother printer drivers are installed
3. Click **Refresh** button in Configuration section
4. Restart the application

### Print jobs not printing
**Solution**:
1. Check if Worker is running (should be 🟢)
2. Check if Redis is connected (should be 🟢)
3. Check Service Logs for errors
4. Make sure printer has labels loaded
5. Restart the Worker (Stop then Start)

### Application won't start
**Solution**:
1. Make sure you have Node.js installed (bundled with installer)
2. Right-click the app and "Run as Administrator"
3. Check if Redis is running
4. Reinstall the application

---

## 🔄 Auto-Start on Windows Boot

The application is configured to start automatically when Windows starts.

To **disable** auto-start:
1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Delete the "Print Service Manager" shortcut

To **enable** auto-start:
1. Open Print Service Manager
2. Right-click the system tray icon
3. Select "Start with Windows"

---

## 📞 Getting Help

If you encounter issues:

1. **Check the Service Logs** - most errors show here with explanations
2. **Take a screenshot** of the error
3. **Contact your IT administrator** or system manager
4. Provide:
   - Screenshot of the error
   - What you were doing when error occurred
   - Windows version

---

## 🔐 Security Notes

- The application runs locally on your PC
- No data is sent to the internet
- Redis stores print jobs temporarily (automatically cleared)
- All print labels are saved in the `labels` folder for record-keeping

---

## 📝 Version Information

**Current Version**: 1.0.0  
**Last Updated**: November 2025  
**Supported Printers**: Brother QL-800  
**Supported OS**: Windows 10, Windows 11  

---

## ✨ Quick Reference

| Action | How To |
|--------|--------|
| Open application | Click system tray icon |
| Start print service | Click "Start Worker" button |
| Stop print service | Click "Stop Worker" button |
| Change printer | Select from dropdown → Save Configuration |
| View printed labels | Click "Open Labels Folder" |
| Clear logs | Click "Clear" button in logs section |
| Minimize to tray | Click window X button (doesn't close app) |
| Fully quit | Right-click tray icon → Quit |

---

**Made with ❤️ for easy printing**

