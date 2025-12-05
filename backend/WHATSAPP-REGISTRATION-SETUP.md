# 📱 WhatsApp Registration Confirmation Setup Guide

## Overview

This guide explains how to test and integrate the **WhatsApp Registration Confirmation** message that sends visitor badges after exhibition registration.

---

## 📋 Prerequisites

### 1. Approved WhatsApp Template

Your template `exhibition_registration_confirmation` must be approved in Meta/Interakt with:

| Component | Content |
|-----------|---------|
| **Template Name** | `exhibition_registration_confirmation` |
| **Language** | English (en) |
| **Category** | Utility |
| **Header** | Image - Variable: `{{1}}` |
| **Body** | Text with Variable: `{{1}}` (visitor name) |
| **Footer** | `Powered by Aakar Visitors` |
| **Status** | ✅ **APPROVED** |

### 2. Badge Image Requirements

The badge image URL must meet these requirements:

✅ **HTTPS** - WhatsApp requires secure URLs  
✅ **Publicly Accessible** - No authentication required  
✅ **Image Format** - JPG, PNG (recommended: PNG for transparency)  
✅ **File Size** - Under 5 MB  
✅ **Dimensions** - Recommended: 1024x1024px or 800x1200px

#### Example Valid URLs:
```
✅ https://your-domain.com/uploads/badges/badge-123.png
✅ https://cdn.your-domain.com/badges/visitor-badge.jpg
✅ https://storage.googleapis.com/bucket/badges/image.png

❌ http://your-domain.com/badge.png (Not HTTPS)
❌ https://localhost:3000/badge.png (Not publicly accessible)
❌ https://your-domain.com/private/badge.png (Requires auth)
```

### 3. Environment Configuration

Ensure `.env` has these variables:

```bash
INTERAKT_API_KEY=your_api_key_here
INTERAKT_API_URL=https://api.interakt.ai/v1/public/message/
```

---

## 🧪 Testing Phase

### Step 1: Configure Test File

Open `backend/test-whatsapp-registration.js` and update:

```javascript
const TEST_CONFIG = {
  // YOUR WhatsApp number for testing
  phoneNumber: '+919876543210', // ⚠️ UPDATE THIS
  countryCode: '+91',
  phone: '9876543210',
  
  // Template name (must match approved template)
  templateName: 'exhibition_registration_confirmation',
  
  // Test data
  visitorName: 'Aakar Test User',
  badgeImageUrl: 'https://your-domain.com/uploads/badges/sample-badge.png', // ⚠️ UPDATE THIS
  
  // Exhibition details
  exhibitionName: 'Gujarat Industrial Exhibition 2025',
  venue: 'Helipad Exhibition Centre, Gandhinagar',
  dates: '10th - 15th Jan 2025'
};
```

### Step 2: Run Test

```bash
cd backend
node test-whatsapp-registration.js
```

### Step 3: Verify Output

**✅ Success Output:**
```
🚀 Starting WhatsApp Registration Confirmation Test

📋 Step 1: Validating Configuration...
✅ Configuration valid

📦 Step 2: Preparing Interakt API Payload...
...

📡 Step 3: Sending Request to Interakt API...
✅ Response received in 1234ms

🎉 SUCCESS! WhatsApp message sent successfully!
   ✅ Message ID: msg_abc123xyz
   📱 Check WhatsApp on: +919876543210
```

**❌ Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Check `INTERAKT_API_KEY` in `.env` |
| `400 Bad Request` | Template not approved | Approve template in Interakt dashboard |
| `404 Not Found` | Wrong template name | Verify `templateName` matches approved template |
| `Image not accessible` | Badge URL not public | Ensure badge URL is HTTPS and publicly accessible |

### Step 4: Check WhatsApp

On your test phone, you should receive:

```
┌─────────────────────────────────────────┐
│ [Badge Image - QR Code Visible]        │
├─────────────────────────────────────────┤
│ 🎉 Thank you for registering,          │
│    Aakar Test User!                     │
│                                         │
│ Your badge is attached above.           │
│                                         │
│ 💡 Important Instructions               │
│ • Save your badge (attached above)     │
│ • Show QR code at entry                │
│ • Bring valid ID proof                 │
│                                         │
│ See you at the exhibition! 🎉          │
├─────────────────────────────────────────┤
│ Powered by Aakar Visitors              │
└─────────────────────────────────────────┘
```

**Verify:**
- ✅ Badge image displays correctly
- ✅ QR code is visible and scannable
- ✅ Visitor name is correct
- ✅ Message formatting is proper

---

## 🔧 Integration Phase

Once testing is successful, integrate into the main system:

### Step 1: Create WhatsApp Service

Create `backend/src/services/whatsapp-registration.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

@Injectable()
export class WhatsAppRegistrationService {
  private readonly logger = new Logger(WhatsAppRegistrationService.name);
  private readonly INTERAKT_API_URL: string;
  private readonly INTERAKT_API_KEY: string;

  constructor(private configService: ConfigService) {
    this.INTERAKT_API_URL = this.configService.get<string>(
      'INTERAKT_API_URL',
      'https://api.interakt.ai/v1/public/message/',
    );
    this.INTERAKT_API_KEY = this.configService.get<string>('INTERAKT_API_KEY');
  }

  /**
   * Send registration confirmation with badge image
   */
  async sendRegistrationConfirmation(
    phoneNumber: string,
    visitorName: string,
    badgeImageUrl: string,
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Validate phone number
      if (!isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number');
      }

      const parsed = parsePhoneNumber(phoneNumber);
      const countryCode = `+${parsed.countryCallingCode}`;
      const phone = parsed.nationalNumber;

      // Validate badge URL is HTTPS
      if (!badgeImageUrl.startsWith('https://')) {
        throw new Error('Badge URL must be HTTPS');
      }

      this.logger.log(`📱 Sending registration confirmation to ${countryCode}${phone}`);

      const payload = {
        countryCode: countryCode,
        phoneNumber: phone,
        type: 'Template',
        template: {
          name: 'exhibition_registration_confirmation',
          languageCode: 'en',
          headerValues: [badgeImageUrl], // Badge image
          bodyValues: [visitorName],      // Visitor name
          buttonValues: {},
        },
      };

      const response = await axios.post(this.INTERAKT_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.INTERAKT_API_KEY}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.result === true) {
        this.logger.log(`✅ Registration confirmation sent. Message ID: ${response.data.id}`);
        return {
          success: true,
          messageId: response.data.id,
        };
      }

      return { success: false };
      
    } catch (error) {
      this.logger.error(`❌ Failed to send registration confirmation: ${error.message}`);
      // Don't throw - registration should succeed even if WhatsApp fails
      return { success: false };
    }
  }
}
```

### Step 2: Register Service in Module

Update `backend/src/app.module.ts`:

```typescript
import { WhatsAppRegistrationService } from './services/whatsapp-registration.service';

@Module({
  // ...
  providers: [
    // ... existing providers
    WhatsAppRegistrationService,
  ],
})
export class AppModule {}
```

### Step 3: Integrate into Registration Flow

Update `backend/src/modules/registrations/registrations.service.ts`:

```typescript
import { WhatsAppRegistrationService } from '../../services/whatsapp-registration.service';

@Injectable()
export class RegistrationsService {
  constructor(
    // ... existing dependencies
    private readonly whatsappRegistrationService: WhatsAppRegistrationService,
  ) {}

  async createRegistration(dto: CreateRegistrationDto): Promise<Registration> {
    // ... existing registration logic
    
    const registration = await this.registrationModel.create(/* ... */);
    
    // Generate badge (existing code)
    const badgeUrl = await this.generateBadge(registration);
    
    // 📱 Send WhatsApp confirmation (NEW)
    if (registration.phoneNumber && badgeUrl) {
      // Send asynchronously - don't block registration
      this.whatsappRegistrationService
        .sendRegistrationConfirmation(
          registration.phoneNumber,
          registration.visitorName,
          badgeUrl, // Must be full HTTPS URL
        )
        .catch(error => {
          this.logger.warn(`Failed to send WhatsApp confirmation: ${error.message}`);
          // Don't fail registration if WhatsApp fails
        });
    }
    
    return registration;
  }
}
```

---

## 🔒 Security Considerations

### 1. Badge URL Security

**Problem:** Badges contain sensitive QR codes. Public URLs are a security risk.

**Solution:** Use signed URLs with expiration:

```typescript
// Generate signed URL that expires in 7 days
const signedBadgeUrl = await this.generateSignedUrl(
  badgeFilePath,
  { expiresIn: 7 * 24 * 60 * 60 } // 7 days
);
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// In registrations.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
@Post('register')
async register(@Body() dto: CreateRegistrationDto) {
  // ...
}
```

### 3. Phone Number Validation

Always validate phone numbers before sending:

```typescript
if (!isValidPhoneNumber(phoneNumber)) {
  throw new BadRequestException('Invalid phone number');
}
```

---

## 📊 Monitoring & Analytics

### Track WhatsApp Delivery

```typescript
// In WhatsAppRegistrationService
async sendRegistrationConfirmation(/* ... */): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(/* ... */);
    
    // Log to analytics
    await this.analyticsService.trackEvent({
      event: 'whatsapp_registration_sent',
      messageId: response.data.id,
      phoneNumber: phone, // Hashed for privacy
      timestamp: new Date(),
    });
    
    return { success: true, messageId: response.data.id };
  } catch (error) {
    // Log failure
    await this.analyticsService.trackEvent({
      event: 'whatsapp_registration_failed',
      error: error.message,
      phoneNumber: phone,
      timestamp: new Date(),
    });
    
    return { success: false, error: error.message };
  }
}
```

---

## 🚨 Troubleshooting

### Issue: Badge image not displaying

**Cause:** URL not publicly accessible or not HTTPS

**Solution:**
1. Test badge URL in browser (incognito mode)
2. Ensure no authentication required
3. Check HTTPS certificate is valid

### Issue: Template not found

**Cause:** Template name mismatch or not approved

**Solution:**
1. Check template name in Interakt dashboard
2. Verify template status is "Approved"
3. Ensure language code matches (en)

### Issue: High failure rate

**Cause:** Invalid phone numbers or rate limiting

**Solution:**
1. Validate all phone numbers before sending
2. Implement exponential backoff for retries
3. Check Interakt rate limits

---

## 📚 Additional Resources

- [Interakt API Documentation](https://documenter.getpostman.com/view/14760594/2sA2r7zibM)
- [WhatsApp Business API - Meta Docs](https://developers.facebook.com/docs/whatsapp)
- [libphonenumber-js Documentation](https://www.npmjs.com/package/libphonenumber-js)

---

## ✅ Checklist

Before going live:

- [ ] Template approved in Interakt/Meta
- [ ] Test file runs successfully
- [ ] WhatsApp message received on test phone
- [ ] Badge image displays correctly
- [ ] Service integrated into registration flow
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Monitoring/analytics added
- [ ] Tested with multiple phone numbers
- [ ] Tested with invalid badge URLs (error handling)
- [ ] Production `.env` configured

---

## 🎯 Next Steps

1. ✅ Run test file: `node backend/test-whatsapp-registration.js`
2. ✅ Verify WhatsApp message received
3. ✅ Create WhatsAppRegistrationService
4. ✅ Integrate into registration flow
5. ✅ Test end-to-end
6. ✅ Deploy to production

---

**Questions?** Check the troubleshooting section or contact the development team.

