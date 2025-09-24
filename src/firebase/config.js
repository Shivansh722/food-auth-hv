import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Validate that required environment variables exist
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN', 
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  console.error('Current env vars:', {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
    appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
  });
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

let app;
let auth;
let db;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

export { auth, db };
export default app;
