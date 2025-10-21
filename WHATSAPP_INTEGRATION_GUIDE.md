# WhatsApp Business Cloud API Integration Guide

This guide will help you set up **direct WhatsApp integration** using Meta's official WhatsApp Business Cloud API - **no third-party services required**.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Configuration](#configuration)
5. [Features](#features)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Rate Limits & Best Practices](#rate-limits--best-practices)

---

## 🎯 Overview

The WhatsApp integration allows you to:
- ✅ Send event invitations with QR codes via WhatsApp
- ✅ Send bulk invitations to multiple guests
- ✅ Send check-in confirmations
- ✅ Send event reminders
- ✅ Track invitation delivery status

**Direct Integration Benefits:**
- 🚀 No third-party costs or dependencies
- 🔒 Direct connection to Meta's official API
- 📊 Full control over message delivery
- 💰 Free tier: 1,000 conversations/month
- 🌍 Global reach to 2+ billion WhatsApp users

---

## ✅ Prerequisites

Before you begin, you'll need:

1. **Meta Business Account** (free)
2. **Facebook Developer Account** (free)
3. **WhatsApp Business Account** (free)
4. **Business Phone Number** (for WhatsApp Business)
5. **Verified Business** (optional, but recommended for production)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click **"Create Account"**
3. Enter your business name and details
4. Verify your email address

### Step 2: Create Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name**: "GuestPass Events" (or your preferred name)
   - **App Contact Email**: Your email
   - **Business Account**: Select your Meta Business Account
5. Click **"Create App"**

### Step 3: Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** in the products list
2. Click **"Set Up"**
3. Accept WhatsApp's Terms & Policies
4. You'll be redirected to the WhatsApp setup page

### Step 4: Get Temporary Access Token (for testing)

1. In the WhatsApp setup page, go to **"API Setup"**
2. You'll see a **"Temporary Access Token"** (valid for 24 hours)
3. Copy this token - you'll use it for initial testing
4. Note the **"Phone Number ID"** displayed below the token

### Step 5: Add Test Phone Number

1. In the **"API Setup"** section, find **"To"** field
2. Click **"Manage phone number list"**
3. Add your phone number (with country code, e.g., +263785211893)
4. You'll receive a verification code on WhatsApp
5. Enter the code to verify

### Step 6: Send Test Message

1. In the **"API Setup"** section, click **"Send message"**
2. You should receive a test message on WhatsApp
3. If successful, your setup is working! ✅

### Step 7: Register Business Phone Number

For production use, you need to register a business phone number:

1. Go to **"Phone Numbers"** in the left sidebar
2. Click **"Add Phone Number"**
3. Choose one of these options:
   - **Use your own number**: Verify your business phone
   - **Get a new number**: Request a number from Meta (may require business verification)
4. Complete the verification process (OTP via SMS or call)
5. Once verified, note the new **Phone Number ID**

### Step 8: Generate Permanent Access Token

The temporary token expires in 24 hours. For production, create a permanent token:

1. Go to **"App Settings"** → **"Basic"**
2. Scroll to **"WhatsApp"** section
3. Click **"Generate Token"** or go to **"API Setup"** → **"Generate Access Token"**
4. Select the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the **System User Access Token** (this doesn't expire)
6. **IMPORTANT**: Store this token securely - you won't be able to see it again!

### Step 9: Configure Your App

1. Open your `.env.local` file in the project root
2. Add the following variables:

```env
# WhatsApp Business Cloud API
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

3. Replace the placeholder values with your actual credentials
4. Save the file

### Step 10: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to your event's guest list
3. Select a guest with a phone number
4. Click the **WhatsApp** button
5. Check if the invitation is sent successfully

---

## ⚙️ Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# WhatsApp Business Cloud API (Meta)
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Your app URL (required for QR code links)
VITE_APP_URL=https://your-app-url.vercel.app
```

### Vercel Deployment

When deploying to Vercel, add these environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `WHATSAPP_ACCESS_TOKEN` (your permanent token)
   - `WHATSAPP_PHONE_NUMBER_ID` (your phone number ID)
4. Redeploy your app

---

## 🎨 Features

### 1. Single Guest Invitation

Send invitation to one guest at a time:

```typescript
// Automatically sends:
// 1. Welcome message with event details
// 2. QR code image
```

### 2. Bulk Invitations

Send invitations to multiple guests:

```typescript
// Features:
// - Sends to all selected guests with phone numbers
// - Rate limiting (1 message/second)
// - Progress tracking
// - Detailed results (success/failed/skipped)
```

### 3. Check-In Confirmation

Automatically send confirmation after guest checks in:

```typescript
await whatsappService.sendCheckInConfirmation({
  guestName: "John Doe",
  guestPhone: "+263785211893",
  eventName: "Annual Gala",
  checkInTime: "2024-01-15 6:30 PM"
})
```

### 4. Event Reminders

Send reminders before event starts:

```typescript
await whatsappService.sendEventReminder({
  guestName: "John Doe",
  guestPhone: "+263785211893",
  eventName: "Annual Gala",
  eventDate: "January 15, 2024 at 7:00 PM",
  eventLocation: "Grand Ballroom",
  hoursUntilEvent: 2
})
```

---

## 📖 Usage

### In Guest List Component

Add the WhatsApp button to your guest list:

```tsx
import { WhatsAppSendButton } from "@/components/guests/whatsapp-send-button"
import { WhatsAppBulkSendDialog } from "@/components/guests/whatsapp-bulk-send-dialog"

// Single guest
<WhatsAppSendButton
  guestId={guest.id}
  guestName={guest.name}
  guestPhone={guest.phone}
  eventId={eventId}
/>

// Bulk send
<WhatsAppBulkSendDialog
  selectedGuestIds={selectedGuestIds}
  selectedGuests={selectedGuests}
  eventId={eventId}
  onComplete={() => {
    // Refresh guest list or show success message
  }}
/>
```

### Programmatic Usage

Use the WhatsApp service directly in your code:

```typescript
import { whatsappService } from "@/lib/whatsapp-service"

// Check if configured
if (whatsappService.isConfigured()) {
  // Send custom message
  await whatsappService.sendTextMessage({
    to: "+263785211893",
    message: "Hello from GuestPass!"
  })

  // Send image
  await whatsappService.sendImageMessage({
    to: "+263785211893",
    imageUrl: "https://example.com/image.jpg",
    caption: "Check out this image!"
  })

  // Send document
  await whatsappService.sendDocumentMessage({
    to: "+263785211893",
    documentUrl: "https://example.com/document.pdf",
    filename: "Event_Details.pdf",
    caption: "Event information attached"
  })
}
```

---

## 🔌 API Reference

### API Endpoints

#### 1. Send Single Invitation

**POST** `/api/whatsapp/send-invitation`

**Request Body:**
```json
{
  "guestId": "uuid",
  "eventId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp invitation sent successfully",
  "messageId": "wamid.xxx",
  "recipient": "263785211893"
}
```

#### 2. Send Bulk Invitations

**POST** `/api/whatsapp/send-bulk`

**Request Body:**
```json
{
  "guestIds": ["uuid1", "uuid2", "uuid3"],
  "eventId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent 3 invitations",
  "results": {
    "sent": 3,
    "failed": 0,
    "skipped": 1,
    "details": {
      "success": ["John Doe", "Jane Smith"],
      "failed": [],
      "skipped": [
        {
          "guestId": "uuid",
          "name": "Bob Wilson",
          "reason": "No phone number"
        }
      ]
    }
  }
}
```

#### 3. Get Guest QR Code

**GET** `/api/guests/[guestId]/qr-code`

Returns PNG image of guest's QR code (public endpoint for WhatsApp to fetch).

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "WhatsApp service not configured"

**Solution:**
- Check that `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set in `.env.local`
- Restart your development server after adding environment variables

#### 2. "Invalid phone number format"

**Solution:**
- Ensure phone numbers include country code (e.g., +263785211893)
- Remove spaces and special characters
- The service automatically formats numbers, but input should be valid

#### 3. "Message failed to send"

**Possible causes:**
- Recipient hasn't opted in (for production numbers)
- Phone number not registered on WhatsApp
- Rate limit exceeded
- Invalid access token

**Solution:**
- For testing: Add recipient to test phone numbers list
- For production: Ensure recipient has opted in to receive messages
- Check Meta Business Manager for error details

#### 4. "Access token expired"

**Solution:**
- Temporary tokens expire in 24 hours
- Generate a permanent System User Access Token (see Step 8)
- Update `WHATSAPP_ACCESS_TOKEN` in environment variables

#### 5. "QR code image not loading in WhatsApp"

**Solution:**
- Ensure `VITE_APP_URL` is set to your public URL
- QR code endpoint must be publicly accessible
- Check that your app is deployed and accessible
- For local testing, use ngrok or similar tunneling service

---

## ⚡ Rate Limits & Best Practices

### Rate Limits

**WhatsApp Cloud API Limits:**
- **Free Tier**: 1,000 business-initiated conversations/month
- **Messaging Rate**: 80 messages/second (per phone number)
- **Daily Limit**: Varies based on phone number quality rating

**Our Implementation:**
- Bulk send: 1 message/second (conservative rate limiting)
- Prevents API throttling
- Ensures reliable delivery

### Best Practices

#### 1. Message Templates (Production)

For production use, create and get approval for message templates:

1. Go to **WhatsApp Manager** → **Message Templates**
2. Click **"Create Template"**
3. Design your invitation template
4. Submit for approval (usually takes 24-48 hours)
5. Use approved templates with `sendTemplateMessage()`

**Benefits:**
- Higher delivery rates
- Better quality rating
- Professional appearance
- Compliance with WhatsApp policies

#### 2. Opt-In Management

**Important:** In production, you can only message users who have opted in.

**How to get opt-in:**
- Add checkbox on RSVP form: "I agree to receive event updates via WhatsApp"
- Store opt-in status in database
- Only send to users who have opted in

#### 3. Phone Number Quality

Maintain high quality rating:
- ✅ Only send relevant messages
- ✅ Respect user preferences
- ✅ Provide opt-out option
- ❌ Don't spam
- ❌ Don't send promotional content without consent

#### 4. Error Handling

Always handle errors gracefully:

```typescript
try {
  await whatsappService.sendGuestInvitation(...)
} catch (error) {
  // Log error
  console.error('WhatsApp send failed:', error)
  
  // Fallback to email
  await sendEmailInvitation(...)
  
  // Notify user
  toast.error('WhatsApp unavailable, sent via email instead')
}
```

#### 5. Testing

**Development:**
- Use temporary access token
- Add test numbers to allowed list
- Test all message types

**Production:**
- Use permanent access token
- Test with real opt-in users
- Monitor delivery rates in Meta Business Manager

---

## 📊 Monitoring & Analytics

### Meta Business Manager

Monitor your WhatsApp integration:

1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Navigate to **WhatsApp Manager**
3. View:
   - Message delivery rates
   - Phone number quality rating
   - Conversation analytics
   - Template performance
   - Error logs

### In Your App

Track invitation status:

```typescript
// Update guest record after sending
await supabase
  .from('guests')
  .update({
    invitation_sent: true,
    invitation_sent_at: new Date().toISOString(),
    invitation_method: 'whatsapp'
  })
  .eq('id', guestId)
```

---

## 🔐 Security Best Practices

1. **Never commit access tokens** to version control
2. **Use environment variables** for all credentials
3. **Rotate tokens periodically** (every 90 days recommended)
4. **Restrict API permissions** to only what's needed
5. **Monitor usage** for suspicious activity
6. **Implement rate limiting** on your API endpoints
7. **Validate phone numbers** before sending
8. **Log all API calls** for audit trail

---

## 📚 Additional Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Manager](https://business.facebook.com/)
- [WhatsApp Business Policies](https://www.whatsapp.com/legal/business-policy)
- [API Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/rate-limits)

---

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Meta's [WhatsApp API Status](https://developers.facebook.com/status/)
3. Check your app's error logs in Meta Business Manager
4. Contact Meta Business Support (for API issues)

---

## 🎉 You're All Set!

Your WhatsApp integration is now ready to use. Start sending invitations and enjoy seamless communication with your event guests!

**Next Steps:**
1. Test with a few guests
2. Create message templates for production
3. Monitor delivery rates
4. Gather feedback from guests
5. Scale up to bulk invitations

Happy event planning! 🎊