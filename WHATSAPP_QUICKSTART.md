# WhatsApp Integration - Quick Start Guide

Get WhatsApp invitations working in **15 minutes**! ⚡

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Meta Developer Account (2 min)

1. Go to https://developers.facebook.com/
2. Click **"Get Started"** and log in with Facebook
3. Complete your developer profile

### Step 2: Create WhatsApp App (3 min)

1. Go to https://developers.facebook.com/apps
2. Click **"Create App"** → Select **"Business"**
3. Name: "GuestPass Events"
4. Click **"Create App"**
5. Find **"WhatsApp"** → Click **"Set Up"**

### Step 3: Get Your Credentials (2 min)

1. In WhatsApp setup, go to **"API Setup"**
2. Copy these two values:

   ```
   Temporary Access Token: EAAxxxxxxxxxxxxxxx
   Phone Number ID: 123456789012345
   ```

3. Add your test phone number:
   - Click **"Manage phone number list"**
   - Add your WhatsApp number (e.g., +263785211893)
   - Verify with the code you receive

### Step 4: Configure Your App (1 min)

1. Open `.env.local` in your project
2. Add these lines:

   ```env
   WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   ```

3. Save the file

### Step 5: Test It! (2 min)

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to an event → Guest list
3. Click the WhatsApp button next to a guest
4. Check your WhatsApp - you should receive the invitation! 🎉

---

## ✅ That's It!

You now have WhatsApp invitations working!

### What You Can Do Now:

- ✅ Send individual invitations
- ✅ Send bulk invitations to multiple guests
- ✅ Guests receive event details + QR code
- ✅ Track who received invitations

---

## 🔄 For Production Use

The temporary token expires in 24 hours. For production:

### Generate Permanent Token:

1. In your Meta app, go to **"App Settings"** → **"Basic"**
2. Under WhatsApp section, click **"Generate Token"**
3. Select permissions: `whatsapp_business_messaging`
4. Copy the **System User Access Token**
5. Update `.env.local` with the new token
6. Add to Vercel environment variables

### Register Business Phone Number:

1. Go to **"Phone Numbers"** in WhatsApp Manager
2. Click **"Add Phone Number"**
3. Verify your business phone number
4. Update `WHATSAPP_PHONE_NUMBER_ID` with new number ID

---

## 📱 How It Works

When you send an invitation:

1. **Message 1**: Text with event details
   ```
   🎉 Event Invitation
   
   Hello John Doe!
   
   You're invited to: Annual Gala
   📅 Date: January 15, 2024
   📍 Location: Grand Ballroom
   
   Your QR code is attached below...
   ```

2. **Message 2**: QR code image
   - Guest's personal QR code
   - Ready to scan at check-in

---

## 🎯 Usage Examples

### In Guest List Component:

```tsx
import { WhatsAppSendButton } from "@/components/guests/whatsapp-send-button"

<WhatsAppSendButton
  guestId={guest.id}
  guestName={guest.name}
  guestPhone={guest.phone}
  eventId={eventId}
/>
```

### Bulk Send:

```tsx
import { WhatsAppBulkSendDialog } from "@/components/guests/whatsapp-bulk-send-dialog"

<WhatsAppBulkSendDialog
  selectedGuestIds={selectedGuestIds}
  selectedGuests={selectedGuests}
  eventId={eventId}
/>
```

---

## ⚠️ Important Notes

### Phone Number Format:
- ✅ Include country code: `+263785211893`
- ✅ Can have spaces: `+263 78 521 1893`
- ❌ Don't use: `0785211893` (missing country code)

### Testing:
- Add your phone number to test list in Meta dashboard
- Temporary token expires in 24 hours
- Test numbers can receive unlimited messages

### Production:
- Get permanent access token
- Register business phone number
- Create approved message templates
- Ensure users opt-in to receive messages

---

## 🐛 Troubleshooting

### "WhatsApp service not configured"
→ Check `.env.local` has both `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
→ Restart dev server after adding variables

### "Failed to send message"
→ Add recipient to test phone numbers in Meta dashboard
→ Verify phone number format includes country code
→ Check access token hasn't expired

### "QR code not loading"
→ Ensure `VITE_APP_URL` is set in `.env.local`
→ For local testing, use ngrok or deploy to Vercel

---

## 📚 Need More Help?

- **Full Guide**: See `WHATSAPP_INTEGRATION_GUIDE.md`
- **Meta Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **API Status**: https://developers.facebook.com/status/

---

## 🎉 Success!

You're now sending WhatsApp invitations! 

**Next Steps:**
1. Test with a few guests
2. Try bulk send feature
3. Set up permanent token for production
4. Customize message templates

Happy event planning! 🎊