import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize first admin if none exists
  async function initializeFirstAdmin() {
    try {
      const adminsRef = collection(db, 'admins');
      const snapshot = await getDocs(adminsRef);
      
      if (snapshot.empty && process.env.REACT_APP_FIRST_ADMIN_EMAIL) {
        console.log('Creating first admin account...');
        
        // Step 1: Create admin document in Firestore
        await setDoc(doc(db, 'admins', process.env.REACT_APP_FIRST_ADMIN_EMAIL), {
          email: process.env.REACT_APP_FIRST_ADMIN_EMAIL,
          role: 'super_admin',
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          isActive: true,
          needsPasswordSetup: true
        });
        
        // Step 2: Create Firebase Auth account with temporary password
        try {
          const tempPassword = 'TempPassword123!'; // Will be reset via email
          await createUserWithEmailAndPassword(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL, tempPassword);
          console.log('Firebase Auth account created');
          
          // Step 3: Sign out immediately (we don't want to stay logged in)
          await signOut(auth);
          
          // Step 4: Now send password reset email
          await sendPasswordResetEmail(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL);
          console.log('Password reset email sent to:', process.env.REACT_APP_FIRST_ADMIN_EMAIL);
          
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            // Account exists, just send reset email
            console.log('Account exists, sending password reset email...');
            await sendPasswordResetEmail(auth, process.env.REACT_APP_FIRST_ADMIN_EMAIL);
          } else {
            console.error('Error creating Firebase Auth account:', authError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing first admin:', error);
    }
  }

  // Check admin status
  async function getAdminData(email) {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', email));
      return adminDoc.exists() && adminDoc.data().isActive ? adminDoc.data() : null;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return null;
    }
  }

  // Login
  async function login(email, password) {
    const domain = email.split('@')[1];
    if (domain !== process.env.REACT_APP_COMPANY_DOMAIN) {
      throw new Error(`Only ${process.env.REACT_APP_COMPANY_DOMAIN} emails are allowed`);
    }

    const adminData = await getAdminData(email);
    if (!adminData) {
      throw new Error('You are not authorized to access the admin panel');
    }

    await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login
    await setDoc(doc(db, 'admins', email), {
      ...adminData,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Add new admin
  async function addAdmin(email, role = 'admin') {
    if (!userData || userData.role !== 'super_admin') {
      throw new Error('Only super admins can add new admins');
    }

    const domain = email.split('@')[1];
    if (domain !== process.env.REACT_APP_COMPANY_DOMAIN) {
      throw new Error(`Only ${process.env.REACT_APP_COMPANY_DOMAIN} emails are allowed`);
    }

    const existingAdmin = await getDoc(doc(db, 'admins', email));
    if (existingAdmin.exists()) {
      throw new Error('Admin already exists');
    }

    // Create Firestore document
    await setDoc(doc(db, 'admins', email), {
      email: email,
      role: role,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.email,
      isActive: true
    });

    // Create Firebase Auth account and send reset email
    try {
      const tempPassword = 'TempPassword123!';
      await createUserWithEmailAndPassword(auth, email, tempPassword);
      await signOut(auth); // Sign out the newly created user
      await sendPasswordResetEmail(auth, email);
    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        await sendPasswordResetEmail(auth, email);
      } else {
        throw authError;
      }
    }
  }

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminData = await getAdminData(user.email);
        if (adminData) {
          setUserData(adminData);
        } else {
          await signOut(auth);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    initializeFirstAdmin();
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    logout,
    resetPassword,
    addAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}