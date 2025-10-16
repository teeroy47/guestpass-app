# Email Invitations - Quick Reference Card

## 🚀 Setup (One-Time)

```bash
# 1. Get API key from resend.com
# 2. Add to .env.local:
RESEND_API_KEY=re_your_key_here

# 3. Restart server
npm run dev
```

## 📧 Send to All Guests

```
Event Details → Overview Tab → Send Invitations → Send to All Guests
```

**Time**: ~2-3 minutes for 650 guests

## 🎯 Send to Selected Guests

```
Event Details → Guests Tab → Check boxes → Send to Selected
```

**Time**: ~1 second per guest

## 🔍 Quick Actions

| Action | Location | Shortcut |
|--------|----------|----------|
| Send to All | Overview tab | Click "Send Invitations" dropdown |
| Select Guests | Guests tab | Click checkboxes |
| Select All | Guests tab | Click header checkbox |
| Search & Select | Guests tab | Search → Select filtered results |
| Clear Selection | Guests tab | Click header checkbox again |

## ✅ What Guests Get

- ✉️ Personalized email with their name
- 📅 Event details (date, venue)
- 🎫 QR code (embedded + attached)
- 🔢 Unique guest code
- 📱 Check-in instructions

## ⚡ Rate Limits

| Plan | Daily | Monthly |
|------|-------|---------|
| Free | 100 | 3,000 |
| Pro | Unlimited | 50,000 |

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No guests to invite" | Add email addresses to guests |
| "Failed to send" | Check API key in `.env.local` |
| Emails not received | Check spam folder, verify domain |
| Some failed | Check console (F12) for details |

## 💡 Pro Tips

- 🎯 **Test first**: Send to yourself before bulk sending
- 🔍 **Use search**: Filter guests before selecting
- ⏱️ **Be patient**: Large lists take 2-3 minutes
- 📊 **Check dashboard**: Monitor in Resend dashboard
- 🔄 **Resend**: Can send again to failed recipients

## 📱 Email Preview

```
Subject: Invitation: [Event Title]

Hello [Guest Name],

You're invited to: [Event Title]
📅 [Date and Time]
📍 [Venue]

[QR CODE IMAGE]

Your code: [ABC123]

Attachment: [Name]-qrcode.svg
```

## 🎓 Common Workflows

### Workflow 1: Initial Invitations
```
1. Import all 650 guests
2. Send Invitations → Send to All
3. Wait for completion
4. Check results
```

### Workflow 2: VIP Only
```
1. Search "VIP"
2. Select All
3. Send to Selected
4. Confirm
```

### Workflow 3: Resend Failed
```
1. Note failed emails from console
2. Search for those guests
3. Select them
4. Send to Selected
```

### Workflow 4: Late Additions
```
1. Add new guests
2. Select only new guests
3. Send to Selected
4. Confirm
```

## 📞 Quick Links

- **Setup Guide**: `EMAIL_INVITATIONS_SETUP.md`
- **Full Tutorial**: `HOW_TO_USE_EMAIL_INVITATIONS.md`
- **Feature Details**: `BULK_EMAIL_FEATURE_SUMMARY.md`
- **Resend Dashboard**: [resend.com/dashboard](https://resend.com/dashboard)
- **Resend Docs**: [resend.com/docs](https://resend.com/docs)

## ⚙️ Configuration

### Default Settings
```typescript
fromEmail: "onboarding@resend.dev"  // Test email
fromName: "GuestPass Events"
batchSize: 10                        // Emails per batch
batchDelay: 1000ms                   // Delay between batches
```

### Customize
Edit `app/api/send-invitations/route.ts`:
- Line ~30: Change `fromEmail` and `fromName`
- Line ~90-170: Customize email HTML template
- Line ~180: Change email subject

## 🎨 Email Customization

Want to customize the email? Edit these sections:

```typescript
// Subject line (line ~180)
subject: `Invitation: ${eventTitle}`

// Email colors (line ~100-120)
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

// Email content (line ~130-160)
<p>Your custom message here</p>
```

## 📊 Success Indicators

✅ **Everything Working When:**
- Button shows loading spinner during send
- Success notification appears after completion
- Console shows "Sent X invitation(s)"
- Resend dashboard shows delivered emails
- Guests receive emails with QR codes

❌ **Something Wrong When:**
- Error notification appears
- Console shows errors (F12)
- Resend dashboard shows bounces
- Guests don't receive emails

## 🔐 Security Checklist

- [x] API key in `.env.local` (not committed)
- [x] Server-side sending (API key not exposed)
- [x] Email validation before sending
- [x] Confirmation dialogs prevent accidents
- [x] Rate limiting through batching

## 📈 Performance Metrics

| Guests | Time | Batches |
|--------|------|---------|
| 10 | ~2 sec | 1 |
| 50 | ~10 sec | 5 |
| 100 | ~20 sec | 10 |
| 650 | ~2-3 min | 65 |

---

**Print this page for quick reference! 📄**