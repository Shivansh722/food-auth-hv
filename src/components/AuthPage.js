import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import hypervergeService from '../services/hypervergeService';

const AuthPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const startAuthentication = async () => {
    setIsProcessing(true);
    setMessage('Starting face authentication...');
    setMessageType('info');

    try {
      const transactionId = hypervergeService.generateTransactionId();
      
      await hypervergeService.launchSDK(transactionId, async (result) => {
        console.log('HyperVerge Result:', result);
        
        if (result.status === 'auto_approved') {
          await logFoodConsumption(transactionId, result);
          setMessage('Authentication successful! Food logged.');
          setMessageType('success');
        } else if (result.status === 'auto_declined') {
          setMessage('Authentication failed. Please try again.');
          setMessageType('error');
        } else {
          setMessage('Authentication needs review. Please contact admin.');
          setMessageType('warning');
        }
        
        setIsProcessing(false);
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      setMessage('SDK initialization failed. Please try again.');
      setMessageType('error');
      setIsProcessing(false);
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

  return (
    <div className="container">
      <Link to="/admin" className="admin-btn">Admin</Link>
      <h1>Food Authentication</h1>
      
      <div className="auth-container">
        <p>Click the button below to start face authentication</p>
      </div>

      <button 
        className="capture-btn" 
        onClick={startAuthentication}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Authenticate & Log Food'}
      </button>

      {message && (
        <div className={messageType}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthPage;
