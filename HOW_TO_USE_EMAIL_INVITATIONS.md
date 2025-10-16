# How to Use Email Invitations - Step-by-Step Guide

## 🎯 Quick Start (3 Steps)

### Step 1: Get Your Resend API Key
1. Go to [resend.com](https://resend.com) and sign up
2. Create an API key in the dashboard
3. Add it to your `.env.local` file:
   ```
   RESEND_API_KEY=re_your_key_here
   ```
4. Restart your development server

### Step 2: Add Guests with Email Addresses
- When adding guests, make sure to include their email addresses
- Guests without emails won't receive invitations (but can still attend)

### Step 3: Send Invitations
- Click "Send Invitations" button
- Choose "Send to All" or select specific guests
- Confirm and wait for success message

---

## 📧 Method 1: Send to All Guests

**Best for**: Sending invitations to everyone at once (e.g., all 650 guests)

### Steps:

1. **Open Event Details**
   - Click on any event from your events list
   - The Event Details dialog will open

2. **Navigate to Overview Tab**
   - You should be on the "Overview" tab by default
   - You'll see event statistics and action buttons

3. **Click "Send Invitations" Button**
   - Look for the button with a mail icon (📧)
   - It's located next to "Generate QR Codes" and "Export Data"

4. **Select "Send to All Guests"**
   - A dropdown menu will appear
   - Click "Send to All Guests"

5. **Confirm the Action**
   - A confirmation dialog will appear
   - It will show: "Send invitations to all X guest(s) with email addresses?"
   - Click "OK" to proceed

6. **Wait for Completion**
   - The button will show a loading spinner
   - For 650 guests, this takes about 2-3 minutes
   - You can continue using the app while it sends

7. **Check Results**
   - A success notification will appear
   - It will show: "Successfully sent X invitation(s)"
   - If any failed, you'll see a separate notification

### What Happens:
- ✅ Only guests with email addresses receive invitations
- ✅ Each guest gets a personalized email with their name
- ✅ QR code is embedded in the email and attached as a file
- ✅ Emails are sent in batches to avoid rate limits
- ✅ Failed emails are tracked and reported

---

## 🎯 Method 2: Send to Selected Guests

**Best for**: Sending to specific groups (e.g., VIP guests, late additions, resending to specific people)

### Steps:

1. **Open Event Details**
   - Click on your event
   - The Event Details dialog will open

2. **Go to "Guests" Tab**
   - Click the "Guests" tab at the top
   - You'll see the full guest list with checkboxes

3. **Select Guests**
   
   **Option A: Select Individual Guests**
   - Click the checkbox next to each guest you want to invite
   - Selected guests will be checked ✓
   
   **Option B: Select All Guests**
   - Click the checkbox in the table header (next to "Name")
   - All visible guests will be selected
   
   **Option C: Search and Select**
   - Use the search box to filter guests
   - Select from the filtered results
   - Example: Search "VIP" to find VIP guests

4. **Review Selection**
   - A badge will appear showing "X selected"
   - A "Send to Selected" button will appear

5. **Click "Send to Selected"**
   - The button has a send icon (📤)
   - It's located near the "Add guest" button

6. **Confirm the Action**
   - A confirmation dialog will appear
   - It will show: "Send invitations to X selected guest(s)?"
   - Click "OK" to proceed

7. **Wait for Completion**
   - The button will show a loading spinner
   - Time depends on number of selected guests
   - Approximately 1 second per guest

8. **Check Results**
   - Success notification will appear
   - Selection will be cleared automatically
   - Failed emails will be reported

### Pro Tips:
- 💡 **Filter First**: Use search to find specific groups, then select all
- 💡 **Check Emails**: Verify guests have email addresses before selecting
- 💡 **Batch Sending**: Select 50-100 at a time for better control
- 💡 **Deselect**: Click checkbox again to deselect a guest

---

## 📨 What Guests Receive

### Email Contents:
```
┌─────────────────────────────────────────┐
│  🎉 You're Invited!                     │
├─────────────────────────────────────────┤
│  Hello John Doe,                        │
│                                         │
│  You're cordially invited to attend:   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Annual Gala 2024                  │ │
│  │ 📅 Saturday, January 20, 2024     │ │
│  │ 📍 Grand Ballroom, City Center    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📱 Check-in Instructions:              │
│  Present your QR code below at the     │
│  event entrance for quick check-in.    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Your Personal QR Code           │ │
│  │                                   │ │
│  │   [QR CODE IMAGE]                 │ │
│  │                                   │ │
│  │   Your unique code: ABC123        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  We look forward to seeing you!        │
└─────────────────────────────────────────┘
```

### Attachments:
- **QR Code SVG File**: `John-Doe-ABC123-qrcode.svg`
- Guests can save this to their phone
- Works offline at the event

---

## 🔍 Monitoring & Troubleshooting

### Check Sending Status

**During Sending:**
- Button shows loading spinner
- UI remains responsive
- Can navigate away and come back

**After Sending:**
- Toast notification shows results
- Console logs detailed information
- Check browser console (F12) for details

### Common Issues & Solutions

#### ❌ "No guests to invite"
**Problem**: No guests have email addresses
**Solution**: 
- Add email addresses to guests
- Check that emails are valid format
- Verify guests aren't filtered out

#### ❌ "Failed to send invitations"
**Problem**: API key missing or invalid
**Solution**:
- Check `.env.local` has `RESEND_API_KEY`
- Verify API key is correct
- Restart development server
- Check Resend dashboard for API status

#### ❌ "Some invitations failed"
**Problem**: Individual emails couldn't be sent
**Solution**:
- Check console for failed email addresses
- Verify email addresses are valid
- Check Resend dashboard for error details
- Resend to failed recipients

#### ❌ Emails not received
**Problem**: Emails sent but not in inbox
**Solution**:
- Check spam/junk folder
- Verify email address is correct
- Using test email? Only sends to verified addresses
- Check Resend dashboard for delivery status

---

## 📊 Best Practices

### Before Sending:

1. **Test First**
   - Send to yourself first
   - Verify email looks correct
   - Check QR code scans properly

2. **Verify Guest Data**
   - Check email addresses are valid
   - Remove duplicate guests
   - Update any incorrect information

3. **Check Rate Limits**
   - Free tier: 100 emails/day
   - Plan accordingly for large events
   - Consider upgrading for 650+ guests

### During Sending:

1. **Don't Close Browser**
   - Keep tab open until complete
   - Can navigate within app
   - Don't refresh page

2. **Monitor Progress**
   - Watch for success notification
   - Check console for any errors
   - Note any failed emails

3. **Be Patient**
   - Large lists take time
   - 650 guests ≈ 2-3 minutes
   - Don't click send again

### After Sending:

1. **Verify Delivery**
   - Check Resend dashboard
   - Confirm emails were delivered
   - Review any bounces

2. **Handle Failures**
   - Note failed email addresses
   - Correct invalid emails
   - Resend to failed recipients

3. **Track Responses**
   - Monitor who received invitations
   - Follow up with non-responders
   - Send reminders if needed

---

## 🎓 Advanced Usage

### Scenario 1: VIP Guests Only
```
1. Search: "VIP"
2. Click "Select All" checkbox
3. Click "Send to Selected"
4. Confirm
```

### Scenario 2: Resend to Specific Guests
```
1. Note failed email addresses from console
2. Search for those guests
3. Select them individually
4. Click "Send to Selected"
5. Confirm
```

### Scenario 3: Late Additions
```
1. Add new guests with emails
2. Search for today's date in guest list
3. Select newly added guests
4. Click "Send to Selected"
5. Confirm
```

### Scenario 4: Reminder Emails
```
1. Filter guests who haven't checked in
2. Select all filtered guests
3. Send invitations again as reminder
4. Guests receive fresh QR code
```

---

## 📈 Performance Tips

### For Large Guest Lists (500+):

1. **Send in Batches**
   - Select 100 guests at a time
   - Wait for completion
   - Select next batch

2. **Use Filters**
   - Filter by category/group
   - Send to each group separately
   - Better control and tracking

3. **Schedule Wisely**
   - Send during off-peak hours
   - Avoid sending all at once
   - Spread over multiple days if needed

4. **Monitor Resources**
   - Check Resend dashboard
   - Watch for rate limit warnings
   - Upgrade plan if needed

---

## ✅ Checklist

Before sending invitations, ensure:

- [ ] Resend API key is configured
- [ ] Development server is running
- [ ] Guests have valid email addresses
- [ ] Event details are correct
- [ ] QR codes are generating properly
- [ ] Test email sent and received
- [ ] Rate limits are sufficient
- [ ] Browser tab will stay open

---

## 🆘 Need Help?

### Resources:
- **Setup Guide**: See `EMAIL_INVITATIONS_SETUP.md`
- **Feature Summary**: See `BULK_EMAIL_FEATURE_SUMMARY.md`
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Console Logs**: Press F12 to view detailed logs

### Support:
- Check browser console for errors
- Review Resend dashboard for delivery status
- Verify environment variables are set
- Restart development server if needed

---

**Happy Inviting! 🎉**

Your guests will receive beautiful, personalized invitations with their unique QR codes, making check-in at your event smooth and professional.