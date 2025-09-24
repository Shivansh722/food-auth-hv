import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

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
    try {
      setError('');
      setLoading(true);
      
      console.log('Setting up first admin...');
      
      // Step 1: Create Firestore document
      await setDoc(doc(db, 'admins', process.env.REACT_APP_FIRST_ADMIN_EMAIL), {
        email: process.env.REACT_APP_FIRST_ADMIN_EMAIL,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        isActive: true
      });
      console.log('Firestore admin document created');
      
      // Step 2: Create Firebase Auth account
      const tempPassword = 'TempPassword123!';
      await createUserWithEmailAndPassword(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL, tempPassword);
      console.log('Firebase Auth account created');
      
      // Step 3: Sign out immediately
      await signOut(auth);
      console.log('Signed out');
      
      // Step 4: Send password reset email
      await sendPasswordResetEmail(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL);
      console.log('Password reset email sent to:', process.env.REACT_APP_FIRST_ADMIN_EMAIL);
      
      setSetupComplete(true);
      
    } catch (error) {
      console.error('Setup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        console.log('Account exists, just sending password reset...');
        try {
          await sendPasswordResetEmail(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL);
          console.log('Password reset email sent');
          setSetupComplete(true);
        } catch (resetError) {
          setError('Failed to send password reset email: ' + resetError.message);
        }
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
      navigate('/admin');
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
      <div className="login-container">
        <div className="login-card">
          <h2>✅ Admin Account Created!</h2>
          <p>Password reset email sent to:</p>
          <p><strong>{process.env.REACT_APP_FIRST_ADMIN_EMAIL}</strong></p>
          <p>Check your email and click the reset link to set your password.</p>
          <button 
            className="secondary-button"
            onClick={() => setSetupComplete(false)}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🍽️ Admin Login</h1>
          <p>Food Authentication System</p>
        </div>

        {/* Debug/Setup Section */}
        <div className="setup-section">
          <button 
            className="setup-button"
            onClick={setupFirstAdmin}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Setup First Admin Account'}
          </button>
          <p>Click this button to manually create and send password reset email</p>
        </div>

        <hr />

        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder={`admin@hyperverge.co`}
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
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="login-footer">
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