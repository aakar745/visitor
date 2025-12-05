# 🚀 WhatsApp Registration - Quick Start

## 📁 Files Created

1. **`backend/test-whatsapp-registration.js`** - Test file for WhatsApp template
2. **`backend/WHATSAPP-REGISTRATION-SETUP.md`** - Complete setup guide

---

## ⚡ Quick Test (3 Minutes)

### Step 1: Update Test Configuration

Open `backend/test-whatsapp-registration.js` and change these lines:

```javascript
// Line 25-26: Your WhatsApp number
phoneNumber: '+919876543210', // ⚠️ CHANGE THIS
countryCode: '+91',
phone: '9876543210',

// Line 38: Your badge image URL (must be HTTPS)
badgeImageUrl: 'https://your-domain.com/uploads/badges/sample-badge.png', // ⚠️ CHANGE THIS

// Line 41: Test visitor name
visitorName: 'Aakar Test User', // Optional: Change to your name
```

### Step 2: Run Test

```bash
cd backend
node test-whatsapp-registration.js
```

### Step 3: Check WhatsApp

You should receive a message with:
- ✅ Badge image at the top
- ✅ Welcome message with your name
- ✅ Instructions
- ✅ Footer

---

## ⚠️ Important Requirements

### 1. Template Must Be Approved

Your WhatsApp template `exhibition_registration_confirmation` must be:
- ✅ Submitted to Meta/Interakt
- ✅ **APPROVED** (not pending or rejected)
- ✅ Language: English
- ✅ Category: Utility

### 2. Badge Image URL Requirements

```
✅ HTTPS (not HTTP)
✅ Publicly accessible (no login required)
✅ Under 5 MB
✅ Format: PNG or JPG

Example:
✅ https://your-domain.com/uploads/badges/badge-123.png
❌ http://localhost:3000/badge.png (not HTTPS)
❌ http://your-domain.com/badge.png (not HTTPS)
```

### 3. Environment Variables

Check `backend/.env`:

```bash
INTERAKT_API_KEY=your_key_here  # ⚠️ MUST BE SET
INTERAKT_API_URL=https://api.interakt.ai/v1/public/message/
```

---

## 🔍 Understanding the API Call

### Existing OTP vs New Template

| Feature | OTP Template | Registration Template |
|---------|--------------|----------------------|
| Template Name | `otp` | `exhibition_registration_confirmation` |
| Header | None | Image (badge) |
| Body Variables | `{{1}}` = OTP code | `{{1}}` = Visitor name |
| Button | Copy Code | None |
| Footer | Static text | Static text |

### API Payload Structure

```javascript
{
  "countryCode": "+91",
  "phoneNumber": "9876543210",
  "type": "Template",
  "template": {
    "name": "exhibition_registration_confirmation",
    "languageCode": "en",
    
    // NEW: Header with image
    "headerValues": [
      "https://your-domain.com/badge.png"  // {{1}} in header
    ],
    
    // Body variables
    "bodyValues": [
      "Aakar Test User"  // {{1}} in body
    ],
    
    // No buttons
    "buttonValues": {}
  }
}
```

**Key Difference:** `headerValues` array contains the badge image URL!

---

## 📊 Expected Test Output

### ✅ Success:

```
🚀 Starting WhatsApp Registration Confirmation Test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Step 1: Validating Configuration...
✅ Configuration valid

📦 Step 2: Preparing Interakt API Payload...
📄 Payload: { ... }

📡 Step 3: Sending Request to Interakt API...
   Endpoint: https://api.interakt.ai/v1/public/message/
   To: +919876543210
   Template: exhibition_registration_confirmation (en)

✅ Response received in 1234ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📨 RESPONSE:
{
  "result": true,
  "id": "msg_abc123xyz",
  "status": "sent"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 SUCCESS! WhatsApp message sent successfully!

   ✅ Message ID: msg_abc123xyz
   ✅ Status: sent
   📱 Check WhatsApp on: +919876543210

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ALL TESTS COMPLETED SUCCESSFULLY!
```

### ❌ Common Errors:

#### Error 1: API Key Invalid
```
❌ ERROR: 401 Unauthorized
💡 Possible Causes:
   • Invalid INTERAKT_API_KEY
   • API key not authorized for this account
```
**Fix:** Check `INTERAKT_API_KEY` in `.env`

#### Error 2: Template Not Found
```
❌ ERROR: 400 Bad Request
Message: "Template not found"
💡 Possible Causes:
   • Template name does not exist
   • Check template name in Interakt dashboard
```
**Fix:** Verify template is approved and name matches exactly

#### Error 3: Image Not Accessible
```
❌ ERROR: 400 Bad Request
Message: "Media download failed"
💡 Possible Causes:
   • Badge image URL not accessible
```
**Fix:** Ensure badge URL is HTTPS and publicly accessible

---

## 🎯 After Successful Test

Once the test works:

1. **Review the output** - Confirm WhatsApp message looks correct
2. **Check the guide** - Read `WHATSAPP-REGISTRATION-SETUP.md` for integration steps
3. **Inform team** - Ready to integrate into main registration flow
4. **Integration** - Create `WhatsAppRegistrationService` (see setup guide)

---

## 📞 Need Help?

### Quick Checks:

```bash
# 1. Check if .env has API key
grep INTERAKT_API_KEY backend/.env

# 2. Test API key directly
curl -X POST https://api.interakt.ai/v1/public/message/ \
  -H "Authorization: Basic YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. Check badge URL accessibility
curl -I https://your-domain.com/badge.png
# Should return: HTTP/2 200
```

### Common Solutions:

| Problem | Solution |
|---------|----------|
| "INTERAKT_API_KEY not found" | Add key to `backend/.env` |
| "Template not found" | Approve template in Interakt dashboard |
| "Media download failed" | Use HTTPS URL, ensure public access |
| "Invalid phone number" | Use E.164 format: `+919876543210` |

---

## 🔥 Pro Tips

1. **Test with your own number first** - Easy to verify
2. **Use a real badge image** - See actual user experience
3. **Check spam folder** - Sometimes first message goes there
4. **Save successful response** - Keep Message ID for tracking
5. **Test error scenarios** - Try invalid URLs to see error handling

---

## ✅ Ready for Production?

Before integrating into main system:

- [ ] Test successful with your number
- [ ] Badge image displays correctly
- [ ] Message formatting looks good
- [ ] Template approved in Interakt
- [ ] API key configured in production `.env`
- [ ] Badge URLs will be HTTPS in production
- [ ] Read complete setup guide

---

**🎉 Good luck with testing! The test file has detailed error messages to help you debug.**

