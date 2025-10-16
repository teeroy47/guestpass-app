# MailerSend Template Variables Reference

## Quick Reference

When creating your email template in MailerSend, use these variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{$guest_name}` | Guest's full name | "John Smith" |
| `{$event_title}` | Event name/title | "Annual Gala 2024" |
| `{$event_date}` | Formatted date and time | "Friday, March 15, 2024, 18:00" |
| `{$event_venue}` | Event location | "Grand Ballroom, City Hotel" |
| `{$unique_code}` | Guest's check-in code | "ABC123XYZ" |
| `{$from_name}` | Sender organization name | "GuestPass Events" |

## QR Code Attachment

The QR code is attached as an inline image. Use this in your template:

```html
<img src="cid:qrcode" alt="Your QR Code" />
```

**Important:** 
- The `cid:qrcode` is the content ID for the attached QR code
- Don't change "qrcode" - it must match exactly
- The QR code is sent as an SVG file

## Example Template Usage

### Basic Text Usage

```html
<p>Hello {$guest_name},</p>
<p>You're invited to {$event_title}</p>
<p>Date: {$event_date}</p>
<p>Location: {$event_venue}</p>
<p>Your code: {$unique_code}</p>
```

### Styled Usage

```html
<div class="greeting">
  <h1>Hello {$guest_name}! 👋</h1>
</div>

<div class="event-card">
  <h2>{$event_title}</h2>
  <div class="event-info">
    <p><strong>📅 When:</strong> {$event_date}</p>
    <p><strong>📍 Where:</strong> {$event_venue}</p>
  </div>
</div>

<div class="qr-section">
  <h3>Your Personal QR Code</h3>
  <img src="cid:qrcode" alt="QR Code for {$guest_name}" />
  <p class="code">Code: <span>{$unique_code}</span></p>
</div>

<div class="footer">
  <p>Sent by {$from_name}</p>
</div>
```

## Variable Formatting

### In MailerSend Template Editor:

- Use curly braces with dollar sign: `{$variable_name}`
- Variables are case-sensitive
- No spaces inside braces: `{$guest_name}` ✅ `{ $guest_name }` ❌
- Use underscores, not hyphens: `{$guest_name}` ✅ `{$guest-name}` ❌

### Testing Variables:

In MailerSend's template preview, you can set test values:

```json
{
  "guest_name": "John Doe",
  "event_title": "Test Event",
  "event_date": "Monday, January 1, 2024, 19:00",
  "event_venue": "Test Venue",
  "unique_code": "TEST123",
  "from_name": "Test Organization"
}
```

## Conditional Content

If you want to show/hide content based on variables:

### Show venue only if provided:

```html
{{#if event_venue}}
  <p>📍 Location: {$event_venue}</p>
{{/if}}
```

**Note:** The API always sends `event_venue`, but it may be "To be announced" if not set.

## Common Patterns

### Personalized Greeting

```html
<h1>Hi {$guest_name}! 🎉</h1>
```

### Event Summary Box

```html
<div style="background: #f0f0f0; padding: 20px; border-radius: 8px;">
  <h2 style="margin-top: 0;">{$event_title}</h2>
  <p><strong>Date:</strong> {$event_date}</p>
  <p><strong>Venue:</strong> {$event_venue}</p>
</div>
```

### QR Code with Instructions

```html
<div style="text-align: center; padding: 20px;">
  <h3>Your Check-in QR Code</h3>
  <img src="cid:qrcode" alt="QR Code" style="max-width: 300px; border: 2px solid #ddd; padding: 10px;" />
  <p>Unique Code: <strong style="font-family: monospace; font-size: 18px;">{$unique_code}</strong></p>
  <p style="color: #666; font-size: 14px;">Show this QR code at the entrance</p>
</div>
```

### Footer with Sender

```html
<div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
  <p>This invitation was sent by {$from_name}</p>
  <p>If you have questions, please contact the event organizer.</p>
</div>
```

## Troubleshooting

### Variable Not Showing

❌ **Problem:** Variable appears as `{$guest_name}` in email

✅ **Solution:** 
- Check spelling matches exactly
- Ensure variable is defined in template settings
- Verify API is sending the variable

### QR Code Not Appearing

❌ **Problem:** QR code doesn't show or shows broken image

✅ **Solution:**
- Use exactly `cid:qrcode` (case-sensitive)
- Don't use `http://` or `https://`
- Check that image tag is properly closed: `<img src="cid:qrcode" />`

### Formatting Issues

❌ **Problem:** Variables break layout

✅ **Solution:**
- Wrap variables in appropriate HTML tags
- Use CSS to control text overflow
- Test with long values (e.g., very long event titles)

## Best Practices

1. **Always provide fallback text** for optional fields
2. **Test with various data lengths** (short and long names, titles)
3. **Use semantic HTML** for better email client compatibility
4. **Keep QR code size reasonable** (300-400px recommended)
5. **Make unique code prominent** for manual entry if QR fails
6. **Include sender info** for trust and recognition
7. **Test on multiple email clients** (Gmail, Outlook, Apple Mail)

## Example Complete Template

See `MAILERSEND_SETUP.md` for a complete, production-ready template example.

## Need Help?

- **Template not working?** Check the MailerSend activity log
- **Variables not substituting?** Verify variable names match exactly
- **QR code issues?** Ensure you're using `cid:qrcode`
- **Styling problems?** Test with inline CSS (most compatible)