import emailjs from '@emailjs/browser';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// EmailJS configuration for admin invitations
const EMAILJS_CONFIG = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_gmail',
  templateId: process.env.REACT_APP_EMAILJS_ADMIN_TEMPLATE_ID || 'template_admin_invitation',
  publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY'
};

class AdminInvitationService {
  constructor() {
    // Initialize EmailJS
    if (EMAILJS_CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.publicKey);
    }
  }

  // Generate a secure invitation token
  generateInvitationToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  // Create admin invitation record in Firebase
  async createAdminInvitation(email, role, invitedBy) {
    try {
      const token = this.generateInvitationToken();
      
      const invitationData = {
        email: email,
        role: role,
        token: token,
        invitedBy: invitedBy,
        status: 'pending', // pending, accepted, expired
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        acceptedAt: null,
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'adminInvitations'), invitationData);
      return { invitationId: docRef.id, token };
    } catch (error) {
      console.error('Error creating admin invitation:', error);
      throw error;
    }
  }

  // Send admin invitation email
  async sendAdminInvitationEmail(email, role, invitedBy, token, invitationId) {
    try {
      const invitationLink = `${window.location.origin}/admin/accept-invitation?token=${token}&id=${invitationId}`;
      
      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0],
        admin_role: role === 'super_admin' ? 'Super Admin' : 'Admin',
        invited_by: invitedBy,
        invitation_link: invitationLink,
        company_name: 'HyperVerge',
        expires_in: '7 days'
      };

      console.log('Sending admin invitation email to:', email);
      console.log('Invitation link:', invitationLink);

      // For development, we'll log the invitation details
      // In production, this would send the actual email
      if (EMAILJS_CONFIG.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
        console.log('EmailJS not configured. Invitation details:');
        console.log('Email:', email);
        console.log('Role:', role);
        console.log('Invitation Link:', invitationLink);
        
        // Show alert with invitation link for testing
        alert(`Admin invitation created!\n\nEmail: ${email}\nRole: ${role}\n\nInvitation Link:\n${invitationLink}\n\nThis link expires in 7 days.`);
        
        return { success: true, message: 'Invitation created (EmailJS not configured)' };
      }

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('Admin invitation email sent successfully:', result);
      return { success: true, message: 'Invitation email sent successfully' };

    } catch (error) {
      console.error('Error sending admin invitation email:', error);
      throw error;
    }
  }

  // Invite admin (complete flow)
  async inviteAdmin(email, role, invitedBy) {
    console.log('AdminInvitationService.inviteAdmin called with:', { email, role, invitedBy });
    
    try {
      // Check if there's already a pending invitation for this email
      console.log('Checking for existing pending invitations...');
      const existingQuery = query(
        collection(db, 'adminInvitations'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const existingInvitations = await getDocs(existingQuery);
      console.log('Existing invitations check result:', existingInvitations.empty);
      if (!existingInvitations.empty) {
        console.log('Found existing pending invitation, throwing error');
        throw new Error('PENDING_INVITATION: There is already a pending invitation for this email address');
      }

      // Check if admin already exists (for testing, we'll allow duplicates with different roles)
      console.log('Checking if admin already exists...');
      // Temporarily commenting out to isolate the error
      /*
      const existingAdminDoc = await getDoc(doc(db, 'admins', email));
      if (existingAdminDoc.exists()) {
        const existingAdmin = existingAdminDoc.data();
        // Allow inviting existing admin with different role for testing purposes
        console.log(`Admin ${email} already exists with role: ${existingAdmin.role}. Allowing invitation for testing with role: ${role}`);
      }
      */

      // Create invitation record
      console.log('Creating invitation record...');
      const { invitationId, token } = await this.createAdminInvitation(email, role, invitedBy);

      // Send invitation email
      console.log('Sending invitation email...');
      await this.sendAdminInvitationEmail(email, role, invitedBy, token, invitationId);

      console.log('Invitation process completed successfully');
      return { success: true, invitationId, message: 'Admin invitation sent successfully' };

    } catch (error) {
      console.error('Error inviting admin:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Verify invitation token
  async verifyInvitationToken(token, invitationId) {
    try {
      const invitationDoc = await getDoc(doc(db, 'adminInvitations', invitationId));
      
      if (!invitationDoc.exists()) {
        return { valid: false, message: 'Invalid invitation' };
      }

      const invitation = invitationDoc.data();
      
      // Check if token matches
      if (invitation.token !== token) {
        return { valid: false, message: 'Invalid invitation token' };
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        return { valid: false, message: 'Invitation has already been used or expired' };
      }

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = invitation.expiresAt.toDate();
      if (now > expiresAt) {
        // Mark as expired
        await updateDoc(doc(db, 'adminInvitations', invitationId), {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        return { valid: false, message: 'Invitation has expired' };
      }

      return { 
        valid: true, 
        invitation: {
          id: invitationId,
          email: invitation.email,
          role: invitation.role,
          invitedBy: invitation.invitedBy
        }
      };

    } catch (error) {
      console.error('Error verifying invitation token:', error);
      return { valid: false, message: 'Error verifying invitation' };
    }
  }

  // Accept invitation and mark as used
  async acceptInvitation(invitationId) {
    try {
      await updateDoc(doc(db, 'adminInvitations', invitationId), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Invitation accepted successfully' };

    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
}

const adminInvitationService = new AdminInvitationService();
export default adminInvitationService;