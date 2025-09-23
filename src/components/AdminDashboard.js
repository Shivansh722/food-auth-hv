import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const AdminDashboard = () => {
  const [foodLogs, setFoodLogs] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'foodLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFoodLogs(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });

    return () => unsubscribe();
  }, []);

  const addNewUser = async () => {
    if (!newUserEmail || !newUserName) return;

    try {
      await addDoc(collection(db, 'users'), {
        email: newUserEmail,
        name: newUserName,
        enrolled: false,
        createdAt: new Date()
      });
      
      setNewUserEmail('');
      setNewUserName('');
      setIsAddingUser(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Link to="/" className="admin-btn">Back to Auth</Link>
      <h1>Admin Dashboard</h1>

      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="capture-btn" 
          onClick={() => setIsAddingUser(!isAddingUser)}
        >
          {isAddingUser ? 'Cancel' : 'Add New User'}
        </button>

        {isAddingUser && (
          <div style={{ marginTop: '1rem' }}>
            <input
              type="email"
              placeholder="User Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="User Name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button className="capture-btn" onClick={addNewUser}>
              Add User
            </button>
          </div>
        )}
      </div>

      <h2>Food Consumption Logs</h2>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {foodLogs.length === 0 ? (
          <p>No logs yet</p>
        ) : (
          foodLogs.map(log => (
            <div key={log.id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '1rem', 
              marginBottom: '0.5rem',
              backgroundColor: '#f9f9f9'
            }}>
              <div><strong>User:</strong> {log.email || 'Unknown'}</div>
              <div><strong>Time:</strong> {formatTimestamp(log.timestamp)}</div>
              <div><strong>Status:</strong> {log.authenticated ? '✅ Authenticated' : '❌ Failed'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
