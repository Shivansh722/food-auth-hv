# EmailJS Template Configuration

## Template Setup Instructions

### 1. Go to EmailJS Dashboard
- Navigate to https://www.emailjs.com/
- Go to **Email Templates** section
- Click **"Create New Template"**

### 2. Template Settings
```
Template Name: Email Verification
Template ID: template_email_verification
```

### 3. Email Configuration

#### Subject Line:
```
Verify Your Email - HyperVerge FoodAuth
```

#### From Name:
```
HyperVerge FoodAuth
```

#### Reply To:
```
{{reply_to}}
```

### 4. Email Content (HTML)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
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
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
        .verification-code {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Email Verification</h1>
        <p>HyperVerge FoodAuth</p>
    </div>
    
    <div class="content">
        <h2>Hello {{user_name}}!</h2>
        
        <p>Thank you for registering with HyperVerge FoodAuth. To complete your registration and secure your account, please verify your email address.</p>
        
        <p><strong>Click the button below to verify your email:</strong></p>
        
        <div style="text-align: center;">
            <a href="{{verification_url}}" class="button">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <div class="verification-code">{{verification_url}}</div>
        
        <p><strong>⏰ Important:</strong> This verification link will expire in <strong>24 hours</strong> for security reasons.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <h3>🛡️ Security Information</h3>
        <ul>
            <li>This email was sent because someone requested email verification for this address</li>
            <li>If you didn't request this verification, you can safely ignore this email</li>
            <li>Your account will remain unverified until you click the verification link</li>
        </ul>
        
        <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
        <p style="word-break: break-all; color: #667eea;">{{verification_url}}</p>
    </div>
    
    <div class="footer">
        <p>Best regards,<br>
        <strong>HyperVerge FoodAuth Team</strong></p>
        
        <p>This is an automated email. Please do not reply to this message.</p>
        
        <p style="font-size: 12px; color: #999;">
            © 2024 HyperVerge. All rights reserved.
        </p>
    </div>
</body>
</html>
```

### 5. Template Variables

Make sure these variables are properly configured in your template:

- `{{user_name}}` - The user's name or email
- `{{verification_url}}` - The complete verification URL
- `{{reply_to}}` - Reply-to email address (optional)

### 6. Test Template

After creating the template:
1. Use the **"Test"** feature in EmailJS
2. Fill in sample values for the variables
3. Send a test email to yourself
4. Verify the formatting and links work correctly

### 7. Get Template ID

After saving the template:
1. Copy the **Template ID** (should be `template_email_verification`)
2. Update your `.env` file with this ID
3. Make sure it matches the ID in your code

### 8. Template Variables in Code

Your emailService.js should send these parameters:
```javascript
{
  user_name: userEmail, // or actual user name
  verification_url: verificationUrl,
  reply_to: 'noreply@hyperverge.co' // optional
}
```

## Next Steps

1. Create this template in EmailJS dashboard
2. Test the template with sample data
3. Copy the Template ID to your `.env` file
4. Test the complete email flow in your application

## Troubleshooting

- **Template not found**: Check the Template ID matches exactly
- **Variables not showing**: Ensure variable names match exactly (case-sensitive)
- **Styling issues**: Test the HTML in EmailJS preview before saving
- **Links not working**: Verify the verification_url is complete and valid