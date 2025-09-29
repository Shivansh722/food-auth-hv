import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import emailService from '../services/emailService';
import { db } from '../firebase/config';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const verificationId = searchParams.get('id');

      console.log('=== Email Verification Debug ===');
      console.log('Current URL:', window.location.href);
      console.log('Token:', token);
      console.log('Verification ID:', verificationId);
      console.log('Search params:', Object.fromEntries(searchParams));

      if (!token || !verificationId) {
        console.error('Missing required parameters:', { token, verificationId });
        setVerificationStatus('error');
        setMessage('Invalid verification link. Missing token or verification ID.');
        return;
      }

      try {
        setMessage('Verifying your email...');
        console.log('Starting verification process...');
        
        const result = await emailService.verifyToken(token, verificationId);
        console.log('Verification result:', result);
        
        if (result.success) {
          console.log('Verification successful for:', result.email);
          setVerificationStatus('success');
          setUserEmail(result.email);
          setMessage(`Email verified successfully! Welcome, ${result.email}`);
          
          // Log food consumption
          console.log('Logging food consumption...');
          await emailService.logFoodConsumption(result.email, verificationId);
          
          // Track verification analytics
          console.log('Tracking verification analytics...');
          await trackVerificationAnalytics(result.email);
          console.log('Verification process completed successfully');
        }
      } catch (error) {
        setVerificationStatus('error');
        console.error('Verification error:', error);
        
        // Provide specific error messages based on error type
        if (error.message.includes('offline') || error.message.includes('network')) {
          setMessage('Network connection issue. Please check your internet connection and try again.');
        } else if (error.message.includes('Failed to get document')) {
          setMessage('Unable to connect to verification service. Please check your internet connection and try again.');
        } else if (error.message.includes('not found')) {
          setMessage('Verification link is invalid or has expired. Please request a new verification email.');
        } else if (error.message.includes('already verified')) {
          setMessage('This email has already been verified. You can proceed to use the service.');
        } else if (error.message.includes('expired')) {
          setMessage('Verification link has expired. Please request a new verification email.');
        } else {
          setMessage(error.message || 'Verification failed. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Auto-redirect countdown effect
  useEffect(() => {
    if (verificationStatus === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationStatus === 'success' && redirectCountdown === 0) {
      // Redirect to dashboard with user email
      if (userEmail) {
        navigate(`/dashboard?user=${encodeURIComponent(userEmail)}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [verificationStatus, redirectCountdown, navigate, userEmail]);

  // Track verification analytics
  const trackVerificationAnalytics = async (email) => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDate = now.toISOString().split('T')[0];
      const currentWeek = getWeekNumber(now);
      
      // Determine meal type based on time
      let mealType = 'snack';
      if (currentHour >= 6 && currentHour < 11) mealType = 'breakfast';
      else if (currentHour >= 11 && currentHour < 16) mealType = 'lunch';
      else if (currentHour >= 16 && currentHour < 22) mealType = 'dinner';

      // Track verification in user analytics
      const userAnalyticsRef = db.collection('userAnalytics').doc(email);
      const userAnalyticsDoc = await userAnalyticsRef.get();
      
      if (userAnalyticsDoc.exists) {
        const data = userAnalyticsDoc.data();
        const weeklyVerifications = data.weeklyVerifications || {};
        const mealTypeCount = data.mealTypeCount || {};
        const verificationTimes = data.verificationTimes || [];
        
        // Update weekly count
        weeklyVerifications[currentWeek] = (weeklyVerifications[currentWeek] || 0) + 1;
        
        // Update meal type count
        mealTypeCount[mealType] = (mealTypeCount[mealType] || 0) + 1;
        
        // Add verification time
        verificationTimes.push({
          timestamp: now.toISOString(),
          mealType,
          hour: currentHour,
          date: currentDate
        });
        
        // Keep only last 100 verification times
        const recentTimes = verificationTimes.slice(-100);
        
        await userAnalyticsRef.update({
          weeklyVerifications,
          mealTypeCount,
          verificationTimes: recentTimes,
          lastVerification: now.toISOString(),
          totalVerifications: (data.totalVerifications || 0) + 1
        });
      } else {
        // Create new analytics document
        await userAnalyticsRef.set({
          email,
          weeklyVerifications: { [currentWeek]: 1 },
          mealTypeCount: { [mealType]: 1 },
          verificationTimes: [{
            timestamp: now.toISOString(),
            mealType,
            hour: currentHour,
            date: currentDate
          }],
          lastVerification: now.toISOString(),
          totalVerifications: 1,
          createdAt: now.toISOString()
        });
      }
    } catch (error) {
      console.error('Error tracking verification analytics:', error);
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verifying':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="container">
      <div className="logo-section">
        <div className="company-logo">FoodAuth</div>
        <div className="tagline">Email Verification</div>
      </div>

      <div className="verification-container">
        <div className="verification-icon" style={{ fontSize: '5rem', marginBottom: '1rem' }}>
          {getStatusIcon()}
        </div>
        
        <h1 style={{ color: getStatusColor(), marginBottom: '1rem' }}>
          {verificationStatus === 'verifying' && 'Verifying Email...'}
          {verificationStatus === 'success' && 'Verification Successful!'}
          {verificationStatus === 'error' && 'Verification Failed'}
        </h1>

        <div className="verification-message" style={{ 
          color: 'rgba(0,0,0,0.7)', 
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          {message}
        </div>

        {verificationStatus === 'success' && (
          <div className="success-details">
            <div style={{ 
              background: '#d4edda', 
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem',
              color: '#155724'
            }}>
              <strong>🍽️ You're all set!</strong>
              <br />
              Your meal has been logged and you can now access the food area.
              <br />
              <small>User: {userEmail}</small>
            </div>
            
            <div style={{ 
              background: '#cce5ff', 
              border: '1px solid #99ccff',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#0066cc',
              textAlign: 'center'
            }}>
              <strong>📊 Redirecting to your dashboard...</strong>
              <br />
              <div style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{redirectCountdown}</div>
              <small>You'll be automatically taken to your personal dashboard to view your meal analytics</small>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="error-details">
            <div style={{ 
              background: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '2rem',
              color: '#721c24'
            }}>
              <strong>Verification failed</strong>
              <br />
              Please try the authentication process again or contact support if the issue persists.
            </div>
          </div>
        )}

        <Link to="/" className="capture-btn" style={{ 
          display: 'inline-block',
          textDecoration: 'none',
          marginTop: '1rem'
        }}>
          {verificationStatus === 'success' ? '🏠 Return to Home' : '🔄 Try Again'}
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;