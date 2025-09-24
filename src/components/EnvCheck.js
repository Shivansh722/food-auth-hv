import React from 'react';

const EnvCheck = () => {
  const envVars = {
    'Firebase API Key': process.env.REACT_APP_FIREBASE_API_KEY,
    'Firebase Auth Domain': process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    'Firebase Project ID': process.env.REACT_APP_FIREBASE_PROJECT_ID,
    'Firebase Storage Bucket': process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    'Firebase Messaging Sender ID': process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    'Firebase App ID': process.env.REACT_APP_FIREBASE_APP_ID,
    'HyperVerge App ID': process.env.REACT_APP_HV_APP_ID,
    'HyperVerge App Key': process.env.REACT_APP_HV_APP_KEY,
    'First Admin Email': process.env.REACT_APP_FIRST_ADMIN_EMAIL,
    'Company Domain': process.env.REACT_APP_COMPANY_DOMAIN,
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Environment Variables</h4>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '3px' }}>
          <strong>{key}:</strong> {value ? '✅ Set' : '❌ Missing'}
        </div>
      ))}
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#ccc' }}>
        Build Time: {new Date().toISOString()}
      </div>
    </div>
  );
};

export default EnvCheck;