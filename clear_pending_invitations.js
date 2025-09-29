const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhJGJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "food-auth-hv.firebaseapp.com",
  projectId: "food-auth-hv",
  storageBucket: "food-auth-hv.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearPendingInvitations() {
  try {
    console.log('Checking for pending invitations for shivansh.c@hyperverge.co...');
    
    const pendingQuery = query(
      collection(db, 'adminInvitations'),
      where('email', '==', 'shivansh.c@hyperverge.co'),
      where('status', '==', 'pending')
    );
    
    const pendingInvitations = await getDocs(pendingQuery);
    
    if (pendingInvitations.empty) {
      console.log('No pending invitations found.');
    } else {
      console.log(`Found ${pendingInvitations.size} pending invitation(s). Clearing them...`);
      
      for (const invitationDoc of pendingInvitations.docs) {
        await deleteDoc(doc(db, 'adminInvitations', invitationDoc.id));
        console.log(`Deleted invitation: ${invitationDoc.id}`);
      }
      
      console.log('All pending invitations cleared successfully.');
    }
    
  } catch (error) {
    console.error('Error clearing pending invitations:', error);
  }
}

clearPendingInvitations();