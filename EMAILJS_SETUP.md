# EmailJS Setup Guide for Real Email Sending

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Create Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose "Gmail" (recommended) or your preferred email provider
4. Follow the setup wizard to connect your email account
5. Note down the **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates" in EmailJS dashboard
2. Click "Create New Template"
3. Use this template content:

```html
Subject: Verify your email for {{company_name}} FoodAuth

Hello {{to_name}},

Please click the link below to verify your email address:

{{verification_url}}

This link will expire in 30 minutes.

Best regards,
{{company_name}} Team
```

4. Save the template and note down the **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to "Account" → "General" in EmailJS dashboard
2. Copy your **Public Key** (e.g., `user_abcdef123456`)

### Step 5: Update Environment Variables
1. Open the `.env` file in your project root
2. Replace these values with your actual EmailJS credentials:

```env
REACT_APP_EMAILJS_SERVICE_ID=your_service_id_here
REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id_here
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### Step 6: Restart Development Server
1. Stop the current server (Ctrl+C)
2. Run `npm start` again
3. Test the email verification flow

## Testing
1. Go to your app at http://localhost:3000
2. Click "Use Email Instead"
3. Enter your email address
4. Click "Send Verification Email"
5. Check your email inbox for the verification email
6. Click the verification link

## Troubleshooting

### Not receiving emails?
- Check your spam/junk folder
- Verify your EmailJS service is properly connected
- Make sure the template variables match exactly
- Check the browser console for error messages

### Template variables not working?
Make sure your EmailJS template includes these exact variables:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{verification_url}}` - Verification link
- `{{company_name}}` - Company name (HyperVerge)
- `{{app_name}}` - App name (FoodAuth)

### Still having issues?
1. Check the browser console for detailed error messages
2. Verify your EmailJS account limits (free accounts have monthly limits)
3. Make sure your email service is properly authenticated

## Free Account Limits
- 200 emails per month
- Perfect for development and testing
- Upgrade to paid plan for production use

---

**Need help?** Check the EmailJS documentation at https://www.emailjs.com/docs/