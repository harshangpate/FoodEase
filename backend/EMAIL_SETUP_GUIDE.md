# Email Configuration Guide for FoodEase

This guide explains how to configure the email system for FoodEase to enable sending welcome emails, order notifications, invoices, and monthly reports.

## Understanding the Email Settings

In your `.env` file, you need to configure these email-related variables:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### What Each Setting Means:

- **EMAIL_HOST**: The SMTP server hostname (e.g., smtp.gmail.com for Gmail)
- **EMAIL_PORT**: The port to connect to (typically 587 for TLS or 465 for SSL)
- **EMAIL_SECURE**: Set to 'true' if using port 465 (SSL), 'false' for port 587 (TLS)
- **EMAIL_USER**: Your email address that will send the emails
- **EMAIL_PASS**: Your email password or app password (for Gmail)
- **FRONTEND_URL**: The URL of your frontend application (for links in emails)

## Setting Up with Gmail

If you're using Gmail for sending emails (recommended for testing):

1. Create a Gmail account or use an existing one for your application.

2. Enable 2-Step Verification:
   - Go to your Google Account settings
   - Select Security
   - Under "Signing in to Google," select 2-Step Verification and turn it on

3. Create an App Password:
   - After enabling 2-Step Verification, go back to the Security page
   - Under "Signing in to Google," select App passwords
   - Select "Mail" as the app and "Other" as the device (name it "FoodEase")
   - Click "Generate"
   - Google will display a 16-character password - **copy this password**

4. Update your `.env` file:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

## Testing Your Configuration

To test if your email configuration is working:

1. Ensure your backend server is running
2. Try registering a new user with a valid email
3. Check if you receive a welcome email
4. Alternatively, go to the profile page and request a monthly report

## Troubleshooting

If emails are not being sent:

1. **Check Console Logs**: Look for error messages in the server console
2. **Verify Credentials**: Ensure your email and password are correct
3. **Check SMTP Settings**: Verify the host and port settings
4. **Gmail Security**: For Gmail, ensure less secure apps are allowed or you're using an app password
5. **Firewall Issues**: Make sure your server can connect to the SMTP port

## Email Templates

The FoodEase application includes several email templates:

1. **Welcome Emails**: Sent when a user registers
2. **Order Status Emails**: Sent when an order status changes
3. **Invoice Emails**: Sent after payment verification with PDF attachment
4. **Monthly Report Emails**: Sent on the 1st of each month with PDF attachment

These templates are defined in `backend/utils/email/emailService.js` and can be customized as needed.

## Production Considerations

For production deployment:

1. Consider using a transactional email service like:
   - SendGrid
   - Mailgun
   - Amazon SES
   
2. Update the `.env` file with the appropriate production credentials

3. Set up proper email monitoring and delivery tracking

4. Implement email queue handling for reliability