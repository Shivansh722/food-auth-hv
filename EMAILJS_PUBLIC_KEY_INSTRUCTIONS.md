# Getting Your EmailJS Public Key

## Steps to Get Your Public Key

### 1. Go to EmailJS Dashboard
- Navigate to https://www.emailjs.com/
- Log into your account

### 2. Find Your Public Key
- Go to **"Account"** section (top right menu)
- Look for **"API Keys"** or **"Integration"** section
- Find your **"Public Key"** (also called "User ID")

### 3. Copy the Public Key
- It should look something like: `user_xxxxxxxxxx` or a random string
- Copy this key exactly

### 4. Update Your .env File
Add this line to your `.env` file:
```
REACT_APP_EMAILJS_PUBLIC_KEY=your_actual_public_key_here
```

### 5. Restart Your Development Server
After updating the .env file:
```bash
npm start
```

## Example .env Configuration
```
# EmailJS Configuration for Real Email Sending
REACT_APP_EMAILJS_SERVICE_ID=service_ckrlfy
REACT_APP_EMAILJS_TEMPLATE_ID=template_email_verification
REACT_APP_EMAILJS_PUBLIC_KEY=user_abc123xyz789
```

## Testing
1. After updating the .env file and restarting
2. Try the email verification flow
3. You should receive real emails instead of demo alerts
4. Check your email inbox (including spam folder)

## Troubleshooting
- **Still seeing demo mode**: Check that the public key is correct and .env is updated
- **Email not received**: Check spam folder, verify template ID is correct
- **Error sending**: Check console for specific error messages
- **Template not found**: Verify template ID matches exactly in EmailJS dashboard