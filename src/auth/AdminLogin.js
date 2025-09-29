import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { sendPasswordResetEmail } from '../services/hardcodedEmailService';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Manual first admin setup
  const setupFirstAdmin = async () => {
    const FIRST_ADMIN_EMAIL = 'shivansh.c@hyperverge.co'; // Hardcoded for now
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Setting up first admin for:', FIRST_ADMIN_EMAIL);
      
      // Step 1: Create Firestore document
      await setDoc(doc(db, 'admins', FIRST_ADMIN_EMAIL), {
        email: FIRST_ADMIN_EMAIL,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        isActive: true
      });
      console.log('Firestore admin document created');
      
      // Step 2: Create Firebase Auth account
      const tempPassword = 'TempPassword123!';
      await createUserWithEmailAndPassword(auth, FIRST_ADMIN_EMAIL, tempPassword);
      console.log('Firebase Auth account created');
      
      // Step 3: Sign out immediately
      await signOut(auth);
      console.log('Signed out');
      
      // Step 4: Send password reset email using hardcoded service
      const emailResult = await sendPasswordResetEmail(FIRST_ADMIN_EMAIL);
      if (emailResult.success) {
        console.log('Password reset email sent to:', FIRST_ADMIN_EMAIL);
      } else {
        throw new Error(emailResult.error);
      }
      
      setSetupComplete(true);
      
    } catch (error) {
      console.error('Setup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError(
          "A super admin account already exists. Please contact the super admin to add you as an admin. " +
          "If you are the super admin and forgot your password, use 'Forgot Password?' to reset it."
        );
      } else {
        setError('Setup failed: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      
      // Get admin data to determine role and redirect accordingly
      const adminDoc = await getDoc(doc(db, 'admins', email));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        if (adminData.role === 'super_admin') {
          navigate('/super-admin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        navigate('/admin/dashboard'); // Default fallback
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }

    try {
      setError('');
      await resetPassword(email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    }
  };

  if (setupComplete) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          {/* Back to Home Button */}
          <div style={{ marginBottom: '20px' }}>
            <Link 
              to="/" 
              style={{
                color: 'rgba(0,0,0,0.6)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              ← Back to Home
            </Link>
          </div>

          <h2 style={{ color: '#212529', marginBottom: '20px' }}>✅ Admin Account Created!</h2>
          <p style={{ color: 'rgba(0,0,0,0.7)', marginBottom: '15px' }}>Password reset email sent to:</p>
          <p style={{ color: '#212529', fontWeight: '500', marginBottom: '15px' }}><strong>shivansh.c@hyperverge.co</strong></p>
          <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.9rem', marginBottom: '20px' }}>Check your email and click the reset link to set your password.</p>
          
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button 
              className="auth-button secondary"
              onClick={() => setSetupComplete(false)}
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
            <Link 
              to="/" 
              className="auth-button"
              style={{ 
                textDecoration: 'none', 
                textAlign: 'center',
                display: 'block'
              }}
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back to Home Button */}
        <div style={{ marginBottom: '20px' }}>
          <Link 
            to="/" 
            style={{
              color: 'rgba(0,0,0,0.6)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            ← Back to Home
          </Link>
        </div>

        <div className="auth-header">
          <h1 style={{ color: '#212529' }}>🍽️ Admin Login</h1>
          <p style={{ color: 'rgba(0,0,0,0.7)' }}>Food Authentication System</p>
        </div>

        {/* Setup Section */}
        <div style={{ 
          background: 'rgba(0,0,0,0.03)', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <button 
            className="auth-button"
            onClick={setupFirstAdmin}
            disabled={loading}
            style={{ 
              marginBottom: '10px',
              fontSize: '0.9rem',
              padding: '10px 20px'
            }}
          >
            {loading ? 'Setting up...' : 'Setup First Admin Account'}
          </button>
          <p style={{ 
            margin: '0', 
            fontSize: '0.8rem', 
            color: 'rgba(0,0,0,0.6)' 
          }}>
            Click this button to manually create and send password reset email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hyperverge.co"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="auth-footer">
            <button
              type="button"
              className="link-button"
              onClick={handleResetPassword}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;