# 🔄 Interest ObjectId → Name Migration Guide

## 🐛 Problem

The "All Visitors" page was showing **MongoDB ObjectIds** instead of **interest names** in the Interests column:

```
❌ Before: 6911ad36a7bf9e3e54345673
✅ After:  Fashion, Technology, Design
```

## 🔧 Root Cause

The frontend `InterestsSection.tsx` was storing interest **IDs** (ObjectIds) instead of **names** in the `selectedInterests` array.

## ✅ What Was Fixed

### 1. **Frontend Fix** ✅
**File:** `frontend/src/components/forms/InterestsSection.tsx`

**Changed:**
```typescript
// ❌ Before: Storing ObjectIds
toggleInterest(option.id)
selectedInterests.includes(option.id)

// ✅ After: Storing Names
toggleInterest(option.name)
selectedInterests.includes(option.name)
```

**Impact:** All NEW registrations will now store interest names correctly.

---

### 2. **Backend Migration Script** ✅
**File:** `backend/scripts/migrate-interest-ids-to-names.js`

**Purpose:** Convert existing registrations from ObjectIds → Names

---

## 🚀 How to Migrate Existing Data

### **Step 1: Navigate to Backend**
```bash
cd backend
```

### **Step 2: Run Migration Script**
```bash
node scripts/migrate-interest-ids-to-names.js
```

### **Expected Output:**
```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 15 registrations with interests

✅ Migrated registration 6911ad36a7bf9e3e54345670
   Before: [6911ad36a7bf9e3e54345673, 6911ad36a7bf9e3e54345674]
   After:  [Fashion, Technology, Design]

✅ Migrated registration 6911ad36a7bf9e3e54345671
   Before: [6911ad36a7bf9e3e54345675]
   After:  [Sports]

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Successfully migrated: 15
✓  Already valid (skipped): 0
❌ Failed: 0
📝 Total processed: 15
============================================================

👋 Disconnected from MongoDB
```

---

## 🧪 Verification Steps

### **1. Check Admin Panel**
1. Go to: **Admin Panel → All Visitors**
2. Check the **Interests** column
3. Should show: 🟣 Fashion 🟣 Technology (not ObjectIds)

### **2. Check Database (Optional)**
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Check a sample registration
db.exhibition_registrations.findOne({ selectedInterests: { $ne: [] } })

# Should show:
# selectedInterests: ["Fashion", "Technology", "Design"]
# NOT: ["6911ad36a7bf9e3e54345673", ...]
```

### **3. Test New Registration**
1. Go to frontend registration page
2. Select some interests (e.g., Fashion, Technology)
3. Submit registration
4. Check admin panel → Should show interest names correctly

---

## ⚠️ Important Notes

1. **Safe to Run Multiple Times**: The script checks if interests are already names and skips them
2. **No Data Loss**: Original data is only updated if valid interest names are found
3. **Automatic Backup**: Consider backing up your database before running (optional)
4. **Environment Variables**: Ensure `.env` file has correct `MONGODB_URI`

---

## 🔄 Future Registrations

All new registrations will automatically store interest **names** instead of ObjectIds. No further migration needed!

---

## 🆘 Troubleshooting

### **Error: Cannot connect to MongoDB**
```bash
# Check your .env file
cat .env | grep MONGODB_URI

# Test connection
mongosh "your-connection-string"
```

### **Error: No exhibitions found**
- Ensure exhibitions have `interestOptions` configured
- Check exhibition schema has `interestOptions` array

### **Migration shows "0 migrated"**
- Good news! Your data is already correct
- Or no registrations have interests selected

---

## 📊 What Changed in Database Schema?

**Before Migration:**
```json
{
  "_id": "6911ad36a7bf9e3e54345670",
  "selectedInterests": [
    "6911ad36a7bf9e3e54345673",  // ❌ ObjectId
    "6911ad36a7bf9e3e54345674"   // ❌ ObjectId
  ]
}
```

**After Migration:**
```json
{
  "_id": "6911ad36a7bf9e3e54345670",
  "selectedInterests": [
    "Fashion",      // ✅ Name
    "Technology",   // ✅ Name
    "Design"        // ✅ Name
  ]
}
```

---

## ✅ Summary

✅ Frontend fixed to store names instead of ObjectIds  
✅ Migration script created to fix existing data  
✅ All Visitors page will now show readable interest names  
✅ CSV exports will show interest names correctly  
✅ Future registrations will work automatically  

**Status:** Ready to deploy! 🚀

