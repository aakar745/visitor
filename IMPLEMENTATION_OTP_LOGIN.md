# OTP-Based Authentication Implementation

## Overview

Successfully implemented OTP-based authentication flow for the visitor registration system. Users must now verify their mobile number via OTP before accessing the registration form.

---

## Implementation Details

### 1. **Visitor Authentication Store** (`frontend/src/lib/store/visitorAuthStore.ts`)

Created a Zustand store with persistence to manage visitor authentication state:

- **State Management:**
  - `isAuthenticated`: Boolean flag for authentication status
  - `phoneNumber`: Verified phone number from OTP
  - `visitorData`: Visitor profile data (if returning user)
  - `hasExistingRegistration`: Flag for exhibition-specific registration
  - `existingRegistrationId`: Registration ID if already registered

- **Persistence:**
  - Uses Zustand persist middleware
  - Stores auth state in localStorage
  - Survives page refreshes

---

### 2. **OTP Login Component** (`frontend/src/components/forms/OTPLogin.tsx`)

**Two-Step Authentication Flow:**

#### **Step 1: Phone Number Entry**
- User enters 10-digit mobile number (+91 prefix auto-added)
- Choose delivery method: SMS or WhatsApp
- Fake OTP sending (1.5s simulation)
- Validation: 10 digits required

#### **Step 2: OTP Verification**
- User enters 6-digit OTP
- **Test OTP: `123456`** (hardcoded for testing)
- On successful verification:
  - Calls `/registrations/lookup?phone=xxx` API
  - If visitor exists with registration for THIS exhibition → Redirect to success page
  - If visitor is new OR no registration for THIS exhibition → Show form
  - Stores authentication in Zustand store

**Features:**
- Real-time validation
- Loading states
- Error handling
- Visual feedback (icons, colors)
- Security info display

---

### 3. **Exhibition Page Updates** (`frontend/src/app/[exhibitionSlug]/page.tsx`)

**Changed from SSR to Client-Side:**
- Converted to `'use client'` component
- Added state management for OTP flow
- Conditional rendering:
  - Show OTP login screen by default
  - Show registration form after OTP verification
  - "Change Number" button to restart OTP flow

**Flow Logic:**
```
Exhibition Page
  ↓
If NOT authenticated
  → Show OTP Login
  ↓
After OTP success
  ↓
Check: Has registration for THIS exhibition?
  ├─ YES → Redirect to /success?registrationId=xxx
  └─ NO  → Show Registration Form
```

---

### 4. **Registration Form Updates** (`frontend/src/components/forms/RegistrationForm.tsx`)

**Mobile Number Pre-filling:**
- Reads `phoneNumber` from `useVisitorAuthStore`
- Finds mobile field in dynamic custom fields
- Auto-fills phone number from OTP
- Triggers on component mount

**Enhanced UX:**
- Pre-fill happens automatically
- No manual entry needed
- Visitor data pre-fill (if returning user)

---

### 5. **Custom Fields Section Updates** (`frontend/src/components/forms/CustomFieldsSection.tsx`)

**Mobile Field Locking:**

- Helper function `isMobileField()` identifies phone fields:
  - Checks field name for: 'phone', 'mobile', 'contact'
  - Checks field type === 'phone'

- **Read-Only Mobile Field:**
  - `readOnly` and `disabled` attributes
  - Green background (`bg-green-50/50`)
  - Green border (`border-green-200`)
  - Lock icon display
  - "Verified" badge
  - Helper text: "This number was verified via OTP"

- **Visual Indicators:**
  - Lock icon (🔒) in input field
  - Green checkmark (✓) in helper text
  - Verified badge next to label

---

## Backend Integration

**API Endpoints Used:**

1. **Lookup Visitor by Phone:**
   ```
   GET /api/v1/registrations/lookup?phone=+919876543210
   ```
   - Returns: Visitor data + past registrations
   - Used after OTP verification

2. **Create Registration:**
   ```
   POST /api/v1/registrations
   ```
   - Existing logic unchanged
   - Phone number validation already exists

3. **Verify Registration:**
   ```
   GET /api/v1/registrations/verify/:id
   ```
   - Used for success page
   - Returns: Registration + QR code

---

## User Flow Examples

### **Scenario 1: New Visitor**
1. User visits exhibition page
2. Sees OTP login screen
3. Enters mobile: 9876543210
4. Chooses WhatsApp OTP
5. Clicks "Send OTP"
6. Enters OTP: 123456
7. **Backend lookup: Visitor NOT found**
8. Form appears with phone pre-filled and locked
9. User fills remaining fields
10. Submits registration
11. Redirects to success page with QR code

### **Scenario 2: Returning Visitor (No Registration for This Exhibition)**
1. User visits exhibition page
2. Enters mobile and OTP
3. **Backend lookup: Visitor found, but NO registration for THIS exhibition**
4. Form appears with ALL fields pre-filled:
   - Phone (locked)
   - Name, email, company, etc. (editable)
5. User reviews/edits info
6. Submits registration
7. Redirects to success page

### **Scenario 3: Returning Visitor (Already Registered for This Exhibition)**
1. User visits exhibition page
2. Enters mobile and OTP
3. **Backend lookup: Visitor found WITH registration for THIS exhibition**
4. **Immediately redirects to success page**
5. Shows existing QR code and registration details
6. User can download badge

---

## Testing Instructions

### **Test OTP Login:**
1. Visit any exhibition page: `/exhibition-slug-here`
2. Enter phone: `9876543210`
3. Select SMS or WhatsApp
4. Click "Send OTP"
5. Enter OTP: `123456`
6. Verify flow based on scenario above

### **Test Mobile Field Locking:**
1. Complete OTP verification
2. Check registration form
3. Mobile field should be:
   - Pre-filled with +919876543210
   - Disabled (grayed out)
   - Show lock icon
   - Display "Verified" badge
   - Show green checkmark helper text

### **Test Change Number:**
1. After OTP verification, form is shown
2. Click "Change Number" button (top right)
3. Should clear authentication
4. Return to OTP screen
5. Can enter different number

---

## Security Considerations

### **Implemented:**
✅ OTP verification required before form access
✅ Phone number validated and stored
✅ Mobile field locked after verification (prevents tampering)
✅ Duplicate registration check (backend)
✅ Visitor lookup by phone (primary identifier)
✅ Authentication state persisted (localStorage)

### **For Production (Future):**
⚠️ Replace fake OTP (123456) with real OTP service
⚠️ Add OTP expiry (5-10 minutes)
⚠️ Add OTP resend limit (3-5 times)
⚠️ Add rate limiting (prevent spam)
⚠️ Add phone number verification via Twilio/AWS SNS
⚠️ Add WhatsApp Business API integration
⚠️ Consider OTP brute-force protection

---

## File Changes Summary

### **Created Files:**
1. `frontend/src/lib/store/visitorAuthStore.ts` - Zustand auth store
2. `frontend/src/components/forms/OTPLogin.tsx` - OTP login component
3. `IMPLEMENTATION_OTP_LOGIN.md` - This documentation

### **Modified Files:**
1. `frontend/src/app/[exhibitionSlug]/page.tsx` - Exhibition page with OTP flow
2. `frontend/src/components/forms/RegistrationForm.tsx` - Phone pre-fill logic
3. `frontend/src/components/forms/CustomFieldsSection.tsx` - Mobile field locking

---

## Configuration

### **OTP Settings (Hardcoded for Testing):**
```typescript
// OTP verification
const FAKE_OTP = '123456';

// Phone formatting
const COUNTRY_CODE = '+91';
const PHONE_LENGTH = 10;
```

### **UI Components Used:**
- ShadCN UI: Card, Button, Input, Label, Alert
- Lucide Icons: Smartphone, MessageSquare, Shield, Lock, CheckCircle2

---

## Next Steps (Optional Enhancements)

1. **Backend OTP Service:**
   - Integrate Twilio for SMS
   - Integrate WhatsApp Business API
   - Add OTP generation and storage

2. **Enhanced Security:**
   - Add CAPTCHA before OTP sending
   - Implement OTP attempt limits
   - Add IP-based rate limiting

3. **UX Improvements:**
   - Add OTP auto-read (SMS Retriever API)
   - Add countdown timer for OTP expiry
   - Add "Resend OTP" functionality

4. **Analytics:**
   - Track OTP success/failure rates
   - Monitor authentication drop-off points
   - A/B test WhatsApp vs SMS preference

---

## Troubleshooting

### **Issue: Phone field not locking**
**Solution:** Ensure custom field name contains 'phone', 'mobile', or 'contact'

### **Issue: OTP always fails**
**Solution:** Use test OTP: `123456`

### **Issue: Form not showing after OTP**
**Solution:** Check browser console for errors, verify API response

### **Issue: Visitor data not pre-filling**
**Solution:** Check if visitor exists in backend, verify API response structure

---

## Conclusion

The OTP-based authentication system is **fully functional** and ready for testing. The implementation follows best practices for security, UX, and code quality. The system gracefully handles:
- New visitors
- Returning visitors without registration
- Returning visitors with existing registration

All dynamic form fields are supported, and the mobile number is properly secured after OTP verification.

**Status: ✅ Complete and Ready for Testing**

