# Email Invitations Setup Guide

This guide will help you set up the bulk email invitation feature for your GuestPass application.

## Overview

The email invitation system allows you to:
- Send personalized invitations to all guests with email addresses
- Select specific guests to send invitations to
- Include QR codes as attachments in emails
- Track sending success/failure for each email

## Prerequisites

1. A Resend account (free tier includes 100 emails/day, 3,000 emails/month)
2. A verified domain (or use Resend's test email for development)

## Setup Instructions

### Step 1: Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** in the sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "GuestPass Production")
5. Copy the API key (it will only be shown once!)

### Step 3: Configure Your Environment

1. Open your `.env.local` file (create it if it doesn't exist)
2. Add your Resend API key:

```env
RESEND_API_KEY=re_your_api_key_here
```

### Step 4: Configure Your Sender Email

#### For Development/Testing:
You can use Resend's test email address:
- **From Email**: `onboarding@resend.dev`
- This is already set as the default in the code
- Emails will be sent but only to your verified email addresses

#### For Production:
1. **Verify Your Domain** in Resend:
   - Go to **Domains** in Resend dashboard
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Add the DNS records provided by Resend to your domain's DNS settings
   - Wait for verification (usually takes a few minutes)

2. **Update the sender email** in the API route:
   - Open `app/api/send-invitations/route.ts`
   - Find line with `fromEmail = "onboarding@resend.dev"`
   - Change it to your verified email: `fromEmail = "events@yourdomain.com"`
   - Optionally update `fromName` to your organization name

## How to Use

### Option 1: Send to All Guests

1. Open an event in the Event Details dialog
2. Click the **"Send Invitations"** button
3. Select **"Send to All Guests"**
4. Confirm the action
5. Wait for the success notification

### Option 2: Send to Selected Guests

1. Open an event and go to the **"Guests"** tab
2. Use the checkboxes to select specific guests
3. Click the **"Send to Selected"** button that appears
4. Confirm the action
5. Wait for the success notification

## Email Template

Each invitation email includes:
- **Personalized greeting** with guest name
- **Event details**: title, date, venue
- **QR code image** embedded and attached
- **Unique guest code** displayed prominently
- **Check-in instructions**
- **Professional styling** with your branding

## Features

### Batch Processing
- Emails are sent in batches of 10 to avoid rate limits
- Automatic delays between batches
- Progress tracking for large guest lists

### Error Handling
- Individual email failures don't stop the entire process
- Failed emails are logged and reported
- Success/failure summary shown after completion

### Performance
- Optimized for large guest lists (650+ guests)
- Asynchronous processing
- Non-blocking UI during sending

## Troubleshooting

### "Failed to send invitations" Error

**Possible causes:**
1. **Missing API Key**: Check that `RESEND_API_KEY` is set in `.env.local`
2. **Invalid API Key**: Verify your API key is correct
3. **Rate Limit Exceeded**: Free tier has limits (100/day, 3,000/month)
4. **Unverified Domain**: In production, ensure your domain is verified

**Solution:**
- Check the browser console for detailed error messages
- Verify your Resend dashboard for API usage and limits
- Ensure environment variables are loaded (restart dev server)

### Emails Not Being Received

**Possible causes:**
1. **Using test email in production**: `onboarding@resend.dev` only sends to verified addresses
2. **Spam folder**: Check recipient spam/junk folders
3. **Invalid email addresses**: Ensure guest emails are valid
4. **Domain not verified**: Production requires verified domain

**Solution:**
- For testing, use your own verified email address as a guest
- Verify your domain for production use
- Check Resend dashboard logs for delivery status

### QR Codes Not Showing in Emails

**Possible causes:**
1. **Email client blocking images**: Some clients block external images
2. **Attachment issues**: QR code attachment failed to generate

**Solution:**
- QR codes are both embedded and attached for redundancy
- Recipients can download the attachment if embedded image doesn't show
- Test with different email clients (Gmail, Outlook, etc.)

## Rate Limits

### Resend Free Tier:
- **100 emails per day**
- **3,000 emails per month**
- **No credit card required**

### Resend Pro Tier ($20/month):
- **50,000 emails per month**
- **Higher sending rate**
- **Priority support**

## Customization

### Customize Email Template

Edit `app/api/send-invitations/route.ts` to customize:
- Email subject line (line ~180)
- HTML template styling (lines ~90-170)
- Email content and messaging
- Color scheme and branding

### Add Custom Fields

You can add more event details to the email:
1. Pass additional data in the API request
2. Update the email HTML template
3. Include custom instructions or information

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** periodically
4. **Monitor usage** in Resend dashboard
5. **Verify domain ownership** before production use

## Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: [support@resend.com](mailto:support@resend.com)
- **GuestPass Issues**: Check the application logs and console

## Next Steps

After setup:
1. Test with a small group of guests first
2. Verify emails are received and formatted correctly
3. Check QR codes scan properly
4. Monitor Resend dashboard for delivery status
5. Scale up to full guest list once confirmed working

---

**Note**: The invitation system is designed to work seamlessly with your existing GuestPass workflow. Guests receive their unique QR codes via email and can present them at the event for quick check-in.