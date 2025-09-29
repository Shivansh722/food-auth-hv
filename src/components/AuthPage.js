import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import hypervergeService from '../services/hypervergeService';
import FallbackAuth from './FallbackAuth';


const AuthPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [bvnPhotoFile, setBvnPhotoFile] = useState(null);
  const [bvnPhotoBase64, setBvnPhotoBase64] = useState('');
  const [debugInfo, setDebugInfo] = useState({ workflowInputs: null, sdkResult: null });
  const [showFallback, setShowFallback] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Convert file to data URL string (keep full data:image/...;base64,...)
  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // keep full data URL
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setBvnPhotoFile(file);
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        setBvnPhotoBase64(dataUrl); // now stores full data URL
      } catch (err) {
        setMessage('Failed to read file.');
        setMessageType('error');
      }
    } else {
      setBvnPhotoBase64('');
    }
  };

  const startAuthentication = async () => {
    setIsProcessing(true);
    setMessage('Starting face authentication...');
    setMessageType('info');

    try {
      // Mock SDK failure for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate SDK failure
      setMessage('Face authentication service is currently unavailable. Please use alternative authentication.');
      setMessageType('error');
      setIsProcessing(false);
      
      // Show fallback option after a brief delay
      setTimeout(() => {
        setShowFallback(true);
      }, 1500);
      
    } catch (error) {
      setMessage('Authentication service failed. Please use alternative authentication.');
      setMessageType('error');
      setIsProcessing(false);
      setShowFallback(true);
    }
  };

  const logFoodConsumption = async (transactionId, sdkResult) => {
    try {
      const foodLog = {
        timestamp: serverTimestamp(),
        transactionId: transactionId,
        status: sdkResult.status,
        userId: sdkResult.userId || 'unknown',
        matches: sdkResult.matches || 0,
        blockMatches: sdkResult.blockMatches || 0,
        authenticated: sdkResult.status === 'auto_approved'
      };

      await addDoc(collection(db, 'foodLogs'), foodLog);
    } catch (error) {
      console.error('Error logging food consumption:', error);
      throw error;
    }
  };

  const handleFallbackSuccess = (email) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setShowFallback(false);
  };

  const handleBackToFaceAuth = () => {
    setShowFallback(false);
    setMessage('');
    setMessageType('');
  };

  const resetAuthentication = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setMessage('');
    setMessageType('');
  };

  // Show success screen if authenticated
  if (isAuthenticated) {
    return (
      <>
        <Link to="/admin/login" className="admin-btn">🔐 Admin Login</Link>
        
        <div className="logo-section">
          <div className="company-logo">FoodAuth</div>
          <div className="tagline">Secure Employee Food Authentication</div>
        </div>
        
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <h1>Authentication Successful!</h1>
          <p>Welcome, <strong>{userEmail}</strong></p>
          <p>You are now verified and can access the food area. Enjoy your meal! 🍽️</p>
          
          <button 
            className="primary-btn" 
            onClick={resetAuthentication}
            style={{ marginTop: '2rem' }}
          >
            🔄 Authenticate Another User
          </button>
        </div>
      </>
    );
  }

  // Show fallback authentication if needed
  if (showFallback) {
    return (
      <>
        <Link to="/admin/login" className="admin-btn">🔐 Admin Login</Link>
        
        <div className="logo-section">
          <div className="company-logo">FoodAuth</div>
          <div className="tagline">Secure Employee Food Authentication</div>
        </div>
        
        <FallbackAuth 
          onBack={handleBackToFaceAuth}
          onSuccess={handleFallbackSuccess}
        />
      </>
    );
  }

  // Main authentication screen
  return (
    <>
      <Link to="/admin/login" className="admin-btn">🔐 Admin Login</Link>
      
      <div className="logo-section">
        <div className="company-logo">FoodAuth</div>
        <div className="tagline">Secure Employee Food Authentication</div>
      </div>
      
      <h1>Welcome</h1>
      
      <div className="auth-container">
        <p>Please authenticate yourself to log your meal consumption.</p>
        <p>Our secure system uses facial recognition to verify your identity.</p>
      </div>

      <div className="auth-actions">
        <button
          className="primary-btn"
          onClick={startAuthentication}
          disabled={isProcessing}
        >
          {isProcessing ? '🔄 Authenticating...' : '📸 Start Face Authentication'}
        </button>
        
        {!isProcessing && (
          <button
            className="fallback-btn"
            onClick={() => setShowFallback(true)}
          >
            📧 Use Email Verification Instead
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </>
  );
};

export default AuthPage;
