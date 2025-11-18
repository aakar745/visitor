# 🛠️ Building the Windows Installer

## 📋 Prerequisites

Before building, you need:
1. ✅ Node.js and npm (already installed)
2. ✅ All dependencies installed (`npm install`)
3. ⚠️ Icon files (see below)

---

## 🎨 Icon Files Needed

You need to create these icon files in the `gui/` folder:

### Required Icons:
1. **icon.ico** - Main application icon (256x256 or multi-size .ico)
2. **icon.png** - For the window (256x256 PNG)
3. **tray-icon.png** - For system tray (64x64 PNG)

### How to Create Icons:

#### Option 1: Use Online Tool (Easiest)
1. Go to https://www.icoconverter.com/
2. Upload a printer image (PNG/JPG)
3. Select "256x256" size
4. Download as `.ico`
5. Rename to `icon.ico` and place in `gui/` folder

#### Option 2: Use Existing Image
If you have a printer logo/image:
```powershell
# Save your image as:
# - gui/icon.png (256x256)
# - gui/tray-icon.png (64x64)
# - gui/icon.ico (for installer)
```

### Quick Icon Setup (Temporary)
For testing, you can use Windows default printer icon:
```powershell
# Copy Windows printer icon (temporary solution)
copy C:\Windows\System32\printui.exe gui\icon.ico
```

---

## 🏗️ Build Commands

### Development Mode (Test GUI)
```powershell
npm run gui
```
- Opens the GUI window
- No installer created
- For testing only

### Production Build (Create Installer)
```powershell
npm run build-win
```

**What this does:**
1. Packages the entire application
2. Bundles Node.js runtime (users don't need Node.js!)
3. Creates installer: `dist/Print-Service-Manager-Setup-1.0.0.exe`
4. Takes 5-10 minutes (large file ~100-150MB)

### Quick Distribution Build
```powershell
npm run dist
```
- Same as `build-win`
- Creates installer in `dist/` folder

---

## 📦 Installer Features

The generated installer includes:

### Installation Options:
✅ Choose installation directory
✅ Create desktop shortcut
✅ Create start menu shortcut
✅ Auto-start with Windows (optional)
✅ Professional uninstaller

### What Gets Installed:
- Electron application (GUI)
- Node.js runtime (bundled)
- Print worker script
- HTTP server script
- All dependencies
- Labels folder
- Configuration files

### File Size:
- Installer: ~120-150 MB (includes everything)
- Installed: ~250-300 MB

---

## 🎯 Distribution to Kiosks

### For Non-Technical Users:

1. **Build the installer** (one time):
   ```powershell
   npm run build-win
   ```

2. **Find the installer**:
   ```
   print-service/dist/Print-Service-Manager-Setup-1.0.0.exe
   ```

3. **Copy to USB drive** or network share

4. **Send to kiosk operators** with instructions:
   - "Double-click the installer"
   - "Click Next, Next, Install"
   - "Done!"

### What They Get:
- Desktop shortcut: "Print Service Manager"
- System tray icon (auto-starts)
- Simple GUI with Start/Stop buttons
- No technical knowledge required!

---

## 🔧 Build Configuration

The build settings are in `package.json`:

```json
"build": {
  "appId": "com.visitor.print-service",
  "productName": "Print Service Manager",
  "win": {
    "target": "nsis",
    "icon": "gui/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "runAfterFinish": true
  }
}
```

---

## 🐛 Troubleshooting Build Issues

### "Cannot find icon.ico"
**Solution**: Create icon files (see "Icon Files Needed" above)

### Build takes very long
**Normal**: First build takes 10-15 minutes (downloads Electron binaries)

### "electron-builder not found"
**Solution**:
```powershell
npm install --save-dev electron-builder
```

### Build fails with "Cannot find module"
**Solution**:
```powershell
# Clean install
rm -rf node_modules
npm install
npm run build-win
```

### Installer is very large (200MB+)
**Normal**: Includes Node.js + Electron + all dependencies
- Users don't need to install anything else
- Worth the size for simplicity!

---

## 📋 Pre-Build Checklist

Before building the installer:

- [ ] All code tested and working
- [ ] Icon files created (icon.ico, icon.png, tray-icon.png)
- [ ] LICENSE.txt exists
- [ ] package.json version updated (if needed)
- [ ] Redis instructions ready for users
- [ ] Brother printer drivers available for users
- [ ] Test build on clean Windows VM (optional but recommended)

---

## 🚀 Quick Build Steps (Summary)

```powershell
# 1. Navigate to print-service
cd E:\Project\visitor\print-service

# 2. Ensure icons exist (or create temporary ones)
# (Create gui/icon.ico, gui/icon.png, gui/tray-icon.png)

# 3. Build the installer
npm run build-win

# 4. Wait 5-10 minutes ☕

# 5. Find installer
explorer dist

# 6. Test installer on another PC

# 7. Distribute to kiosks! 🎉
```

---

## 📝 Version Updates

To release new version:

1. Update version in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Rebuild:
   ```powershell
   npm run build-win
   ```

3. New installer will be:
   ```
   dist/Print-Service-Manager-Setup-1.0.1.exe
   ```

---

## ✅ Success!

Once built, you have:
- ✅ Professional Windows installer
- ✅ No Node.js required for users
- ✅ Simple GUI for non-technical users
- ✅ System tray for background operation
- ✅ One-click service management

**Your print service is now enterprise-ready for deployment!** 🎉

