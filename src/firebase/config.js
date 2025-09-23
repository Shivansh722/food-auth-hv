import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBk_ugWzMGVELlLJUUkzY9QelhXY5LTlMw",
  authDomain: "hvtask-d0780.firebaseapp.com",
  projectId: "hvtask-d0780",
  storageBucket: "hvtask-d0780.firebasestorage.app",
  messagingSenderId: "958739958731",
  appId: "1:958739958731:web:59e87bca3c6cf8d41c444e",
  measurementId: "G-WSDTGRGXV2"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
