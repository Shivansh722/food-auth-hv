import React, { useState, useEffect } from 'react';
import emailService from '../services/emailService';

const FallbackAuth = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Check verification status periodically
  useEffect(() => {
    let interval;
    
    if (checkingVerification && verificationId) {
      interval = setInterval(async () => {
        try {
          const status = await emailService.checkVerificationStatus(verificationId);
          
          if (status.verified) {
            setCheckingVerification(false);
            setMessage('Email verified successfully! You can now access the food area.');
            setMessageType('success');
            
            // Call success callback
            setTimeout(() => {
              if (onSuccess) {
                onSuccess(status.email);
              }
            }, 1500);
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkingVerification, verificationId, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsProcessing(true);
    setMessage('Sending verification email...');
    setMessageType('info');

    try {
      const fullEmail = email.trim();
      
      // Send verification email
      const result = await emailService.sendVerificationEmail(fullEmail);
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setEmailSent(true);
        setMessage(`Verification email sent to ${fullEmail}. Please check your inbox and click the verification link to complete authentication.`);
        setMessageType('success');
        
        // Start checking for verification
        setCheckingVerification(true);
      } else {
        throw new Error(result.error || 'Failed to send verification email');
      }
      
    } catch (error) {
      console.error('Email verification error:', error);
      setMessage(error.message || 'Failed to send verification email. Please try again.');
      setMessageType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email.trim()) return;
    
    setIsProcessing(true);
    setMessage('Resending verification email...');
    setMessageType('info');
    
    try {
      const fullEmail = email.trim();
      const result = await emailService.sendVerificationEmail(fullEmail);
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setMessage(`Verification email resent to ${fullEmail}. Please check your inbox.`);
        setMessageType('success');
      } else {
        throw new Error(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage(error.message || 'Failed to resend email. Please try again.');
      setMessageType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fallback-auth-container">
      <div className="fallback-header">
        <h2>🔐 Alternative Authentication</h2>
        <p>Face authentication is currently unavailable. Please use email verification instead.</p>
      </div>

      {!emailSent ? (
        <form onSubmit={handleSubmit} className="fallback-form">
          <div className="email-input-group">
            <label htmlFor="email">Enter your email address:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., john.doe@gmail.com"
              disabled={isProcessing}
            />
          </div>
          
          <div className="fallback-actions">
            <button 
              type="submit" 
              disabled={isProcessing || !email.trim()}
              className="send-btn"
            >
              {isProcessing ? '📧 Sending...' : '📧 Send Verification Email'}
            </button>
          </div>
        </form>
      ) : (
        <div className="verification-waiting">
          <div className="verification-status">
            <div className="status-icon">
              {checkingVerification ? '🔄' : '📧'}
            </div>
            <h3>Email Sent!</h3>
            <p>We've sent a verification link to:</p>
            <strong>{email}</strong>
          </div>
          
          {checkingVerification && (
            <div className="checking-status">
              <div className="spinner">⏳</div>
              <p>Waiting for email verification...</p>
              <small>Click the link in your email to complete authentication</small>
            </div>
          )}
          
          <div className="fallback-actions">
            <button 
              onClick={handleResendEmail}
              disabled={isProcessing}
              className="back-btn"
            >
              {isProcessing ? 'Resending...' : '🔄 Resend Email'}
            </button>
            
            <button 
              onClick={() => {
                setEmailSent(false);
                setCheckingVerification(false);
                setVerificationId(null);
                setMessage('');
                setMessageType('');
              }}
              className="send-btn"
            >
              ✏️ Change Email
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      <div className="fallback-actions" style={{ marginTop: '2rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="back-btn"
          disabled={isProcessing}
        >
          ← Back to Face Authentication
        </button>
      </div>
    </div>
  );
};

export default FallbackAuth;