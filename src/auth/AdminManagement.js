import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { addAdmin, userData } = useAuth();

  // Load admins
  const loadAdmins = async () => {
    try {
      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      const adminsList = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsList);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  // Add new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage('');
      
      await addAdmin(newAdminEmail, newAdminRole);
      
      setMessage(`Admin ${newAdminEmail} added successfully! Password reset email sent.`);
      setNewAdminEmail('');
      setNewAdminRole('admin');
      
      // Reload admins list
      await loadAdmins();
      
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (adminEmail, currentStatus) => {
    try {
      await updateDoc(doc(db, 'admins', adminEmail), {
        isActive: !currentStatus
      });
      await loadAdmins();
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  if (userData?.role !== 'super_admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Link 
          to="/admin" 
          style={{
            color: 'rgba(0,0,0,0.6)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '20px'
          }}
        >
          ← Back to Dashboard
        </Link>
        <h2 style={{ color: '#212529' }}>🚫 Access Denied</h2>
        <p style={{ color: 'rgba(0,0,0,0.7)' }}>Only super admins can manage other admins.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Navigation Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/admin" 
          style={{
            color: 'rgba(0,0,0,0.6)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '10px'
          }}
        >
          ← Back to Dashboard
        </Link>
        <h1 style={{ color: '#212529', margin: '0' }}>👥 Admin Management</h1>
      </div>

      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#212529', marginBottom: '20px' }}>Add New Admin</h2>
        
        <form onSubmit={handleAddAdmin} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder={`admin@${process.env.REACT_APP_COMPANY_DOMAIN}`}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)',
                flex: '1',
                minWidth: '200px'
              }}
              required
            />
            
            <select
              value={newAdminRole}
              onChange={(e) => setNewAdminRole(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#212529',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        </form>

        {message && (
          <div style={{
            padding: '10px',
            borderRadius: '6px',
            background: message.includes('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
            color: message.includes('Error') ? '#d32f2f' : '#2e7d32',
            marginBottom: '20px'
          }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#212529', marginBottom: '15px' }}>Current Admins</h3>
        
        {admins.length === 0 ? (
          <p style={{ color: 'rgba(0,0,0,0.6)' }}>No admins found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      {admin.email}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{
                        background: admin.role === 'super_admin' ? 'rgba(255,193,7,0.2)' : 'rgba(0,123,255,0.2)',
                        color: admin.role === 'super_admin' ? '#f57c00' : '#0056b3',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {admin.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{
                        color: admin.isActive ? '#28a745' : '#dc3545',
                        fontWeight: '500'
                      }}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }}>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      {admin.email !== userData.email && (
                        <button
                          onClick={() => toggleAdminStatus(admin.email, admin.isActive)}
                          style={{
                            background: admin.isActive ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;