# MailerSend Migration Summary

## What Was Changed

Your GuestPass app has been successfully migrated from Resend to MailerSend for email invitations.

### Files Modified:

1. **`.env.local`** - Updated environment variables
2. **`.env.example`** - Updated example configuration
3. **`app/api/send-invitations/route.ts`** - Complete rewrite to use MailerSend SDK

### Files Created:

1. **`MAILERSEND_SETUP.md`** - Comprehensive setup guide
2. **`MAILERSEND_MIGRATION_SUMMARY.md`** - This file

## Key Changes

### Environment Variables

**Old (Resend):**
```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=GuestPass Events
```

**New (MailerSend):**
```env
MAILERSEND_API_KEY=your_mailersend_api_key_here
MAILERSEND_FROM_EMAIL=your-email@yourdomain.com
MAILERSEND_FROM_NAME=GuestPass Events
MAILERSEND_TEMPLATE_ID=your_template_id_here
```

### API Route Changes

The `/api/send-invitations` route now:
- Uses MailerSend SDK instead of Resend
- Supports MailerSend's template system with variables
- Sends the following variables to your template:
  - `guest_name` - Guest's name
  - `event_title` - Event title
  - `event_date` - Formatted date
  - `event_venue` - Venue location
  - `unique_code` - Guest's unique check-in code
  - `from_name` - Sender name
- Still includes QR code as inline attachment (content ID: "qrcode")
- Maintains batch processing (10 emails per batch)
- Includes rate limiting with 1-second delays between batches

## What You Need to Do Now

### 1. Get Your MailerSend Credentials

1. Log in to [MailerSend](https://www.mailersend.com/)
2. Get your API token from **Settings** → **API Tokens**
3. Create an email template (see `MAILERSEND_SETUP.md` for details)
4. Copy your template ID

### 2. Update `.env.local`

Replace the placeholder values in `.env.local`:

```env
MAILERSEND_API_KEY=mlsn.your_actual_token_here
MAILERSEND_FROM_EMAIL=your-verified-email@yourdomain.com
MAILERSEND_FROM_NAME=GuestPass Events
MAILERSEND_TEMPLATE_ID=your_actual_template_id
```

### 3. Create Your Email Template

Follow the detailed instructions in `MAILERSEND_SETUP.md` to create your template in the MailerSend dashboard.

**Important:** Your template must include these variables:
- `{$guest_name}`
- `{$event_title}`
- `{$event_date}`
- `{$event_venue}`
- `{$unique_code}`
- `{$from_name}`

And this image tag for the QR code:
```html
<img src="cid:qrcode" alt="Your QR Code" />
```

### 4. Restart Your Development Server

After updating `.env.local`:

```bash
npm run dev
```

### 5. Test the Integration

1. Create a test event
2. Add a guest with your email
3. Send an invitation
4. Check your email

## Template System Benefits

Using MailerSend's template system provides:

✅ **Easy Updates** - Change email design without code changes
✅ **Version Control** - Track template versions in MailerSend dashboard
✅ **A/B Testing** - Test different email designs
✅ **Team Collaboration** - Non-developers can update templates
✅ **Preview** - Preview emails before sending
✅ **Analytics** - Track opens, clicks, and engagement

## Rollback Instructions

If you need to switch back to Resend:

1. Restore the old `route.ts` from git history:
   ```bash
   git checkout HEAD~1 app/api/send-invitations/route.ts
   ```

2. Update `.env.local` back to Resend variables

3. Restart the server

## Package Information

- **MailerSend SDK**: `mailersend@^2.6.0` (already installed)
- **Resend SDK**: `resend@^6.1.2` (can be removed if not needed)

To remove Resend:
```bash
npm uninstall resend
```

## Support Resources

- **Setup Guide**: See `MAILERSEND_SETUP.md`
- **MailerSend Docs**: https://developers.mailersend.com/
- **MailerSend Support**: https://www.mailersend.com/help

## Testing Checklist

Before going to production:

- [ ] API token is configured
- [ ] Template is created with all required variables
- [ ] Template ID is added to `.env.local`
- [ ] From email is verified in MailerSend
- [ ] Test email sent successfully
- [ ] QR code appears in email
- [ ] All template variables display correctly
- [ ] Email renders well on mobile devices
- [ ] Batch sending works for multiple guests
- [ ] Error handling works (test with invalid email)

## Production Deployment

When deploying to production:

1. **Verify Your Domain** in MailerSend
2. **Update Environment Variables** on your hosting platform
3. **Test in Production** with a small batch first
4. **Monitor** the MailerSend activity log for delivery issues
5. **Set Up Webhooks** (optional) for delivery notifications

## Notes

- The frontend code (`event-details-dialog.tsx`) requires no changes
- QR code generation logic remains unchanged
- Batch processing and rate limiting are maintained
- Error handling and reporting work the same way
- The API response format is identical to the Resend version

## Questions?

If you encounter any issues:
1. Check `MAILERSEND_SETUP.md` for troubleshooting
2. Review the MailerSend activity log in your dashboard
3. Check browser console and server logs for errors
4. Verify all environment variables are set correctly