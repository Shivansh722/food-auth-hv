import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import userProfileService from './userProfileService';

// EmailJS configuration - get these from https://www.emailjs.com/
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_gmail',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_email_verification',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY'
};

class EmailService {
  constructor() {
    // Initialize EmailJS
    if (EMAILJS_CONFIG.publicKey !== 'your_public_key') {
      emailjs.init(EMAILJS_CONFIG.publicKey);
    }
  }

  // Generate a verification token
  generateVerificationToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Create verification record in Firebase
  async createVerificationRecord(email, token) {
    try {
      const verificationData = {
        email: email,
        token: token,
        verified: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      };

      const docRef = await addDoc(collection(db, 'emailVerifications'), verificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating verification record:', error);
      throw error;
    }
  }

  // Send verification email
  async sendVerificationEmail(email, token = null, verificationId = null) {
    try {
      // If token and verificationId are not provided, generate them
      if (!token) {
        token = this.generateVerificationToken();
      }
      
      if (!verificationId) {
        verificationId = await this.createVerificationRecord(email, token);
      }

      // Use current window location for both development and production
      const baseUrl = window.location.origin;
      const verificationUrl = `${baseUrl}/verify?token=${token}&id=${verificationId}`;
      
      console.log('Generated verification URL:', verificationUrl);
      
      // Template parameters matching our EmailJS template
      const templateParams = {
        email: email,
        user_name: email.split('@')[0], // Extract name from email
        verification_url: verificationUrl,
        reply_to: 'noreply@hyperverge.co'
      };

      // Check if EmailJS is properly configured
      if (EMAILJS_CONFIG.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        // EmailJS not configured - provide setup instructions
        console.log('⚠️ EmailJS not configured. Email would be sent to:', email);
        console.log('🔗 Verification URL:', verificationUrl);
        console.log('📧 To enable real emails, follow these steps:');
        console.log('1. Go to https://www.emailjs.com/ and create a free account');
        console.log('2. Create an email service (Gmail recommended)');
        console.log('3. Create an email template with variables: {{user_name}}, {{verification_url}}, {{reply_to}}');
        console.log('4. Update the .env file with your EmailJS credentials:');
        console.log('   - REACT_APP_EMAILJS_SERVICE_ID=your_service_id');
        console.log('   - REACT_APP_EMAILJS_TEMPLATE_ID=your_template_id');
        console.log('   - REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key');
        console.log('5. Restart the development server');
        
        // Show setup instructions and verification URL
        const message = `📧 EmailJS Setup Required!\n\nFor testing, copy this verification URL:\n${verificationUrl}\n\nTo enable real emails:\n1. Visit https://www.emailjs.com/\n2. Create account & email service\n3. Create email template (see EMAILJS_TEMPLATE_CONFIG.md)\n4. Update .env file with credentials\n5. Restart server\n\nSee EMAILJS_SETUP.md for detailed instructions.`;
        alert(message);
        
        return { success: true, verificationUrl, verificationId, demoMode: true };
      }

      // Send actual email using EmailJS
      console.log('📧 Sending verification email to:', email);
      console.log('🔗 Verification URL:', verificationUrl);
      
      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log('✅ Email sent successfully:', result);
      return { success: true, result, verificationUrl, verificationId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      
      // Provide fallback verification URL even if email fails
      const verificationUrl = `${window.location.origin}/verify?token=${token}&id=${verificationId}`;
      const message = `⚠️ Email sending failed, but you can still verify using this URL:\n${verificationUrl}\n\nError: ${error.message}`;
      alert(message);
      
      return { success: false, error: error.message, verificationUrl, verificationId };
    }
  }

  // Verify token and mark as verified
  async verifyToken(token, verificationId) {
    try {
      console.log('=== Verify Token Debug ===');
      console.log('Token:', token);
      console.log('Verification ID:', verificationId);
      
      const docRef = doc(db, 'emailVerifications', verificationId);
      console.log('Fetching document from Firestore...');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Document not found in Firestore');
        throw new Error('Verification record not found');
      }

      const data = docSnap.data();
      console.log('Document data:', data);
      
      // Check if token matches
      if (data.token !== token) {
        throw new Error('Invalid verification token');
      }

      // Check if already verified
      if (data.verified) {
        throw new Error('Email already verified');
      }

      // Check if expired
      const now = new Date();
      const expiresAt = data.expiresAt.toDate();
      if (now > expiresAt) {
        throw new Error('Verification token has expired');
      }

      // Domain restriction removed for testing with personal emails

      // Mark as verified
      await updateDoc(docRef, {
        verified: true,
        verifiedAt: serverTimestamp()
      });

      return {
        success: true,
        email: data.email,
        verifiedAt: new Date()
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      
      // Provide more specific error messages for common Firebase issues
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        throw new Error('Failed to get document because the client is offline. Please check your internet connection and try again.');
      } else if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please contact support.');
      } else if (error.code === 'not-found') {
        throw new Error('Verification record not found');
      } else {
        throw error;
      }
    }
  }

  // Log successful food authentication
  async logFoodConsumption(email, verificationId) {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Determine meal type based on time
      let mealType = 'snack';
      if (currentHour >= 6 && currentHour < 11) mealType = 'breakfast';
      else if (currentHour >= 11 && currentHour < 16) mealType = 'lunch';
      else if (currentHour >= 16 && currentHour < 22) mealType = 'dinner';

      const foodLog = {
        timestamp: serverTimestamp(),
        email: email,
        userId: email, // Add userId field for consistency
        method: 'email_verification',
        verificationId: verificationId,
        authenticated: true,
        status: 'verified',
        verified: true,
        mealType: mealType,
        hour: currentHour,
        date: now.toISOString().split('T')[0]
      };

      // Store in foodLogs collection
      const foodLogRef = await addDoc(collection(db, 'foodLogs'), foodLog);
      console.log('Food consumption logged in foodLogs:', foodLogRef.id);

      // Also store in verifications collection for dashboard compatibility
      const verificationLog = {
        ...foodLog,
        foodLogId: foodLogRef.id
      };
      
      const verificationRef = await addDoc(collection(db, 'verifications'), verificationLog);
      console.log('Verification logged in verifications:', verificationRef.id);

      // Create or update user profile with verification details
      try {
        await userProfileService.updateVerificationDetails(email, {
          mealType: mealType,
          method: 'email_verification',
          hour: currentHour,
          date: now.toISOString().split('T')[0],
          verificationId: verificationRef.id,
          foodLogId: foodLogRef.id
        });
        console.log('User profile updated for:', email);
      } catch (profileError) {
        console.error('Error updating user profile:', profileError);
        // Don't throw error here to avoid breaking the main flow
      }
      
      return { foodLogId: foodLogRef.id, verificationId: verificationRef.id };
    } catch (error) {
      console.error('Error logging food consumption:', error);
      throw error;
    }
  }

  // Check verification status
  async checkVerificationStatus(verificationId) {
    try {
      const docRef = doc(db, 'emailVerifications', verificationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { verified: false, error: 'Verification record not found' };
      }

      const data = docSnap.data();
      return {
        verified: data.verified,
        email: data.email,
        verifiedAt: data.verifiedAt
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { verified: false, error: error.message };
    }
  }
}

const emailService = new EmailService();
export default emailService;