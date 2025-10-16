# MailerSend Quick Start Checklist

Follow these steps to get your email invitations working with MailerSend.

## ✅ Step-by-Step Setup

### 1. Create MailerSend Account
- [ ] Go to https://www.mailersend.com/
- [ ] Sign up for a free account
- [ ] Verify your email address
- [ ] Complete account setup

### 2. Get API Token
- [ ] Log in to MailerSend dashboard
- [ ] Navigate to **Settings** → **API Tokens**
- [ ] Click **Generate new token**
- [ ] Name it "GuestPass App"
- [ ] Select permissions: **Email** (Full access)
- [ ] Copy the token (save it somewhere safe!)

### 3. Create Email Template
- [ ] Go to **Email** → **Templates**
- [ ] Click **Create Template**
- [ ] Name it "Event Invitation with QR Code"
- [ ] Copy the HTML from `MAILERSEND_SETUP.md`
- [ ] Paste into the template editor
- [ ] Save the template
- [ ] Copy the **Template ID** (looks like: `vywj2lpgxxx`)

### 4. Configure Environment Variables
- [ ] Open `.env.local` in your project
- [ ] Replace `your_mailersend_api_key_here` with your actual API token
- [ ] Replace `your_template_id_here` with your template ID
- [ ] Update `MAILERSEND_FROM_EMAIL` with your email
- [ ] Update `MAILERSEND_FROM_NAME` if desired

**Your `.env.local` should look like:**
```env
MAILERSEND_API_KEY=mlsn.abc123xyz789...
MAILERSEND_FROM_EMAIL=you@yourdomain.com
MAILERSEND_FROM_NAME=GuestPass Events
MAILERSEND_TEMPLATE_ID=vywj2lpgxxx
```

### 5. Verify Email Address (For Testing)
- [ ] Go to **Domains** in MailerSend
- [ ] Click **Verify Email** (for sandbox testing)
- [ ] Enter your email address
- [ ] Check your inbox for verification email
- [ ] Click the verification link

### 6. Restart Development Server
```bash
npm run dev
```

### 7. Test the Integration
- [ ] Open your app in browser
- [ ] Create a test event
- [ ] Add yourself as a guest (use verified email)
- [ ] Click "Send Invitations"
- [ ] Select your guest
- [ ] Click "Send to Selected"
- [ ] Check your email inbox

## 🎯 Quick Test

Run this quick test to verify everything works:

1. **Create Test Event:**
   - Title: "Test Event"
   - Date: Tomorrow
   - Venue: "Test Venue"

2. **Add Test Guest:**
   - Name: Your name
   - Email: Your verified email

3. **Send Invitation:**
   - Select the guest
   - Click "Send Invitations"
   - Wait for success message

4. **Check Email:**
   - Look for email from your configured sender
   - Verify all details are correct
   - Check that QR code appears
   - Verify unique code is visible

## 🚨 Common Issues & Quick Fixes

### Issue: "MailerSend API key is not configured"
**Fix:** 
- Check `.env.local` has `MAILERSEND_API_KEY`
- Restart dev server: `npm run dev`

### Issue: "MailerSend template ID is not configured"
**Fix:**
- Check `.env.local` has `MAILERSEND_TEMPLATE_ID`
- Verify template ID is correct in MailerSend dashboard

### Issue: Email not received
**Fix:**
- Check spam/junk folder
- Verify email address in MailerSend (for sandbox)
- Check MailerSend activity log for delivery status

### Issue: QR code not showing
**Fix:**
- Verify template has `<img src="cid:qrcode" />`
- Check template variables are correct

### Issue: Variables showing as {$variable_name}
**Fix:**
- Check variable names match exactly (see `TEMPLATE_VARIABLES.md`)
- Verify template is saved correctly
- Check template ID is correct

## 📚 Documentation Files

- **`MAILERSEND_SETUP.md`** - Complete setup guide with template HTML
- **`TEMPLATE_VARIABLES.md`** - Variable reference and examples
- **`MAILERSEND_MIGRATION_SUMMARY.md`** - What changed and why

## 🎓 Template Variables Quick Reference

Your template must include these variables:

```
{$guest_name}      - Guest's name
{$event_title}     - Event title
{$event_date}      - Formatted date
{$event_venue}     - Venue location
{$unique_code}     - Check-in code
{$from_name}       - Sender name
```

And this for the QR code:
```html
<img src="cid:qrcode" alt="QR Code" />
```

## 🚀 Production Deployment

When ready for production:

### 1. Verify Domain
- [ ] Go to **Domains** in MailerSend
- [ ] Add your domain
- [ ] Add DNS records to your domain provider
- [ ] Wait for verification

### 2. Update Environment Variables
- [ ] Update `MAILERSEND_FROM_EMAIL` to use your domain
- [ ] Example: `events@yourdomain.com`

### 3. Deploy
- [ ] Add environment variables to your hosting platform
- [ ] Deploy your application
- [ ] Test with a small batch first

## 💡 Tips

1. **Save your API token securely** - You can't view it again after creation
2. **Test with your own email first** - Easier to debug issues
3. **Check MailerSend activity log** - Shows delivery status and errors
4. **Use sandbox for testing** - Free and doesn't count toward limits
5. **Verify domain for production** - Required for sending to any email

## 📊 MailerSend Free Tier Limits

- ✅ 12,000 emails per month
- ✅ 100 emails per hour
- ✅ Email support
- ✅ Template system
- ✅ Analytics

Perfect for most small to medium events!

## ✨ You're Done!

Once you complete all steps above, your email invitation system is ready to use!

**Next Steps:**
- Create your first real event
- Add guests
- Send invitations
- Monitor delivery in MailerSend dashboard

## 🆘 Need Help?

1. **Check the docs:** See `MAILERSEND_SETUP.md` for detailed instructions
2. **Check variables:** See `TEMPLATE_VARIABLES.md` for template help
3. **Check logs:** Browser console and server logs show errors
4. **Check MailerSend:** Activity log shows delivery status
5. **Contact support:** MailerSend has excellent support

---

**Estimated Setup Time:** 15-20 minutes

**Difficulty:** Easy ⭐⭐☆☆☆

Good luck! 🎉