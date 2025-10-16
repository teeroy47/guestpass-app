# MailerSend Email Integration Setup Guide

This guide will help you set up MailerSend for sending event invitations with QR codes.

## Prerequisites

- A MailerSend account (sign up at https://www.mailersend.com/)
- Your MailerSend API token
- A verified domain (or use sandbox for testing)

## Step 1: Get Your API Token

1. Log in to your MailerSend dashboard
2. Navigate to **Settings** → **API Tokens**
3. Click **Generate new token**
4. Give it a name (e.g., "GuestPass App")
5. Select the following permissions:
   - **Email**: Full access
   - **Templates**: Read access (if using templates)
6. Copy the generated token

## Step 2: Create Email Template

You need to create a template in MailerSend with the following variables:

### Template Variables

Your template should include these variables (use `{$guest_name}` syntax in MailerSend):

- `{$guest_name}` - The guest's name
- `{$event_title}` - The event title
- `{$event_date}` - Formatted event date and time
- `{$event_venue}` - Event venue/location
- `{$unique_code}` - Guest's unique check-in code
- `{$from_name}` - Sender name

### Template Structure

Here's a suggested template structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .event-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .event-details h2 {
      margin-top: 0;
      color: #667eea;
    }
    .detail-row {
      margin: 10px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .qr-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .qr-section img {
      max-width: 300px;
      height: auto;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
    }
    .unique-code {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
      background: #f3f4f6;
      padding: 10px 20px;
      border-radius: 6px;
      display: inline-block;
      margin: 10px 0;
    }
    .instructions {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 You're Invited!</h1>
  </div>
  
  <div class="content">
    <p>Hello <strong>{$guest_name}</strong>,</p>
    
    <p>You're cordially invited to attend:</p>
    
    <div class="event-details">
      <h2>{$event_title}</h2>
      <div class="detail-row">
        <span class="detail-label">📅 Date:</span>
        <span>{$event_date}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📍 Venue:</span>
        <span>{$event_venue}</span>
      </div>
    </div>
    
    <div class="instructions">
      <strong>📱 Check-in Instructions:</strong>
      <p style="margin: 10px 0 0 0;">Present your QR code below at the event entrance for quick check-in. You can save this image or show it directly from this email.</p>
    </div>
    
    <div class="qr-section">
      <h3 style="margin-top: 0;">Your Personal QR Code</h3>
      <img src="cid:qrcode" alt="Your QR Code" />
      <p>Your unique code: <span class="unique-code">{$unique_code}</span></p>
      <p style="font-size: 14px; color: #666;">Save this QR code to your phone for easy access at the event.</p>
    </div>
    
    <p>We look forward to seeing you at the event!</p>
    
    <div class="footer">
      <p>This invitation was sent by {$from_name}</p>
      <p style="font-size: 12px; color: #999;">If you have any questions, please contact the event organizer.</p>
    </div>
  </div>
</body>
</html>
```

### Creating the Template in MailerSend

1. Go to **Email** → **Templates** in your MailerSend dashboard
2. Click **Create Template**
3. Give it a name (e.g., "Event Invitation with QR Code")
4. Paste the HTML above into the template editor
5. Make sure all variables are properly formatted with `{$variable_name}`
6. Save the template
7. Copy the **Template ID** (you'll need this for the `.env.local` file)

## Step 3: Configure Environment Variables

Update your `.env.local` file with the following values:

```env
# Email Service (MailerSend)
MAILERSEND_API_KEY=your_actual_api_token_here
MAILERSEND_FROM_EMAIL=your-email@yourdomain.com
MAILERSEND_FROM_NAME=GuestPass Events
MAILERSEND_TEMPLATE_ID=your_template_id_here
```

### Configuration Details:

- **MAILERSEND_API_KEY**: Your API token from Step 1
- **MAILERSEND_FROM_EMAIL**: 
  - For testing: Use your verified email in MailerSend sandbox
  - For production: Use an email from your verified domain (e.g., `events@yourdomain.com`)
- **MAILERSEND_FROM_NAME**: The sender name that appears in emails (e.g., "GuestPass Events")
- **MAILERSEND_TEMPLATE_ID**: The template ID from Step 2

## Step 4: Verify Your Domain (Production)

For production use, you need to verify your domain:

1. Go to **Domains** in your MailerSend dashboard
2. Click **Add Domain**
3. Enter your domain name
4. Follow the DNS verification instructions
5. Add the required DNS records to your domain provider
6. Wait for verification (usually takes a few minutes to a few hours)

## Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Create a test event in your app
3. Add a guest with your email address
4. Try sending an invitation from the Event Details dialog
5. Check your email inbox for the invitation

## Troubleshooting

### Common Issues:

1. **"MailerSend API key is not configured"**
   - Make sure you've added `MAILERSEND_API_KEY` to `.env.local`
   - Restart your development server after adding environment variables

2. **"MailerSend template ID is not configured"**
   - Make sure you've added `MAILERSEND_TEMPLATE_ID` to `.env.local`
   - Verify the template ID is correct in your MailerSend dashboard

3. **Emails not being delivered**
   - Check if your domain is verified (for production)
   - For sandbox mode, make sure the recipient email is verified in MailerSend
   - Check the MailerSend activity log for delivery status

4. **Template variables not showing correctly**
   - Verify all variables in your template use the correct syntax: `{$variable_name}`
   - Make sure variable names match exactly (case-sensitive)

5. **QR code not appearing in email**
   - The QR code is attached as an inline image with content ID "qrcode"
   - Make sure your template includes: `<img src="cid:qrcode" alt="Your QR Code" />`

## MailerSend Limits

### Free Tier:
- 12,000 emails per month
- 100 emails per hour
- Email support

### Paid Plans:
- Higher sending limits
- Priority support
- Advanced analytics
- Dedicated IP addresses

## API Rate Limiting

The integration includes built-in rate limiting:
- Emails are sent in batches of 10
- 1-second delay between batches
- This helps avoid hitting MailerSend's rate limits

## Additional Resources

- [MailerSend Documentation](https://developers.mailersend.com/)
- [MailerSend API Reference](https://developers.mailersend.com/api/v1/email.html)
- [MailerSend Templates Guide](https://www.mailersend.com/help/how-to-create-an-email-template)
- [MailerSend Node.js SDK](https://github.com/mailersend/mailersend-nodejs)

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check the server logs for detailed error information
3. Review the MailerSend activity log in your dashboard
4. Contact MailerSend support if the issue is with their service