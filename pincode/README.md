# 📮 India PIN Code Data Fetcher

Standalone system to fetch, process, and manage India postal PIN code data from the India Post API.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd pincode
npm install
```

### 2. Fetch Data (Daily Run)
```bash
npm run fetch
```

This will:
- Fetch PIN codes from India Post API
- Save raw data to `data/raw/`
- Show real-time progress
- Auto-save progress every 100 codes
- Can be resumed if interrupted

### 3. Process Data
```bash
npm run process
```

This will:
- Load all raw data files
- Extract unique countries, states, cities
- Normalize names and generate codes
- Save to `data/processed/`

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run fetch` | Fetch all PIN codes (fresh start) |
| `npm run fetch:resume` | Resume from last saved progress |
| `npm run fetch -- --start=110001 --end=120000` | Fetch specific range |
| `npm run process` | Process raw data into structured format |
| `npm run full-sync` | Run fetch + process in sequence |

---

## 📂 Directory Structure

```
pincode/
├── config.js                  # Configuration settings
├── fetch-postal-data.js       # Main fetcher script
├── process-data.js            # Data processor
├── package.json               # Dependencies
├── README.md                  # This file
├── data/
│   ├── raw/                   # Raw API responses
│   │   ├── raw-1234567890.json
│   │   └── raw-1234567891.json
│   ├── processed/             # Processed data (ready to import)
│   │   ├── countries.json
│   │   ├── states.json
│   │   ├── cities.json
│   │   └── pincodes.json
│   └── progress.json          # Fetch progress (for resume)
└── logs/
    └── errors-2025-11-17.log  # Error logs
```

---

## ⚙️ Configuration

Edit `config.js` to customize:

```javascript
{
  api: {
    rateLimitPerMinute: 60,     // API rate limit
    maxRetries: 3,              // Retry failed requests
    retryDelayMs: 1000,         // Delay between retries
  },
  pincode: {
    start: 110001,              // Start PIN code
    end: 855116,                // End PIN code
  },
  batch: {
    size: 1000,                 // Batch size for saving
    saveProgressEvery: 100,     // Save progress frequency
  }
}
```

---

## 📊 Output Format

### Countries (`data/processed/countries.json`)
```json
[
  {
    "name": "India",
    "code": "IN",
    "isActive": true
  }
]
```

### States (`data/processed/states.json`)
```json
[
  {
    "name": "Gujarat",
    "code": "GJ",
    "country": "India",
    "isActive": true
  }
]
```

### Cities (`data/processed/cities.json`)
```json
[
  {
    "name": "Ahmedabad",
    "state": "Gujarat",
    "isActive": true
  }
]
```

### PIN Codes (`data/processed/pincodes.json`)
```json
[
  {
    "pincode": "380006",
    "area": "Ellis Bridge",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "country": "India",
    "branchType": "Sub Post Office",
    "deliveryStatus": "Delivery",
    "isActive": true
  }
]
```

---

## ⏱️ Performance

### Fetch Time Estimates

| Range | PIN Codes | Time (60 req/min) |
|-------|-----------|-------------------|
| Full India | ~155,000 | ~43 hours |
| Single State (Gujarat) | ~8,000 | ~2.2 hours |
| Single City (Ahmedabad) | ~50 | ~1 minute |

### Optimization Tips

1. **Resume feature**: If interrupted, use `npm run fetch:resume`
2. **Specific range**: Fetch only needed ranges
3. **Run overnight**: Full fetch takes ~2 days
4. **Monitor logs**: Check `logs/` for errors

---

## 🔄 Daily Sync Workflow

### Recommended Schedule

**Option 1: Full Sync (Monthly)**
```bash
# First day of month
npm run fetch          # Fetch new data
npm run process        # Process data
# Import to main database
```

**Option 2: Incremental Sync (Daily)**
```bash
# Check only new PIN codes (last 1000)
npm run fetch -- --start=855000 --end=855116
npm run process
```

---

## 🛠️ Troubleshooting

### API Rate Limit Errors
- **Problem**: Too many requests
- **Solution**: Script auto-handles this with 60 req/min limit

### Script Crashes
- **Problem**: Network issues, server errors
- **Solution**: Run `npm run fetch:resume` to continue

### Invalid PIN Codes
- **Problem**: Some PIN codes return no data
- **Solution**: Normal behavior, logged in `logs/errors-*.log`

### Memory Issues
- **Problem**: Processing too much data
- **Solution**: Data is saved in batches automatically

---

## 📈 Statistics & Monitoring

### Real-time Progress Display
```
████████░░ | 45% | 70,000/155,000 | Speed: 60 req/min | ETA: 23h 45m | Current: 380006
```

### Summary Report
```
📊 Fetch Summary
✅ Total fetched:     70,000
✅ Valid PIN codes:   68,500
⚠️  Invalid PIN codes: 1,300
❌ Errors:            200
⏱️  Time elapsed:     19h 30m
⚡ Average speed:     60 req/min
```

---

## 🔗 Import to Main Database

### Manual Import

Copy processed files to your backend:
```bash
cp data/processed/*.json ../backend/data/
```

Then run your backend import script.

### Automated Import

Configure MongoDB URI in `config.js` and create import script.

---

## 📝 Notes

- **API Source**: https://api.postalpincode.in
- **Free API**: No authentication required
- **Rate Limit**: 60 requests/minute (respected automatically)
- **Data Accuracy**: Depends on India Post updates
- **Coverage**: ~155,000 PIN codes across India

---

## 🆘 Support

### Common Issues

1. **"Cannot find module"**
   - Run: `npm install`

2. **"ECONNREFUSED"**
   - Check internet connection
   - API might be down (try later)

3. **"Progress not saving"**
   - Check disk space
   - Verify `data/` directory is writable

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run fetch
```

---

## 📅 Maintenance

### Weekly Tasks
- ✅ Check `logs/` for errors
- ✅ Monitor progress file
- ✅ Verify disk space

### Monthly Tasks
- ✅ Run full sync
- ✅ Backup processed data
- ✅ Clean old raw data files

---

## ✨ Features

- ✅ Real-time progress tracking
- ✅ Auto-resume on interruption
- ✅ Rate limit handling
- ✅ Retry logic for failures
- ✅ Batch processing
- ✅ Memory efficient
- ✅ Error logging
- ✅ Beautiful CLI output
- ✅ Configurable ranges
- ✅ Data normalization

---

**Happy Fetching! 🚀**

