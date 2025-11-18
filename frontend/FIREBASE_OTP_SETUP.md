# 🔥 Firebase SMS OTP - Complete Setup Guide

## ✅ Implementation Status: COMPLETE!

Your visitor registration system now has **real Firebase SMS OTP** with international phone support!

---

## 📱 **What's Been Implemented**

### 1. **Firebase Configuration** (`src/lib/firebase/config.ts`)
- ✅ Firebase initialization with your credentials
- ✅ Client-side only (Next.js compatible)
- ✅ Singleton pattern (prevents multiple instances)
- ✅ Environment variables support

### 2. **Phone Authentication Service** (`src/lib/firebase/phoneAuth.ts`)
- ✅ `sendOTP()` - Send OTP via Firebase
- ✅ `verifyOTP()` - Verify OTP code
- ✅ `initializeRecaptcha()` - Invisible reCAPTCHA
- ✅ Automatic error handling with user-friendly messages
- ✅ Auto sign-out after verification (phone verification only)

### 3. **International Phone Input** (`src/components/forms/PhoneInput.tsx`)
- ✅ Country flag selector
- ✅ Automatic country code detection
- ✅ Real-time validation
- ✅ Beautiful UI with error states
- ✅ Supports **all international numbers**

### 4. **OTP Verification Modal** (`src/components/forms/OTPModal.tsx`)
- ✅ 6-digit OTP input with auto-focus
- ✅ Paste support (automatic 6-digit detection)
- ✅ Auto-verify when all digits entered
- ✅ Resend OTP with countdown timer (60s)
- ✅ Beautiful animations and loading states
- ✅ **"Aakar Exhibition" branding** throughout

### 5. **Updated OTP Login** (`src/components/forms/OTPLogin.tsx`)
- ✅ Integrated Firebase OTP
- ✅ International phone input
- ✅ Professional OTP modal
- ✅ Seamless visitor lookup integration
- ✅ Existing visitor detection

---

## 🎯 **Features**

### **International Support**
- ✅ Works worldwide with any country code
- ✅ Auto-detects user's country
- ✅ Validates phone numbers correctly

### **User Experience**
- ✅ Clean, modern UI
- ✅ Auto-focus and auto-advance between OTP digits
- ✅ Paste OTP support
- ✅ Real-time validation
- ✅ Helpful error messages
- ✅ Loading states and animations

### **Security**
- ✅ Invisible reCAPTCHA (better UX)
- ✅ Rate limiting (Firebase built-in)
- ✅ Secure Firebase authentication
- ✅ Auto logout after verification

### **Branding**
- ✅ **"Aakar Exhibition"** in messages
- ✅ 🎪 Company logo emoji
- ✅ Professional branding throughout

---

## 📊 **SMS Quota & Pricing**

### **Free Spark Plan (Current)**
- **10 SMS per day** per project
- ✅ Perfect for testing and development
- ✅ Good for low-traffic events

### **Blaze Plan (Production - Pay as you go)**
To handle more registrations, upgrade to Blaze:

1. Go to: https://console.firebase.google.com/
2. Click **Project Settings** → **Usage and billing**
3. Click **"Modify plan"** → Select **"Blaze"**
4. Add billing information

**Pricing:**
- India: ~₹0.50-1.00 per SMS
- International: ~₹1-3 per SMS
- No monthly fees, pay only for what you use

---

## 🚀 **How to Test**

### **Step 1: Start Your Frontend**
```bash
cd frontend
npm run dev
```

### **Step 2: Visit Exhibition Page**
Navigate to any exhibition:
```
http://localhost:3001/[exhibition-slug]
```

### **Step 3: Enter Phone Number**
1. Select your country from the flag dropdown
2. Enter your phone number
3. Click **"Send OTP via SMS"**

### **Step 4: Receive & Enter OTP**
1. Check your phone for SMS (may take 5-30 seconds)
2. SMS sender will appear as **"VERIFY"** or a phone number
3. Enter the 6-digit code in the modal
4. Or paste the entire code

### **Step 5: Verify & Continue**
- OTP auto-verifies when all 6 digits entered
- On success, redirects to registration form

---

## 📱 **SMS Message Format**

Users will receive SMS like this:

```
Sender: VERIFY (or phone number)
Message: Your verification code is 123456
```

⚠️ **Note:** Firebase doesn't support custom sender IDs like "Aakar Exhibition". 
The sender will always be "VERIFY" or a phone number. However, we've added 
**"Aakar Exhibition"** branding in the UI, alerts, and notifications.

---

## 🧪 **Testing with Test Phone Numbers**

For development without using SMS quota:

1. Go to Firebase Console
2. **Authentication** → **Sign-in method** → Scroll down
3. **"Phone numbers for testing"** → **Add phone number**
4. Example:
   - Phone: `+91 9999999999`
   - Code: `123456`

Now you can test without sending real SMS!

---

## 🔒 **Security Best Practices**

### **Environment Variables (Production)**
For production, create `frontend/.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### **Firebase Security Rules**
Your current setup is secure because:
- ✅ reCAPTCHA prevents bot abuse
- ✅ Firebase rate limiting (10 SMS/day on Spark plan)
- ✅ Phone verification only (no persistent auth)
- ✅ Auto sign-out after verification

---

## 🌍 **Supported Countries**

Firebase SMS OTP works in **230+ countries**, including:

✅ **India** - Primary target
✅ USA, Canada
✅ UK, Europe
✅ Middle East
✅ Asia Pacific
✅ Latin America
✅ And many more!

**Auto-detects:**
- User's country based on browser/IP
- Defaults to India for your use case

---

## 🛠️ **Troubleshooting**

### **Issue: SMS Not Received**
- **Wait**: SMS can take 5-30 seconds
- **Check spam**: Some carriers filter OTP SMS
- **Check test numbers**: Use test phone numbers for development
- **Check quota**: Free plan has 10 SMS/day limit
- **Check Firebase Console**: View SMS logs in Authentication → Usage

### **Issue: "Too many requests"**
- **Wait 1 hour**: Rate limit resets
- **Use test numbers**: For development
- **Upgrade to Blaze**: For production

### **Issue: "Quota exceeded"**
- **Upgrade to Blaze plan**: Free plan has 10 SMS/day limit
- **Use test numbers**: For development

### **Issue: reCAPTCHA not working**
- **Check localhost**: Should work by default
- **Add domain**: For production, add your domain to Firebase Authorized Domains

---

## 📚 **Files Created**

```
frontend/
├── src/
│   ├── lib/
│   │   └── firebase/
│   │       ├── config.ts              ← Firebase configuration
│   │       └── phoneAuth.ts           ← OTP send/verify functions
│   └── components/
│       └── forms/
│           ├── PhoneInput.tsx         ← International phone input
│           ├── OTPModal.tsx           ← OTP verification modal
│           └── OTPLogin.tsx           ← Updated with Firebase OTP
└── FIREBASE_OTP_SETUP.md             ← This file
```

---

## 🎨 **Customization**

### **Change Company Name**
In `OTPLogin.tsx` (line 273):
```typescript
companyName="Aakar Exhibition"  // Change this
```

In `OTPModal.tsx` (line 13):
```typescript
companyName?: string = 'Aakar Exhibition'  // Change default here
```

### **Change Default Country**
In `PhoneInput.tsx` (line 50):
```typescript
defaultCountry="IN"  // Change to your country code
```

### **Adjust OTP Resend Timer**
In `OTPModal.tsx` (line 26):
```typescript
const [countdown, setCountdown] = useState(60);  // Change seconds
```

---

## ✅ **Next Steps**

1. **Test the implementation**
   - Try with your phone number
   - Try with test phone numbers

2. **Add authorized domains** (for production)
   - Go to Firebase Console
   - Project Settings → Authorized domains
   - Add your production domain

3. **Upgrade to Blaze plan** (when ready for production)
   - Needed for more than 10 SMS/day
   - Pay only for what you use

4. **Monitor usage**
   - Check Firebase Console → Authentication → Usage
   - View SMS logs and analytics

---

## 🎉 **You're All Set!**

Your visitor registration system now has:
- ✅ **Real SMS OTP** via Firebase
- ✅ **International phone support** (230+ countries)
- ✅ **Professional UI** with "Aakar Exhibition" branding
- ✅ **Secure** with reCAPTCHA and rate limiting
- ✅ **Production-ready** architecture

**Test it now and let visitors register with confidence!** 🚀

---

## 📞 **Support**

If you encounter any issues:
1. Check Firebase Console logs
2. Review this documentation
3. Check browser console for errors
4. Verify Firebase configuration

**Happy registering!** 🎪

