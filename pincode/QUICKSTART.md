# 🚀 Quick Start Guide

## For Daily Data Fetch

### 1️⃣ First Time Setup (One-time, 2 minutes)

```bash
cd pincode
npm install
```

---

### 2️⃣ Daily Data Fetch (Run this daily)

```bash
# Full command (recommended)
npm run fetch

# Or if you want to resume from where you left off
npm run fetch:resume
```

**This will:**
- Fetch new PIN codes from India Post API
- Save raw data to `data/raw/`
- Show progress bar in terminal
- Auto-save every 100 codes (safe to stop anytime)
- Take ~43 hours for full India data (can run overnight)

---

### 3️⃣ Process the Data (After fetch completes)

```bash
npm run process
```

**This will:**
- Clean and organize raw data
- Create `countries.json`, `states.json`, `cities.json`, `pincodes.json`
- Save to `data/processed/` folder
- Takes ~2 minutes

---

### 4️⃣ Get the Processed Data

**Files will be in:**
```
pincode/data/processed/
├── countries.json    (1 country - India)
├── states.json       (~36 states)
├── cities.json       (~4,000 cities)
└── pincodes.json     (~155,000 PIN codes)
```

**Copy these files to your main project for import!**

---

## ⚡ Quick Commands Cheat Sheet

```bash
# Install dependencies (first time only)
npm install

# Fetch all data (full India)
npm run fetch

# Resume if interrupted
npm run fetch:resume

# Fetch specific range only (faster testing)
npm run fetch -- --start=380001 --end=380050

# Process raw data
npm run process

# Do everything in one go
npm run full-sync
```

---

## 📊 What to Expect

### Fetch Progress (Terminal Output)
```
████████░░ | 45% | 70,000/155,000 
Speed: 60 req/min | ETA: 23h 45m 
Current: 380006

✅ Valid PIN codes:   68,500
⚠️  Invalid:          1,300
❌ Errors:            200
```

### After Processing
```
✅ Countries: 1
✅ States: 36
✅ Cities: 4,523
✅ PIN Codes: 155,234
```

---

## 🔥 Pro Tips

### 1. Run Overnight
```bash
# Start before bed
npm run fetch

# Check in the morning - it'll be done!
```

### 2. Test First
```bash
# Try a small range to see how it works
npm run fetch -- --start=380001 --end=380010
npm run process

# Check data/processed/ for results
```

### 3. Resume Anytime
If your internet drops or you close terminal:
```bash
npm run fetch:resume
# Picks up exactly where you left off!
```

---

## 🆘 Problems?

### "npm: command not found"
**Install Node.js first:**
- Download from: https://nodejs.org
- Install LTS version
- Restart terminal

### "Cannot find module"
```bash
npm install
```

### Data not appearing?
- Check `data/raw/` for raw files
- Run `npm run process` to convert them
- Processed files will be in `data/processed/`

---

## ✅ Checklist for Daily Run

- [ ] `cd pincode`
- [ ] `npm install` (first time only)
- [ ] `npm run fetch` or `npm run fetch:resume`
- [ ] Wait for completion (or run overnight)
- [ ] `npm run process`
- [ ] Copy files from `data/processed/` to your project
- [ ] Done! 🎉

---

**That's it! Now go fetch some data! 🚀**

