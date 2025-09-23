import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const AuthPage = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
      setMessage('');
    } catch (error) {
      setMessage('Camera access denied');
      setMessageType('error');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Convert to blob for processing
    canvas.toBlob(async (blob) => {
      try {
        // Here you would integrate with your company's face recognition SDK
        // For now, we'll simulate authentication and log the food consumption
        
        await logFoodConsumption(blob);
        setMessage('Food logged successfully!');
        setMessageType('success');
        
        // Stop camera
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      } catch (error) {
        setMessage('Authentication failed. Please try again.');
        setMessageType('error');
      }
    }, 'image/jpeg');
  };

  const logFoodConsumption = async (imageBlob) => {
    // Convert image to base64 for storage in Firestore
    const reader = new FileReader();
    reader.onload = async () => {
      const foodLog = {
        timestamp: serverTimestamp(),
        imageData: reader.result, // Base64 string instead of blob
        authenticated: true, // This would come from your SDK
        userId: 'temp-user', // This would come from face recognition
        email: 'user@company.com' // This would come from face recognition
      };

      await addDoc(collection(db, 'foodLogs'), foodLog);
    };
    reader.readAsDataURL(imageBlob);
  };

  return (
    <div className="container">
      <Link to="/admin" className="admin-btn">Admin</Link>
      <h1>Food Authentication</h1>
      
      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ display: isCapturing ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </div>

      {!isCapturing ? (
        <button className="capture-btn" onClick={startCamera}>
          Start Camera
        </button>
      ) : (
        <button className="capture-btn" onClick={capturePhoto}>
          Authenticate & Log Food
        </button>
      )}

      {message && (
        <div className={messageType}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthPage;
