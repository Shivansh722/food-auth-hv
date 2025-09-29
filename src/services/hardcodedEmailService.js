import emailjs from '@emailjs/browser';

// Hardcoded EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_ckr1f1y',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'email_verify',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '4-DuO-NHqzAQ1VpK6'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

/**
 * Generate a secure password reset token
 */
function generateResetToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Store reset token in localStorage (in production, use a proper database)
 */
function storeResetToken(email, token) {
  const resetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
  resetTokens[email] = {
    token: token,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  localStorage.setItem('passwordResetTokens', JSON.stringify(resetTokens));
}

/**
 * Validate reset token
 */
export function validateResetToken(email, token) {
  const resetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
  const tokenData = resetTokens[email];
  
  if (!tokenData) {
    return { valid: false, error: 'No reset token found for this email' };
  }
  
  if (Date.now() > tokenData.expires) {
    return { valid: false, error: 'Reset token has expired' };
  }
  
  if (tokenData.token !== token) {
    return { valid: false, error: 'Invalid reset token' };
  }
  
  return { valid: true };
}

/**
 * Clear used reset token
 */
export function clearResetToken(email) {
  const resetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
  delete resetTokens[email];
  localStorage.setItem('passwordResetTokens', JSON.stringify(resetTokens));
}

/**
 * Send password reset email using EmailJS
 */
export async function sendPasswordResetEmail(email) {
  try {
    console.log('🚀 Starting hardcoded password reset email for:', email);
    
    // Generate reset token
    const resetToken = generateResetToken();
    console.log('🔑 Generated reset token:', resetToken);
    
    // Store token
    storeResetToken(email, resetToken);
    console.log('💾 Stored reset token for:', email);
    
    // Create reset link
    const resetLink = `${window.location.origin}/admin/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
    console.log('🔗 Reset link:', resetLink);
    
    // Email template parameters
    const templateParams = {
      to_email: email,
      to_name: email.split('@')[0], // Use email prefix as name
      reset_link: resetLink,
      company_name: 'HyperVerge',
      expires_in: '24 hours',
      from_name: 'HyperVerge Admin System'
    };
    
    console.log('📧 Sending email with params:', templateParams);
    
    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );
    
    console.log('✅ Email sent successfully:', response);
    
    return {
      success: true,
      message: 'Password reset email sent successfully!',
      resetToken: resetToken // For testing purposes
    };
    
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
      details: error
    };
  }
}

/**
 * Send admin invitation email
 */
export async function sendAdminInvitationEmail(email, tempPassword) {
  try {
    console.log('🚀 Starting admin invitation email for:', email);
    
    // Create login link
    const loginLink = `${window.location.origin}/admin/login`;
    console.log('🔗 Login link:', loginLink);
    
    // Email template parameters for invitation
    const templateParams = {
      to_email: email,
      to_name: email.split('@')[0],
      temp_password: tempPassword,
      login_link: loginLink,
      company_name: 'HyperVerge',
      from_name: 'HyperVerge Admin System',
      message: `You have been invited as an admin. Your temporary password is: ${tempPassword}. Please log in and change your password immediately.`
    };
    
    console.log('📧 Sending invitation email with params:', templateParams);
    
    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );
    
    console.log('✅ Invitation email sent successfully:', response);
    
    return {
      success: true,
      message: 'Admin invitation email sent successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error sending admin invitation email:', error);
    
    return {
      success: false,
      error: error.message || 'Failed to send admin invitation email',
      details: error
    };
  }
}

/**
 * Test email service
 */
export async function testEmailService() {
  try {
    console.log('🧪 Testing hardcoded email service...');
    
    const testEmail = 'test@example.com';
    const result = await sendPasswordResetEmail(testEmail);
    
    console.log('🧪 Test result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Email service test failed:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

export default {
  sendPasswordResetEmail,
  sendAdminInvitationEmail,
  validateResetToken,
  clearResetToken,
  testEmailService
};