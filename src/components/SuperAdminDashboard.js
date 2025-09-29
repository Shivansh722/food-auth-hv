import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import adminInvitationService from '../services/adminInvitationService';
import DashboardLayout from './shared/DashboardLayout';
import DashboardCard from './shared/DashboardCard';
import StatCard from './shared/StatCard';
import { WeeklyTrendChart, UsageComparisonChart, SimpleBarChart } from './shared/ChartComponents';

const SuperAdminDashboard = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [foodLogs, setFoodLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifiedUsersLoading, setVerifiedUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', role: 'admin' });
  const [invitationStatus, setInvitationStatus] = useState({ loading: false, message: '' });
  const [systemSettings, setSystemSettings] = useState({
    maxDailyMeals: 3,
    allowWeekendAccess: true,
    requireApproval: false
  });

  useEffect(() => {
    // Load admins
    const adminsQuery = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
    const unsubscribeAdmins = onSnapshot(adminsQuery, (snapshot) => {
      const adminsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsList);
    });

    // Load food logs for analytics
    const logsQuery = query(collection(db, 'foodLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFoodLogs(logs);
      calculateSystemStats(logs, admins);
      setLoading(false);
    });

    return () => {
      unsubscribeAdmins();
      unsubscribeLogs();
    };
  }, []);

  // Load verified users when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      loadVerifiedUsers();
    }
  }, [activeTab]);

  const loadVerifiedUsers = async () => {
    setVerifiedUsersLoading(true);
    try {
      console.log('🔍 Starting to load verified users...');
      
      // Get all email verifications (remove orderBy to avoid index issues)
      console.log('📧 Querying ALL emailVerifications collection...');
      const emailVerificationsQuery = collection(db, 'emailVerifications');
      const emailVerificationsSnapshot = await getDocs(emailVerificationsQuery);
      
      console.log(`📧 Found ${emailVerificationsSnapshot.docs.length} email verifications`);
      emailVerificationsSnapshot.docs.forEach((doc, index) => {
        console.log(`📧 Email verification ${index + 1}:`, doc.data());
      });
      
      // Filter verified emails from the results
      const verifiedEmails = emailVerificationsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.verified === true || data.status === 'verified';
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'email'
        }));

      console.log(`📧 Filtered to ${verifiedEmails.length} verified emails`);

      // Get all face verifications (remove orderBy to avoid index issues)
      console.log('👤 Querying ALL verifications collection...');
      const faceVerificationsQuery = collection(db, 'verifications');
      const faceVerificationsSnapshot = await getDocs(faceVerificationsQuery);
      
      console.log(`👤 Found ${faceVerificationsSnapshot.docs.length} face verifications`);
      faceVerificationsSnapshot.docs.forEach((doc, index) => {
        console.log(`👤 Face verification ${index + 1}:`, doc.data());
      });
      
      // Filter verified faces from the results
      const faceVerified = faceVerificationsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.status === 'verified' || data.verified === true || data.authenticated === true;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'face'
        }));

      console.log(`👤 Filtered to ${faceVerified.length} verified faces`);

      // Also check foodLogs for verified users
      console.log('🍽️ Querying ALL foodLogs collection...');
      const foodLogsQuery = collection(db, 'foodLogs');
      const foodLogsSnapshot = await getDocs(foodLogsQuery);
      
      console.log(`🍽️ Found ${foodLogsSnapshot.docs.length} food logs`);
      foodLogsSnapshot.docs.forEach((doc, index) => {
        console.log(`🍽️ Food log ${index + 1}:`, doc.data());
      });
      
      // Extract verified users from food logs
      const foodLogUsers = foodLogsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.authenticated === true || data.status === 'verified';
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'food_log'
        }));

      console.log(`🍽️ Filtered to ${foodLogUsers.length} verified food log entries`);

      // Combine all verifications
      const allVerifications = [...verifiedEmails, ...faceVerified, ...foodLogUsers];
      console.log('🔄 Combined verifications:', allVerifications);
      
      const uniqueVerifiedUsers = [];
      const seenEmails = new Set();

      allVerifications.forEach(verification => {
        // Try multiple possible email field names
        const email = verification.email || verification.userId || verification.user || verification.userEmail;
        console.log(`🔍 Processing verification for email: ${email}`, verification);
        
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email);
          
          // Check if this email has different types of verification
          const hasEmailVerification = verifiedEmails.some(v => 
            (v.email || v.userId || v.user || v.userEmail) === email
          );
          const hasFaceVerification = faceVerified.some(v => 
            (v.email || v.userId || v.user || v.userEmail) === email
          );
          const hasFoodLogEntry = foodLogUsers.some(v => 
            (v.email || v.userId || v.user || v.userEmail) === email
          );
          
          uniqueVerifiedUsers.push({
            email,
            emailVerified: hasEmailVerification,
            faceVerified: hasFaceVerification,
            lastVerification: verification.verifiedAt || verification.timestamp || verification.createdAt,
            verificationMethod: hasEmailVerification && hasFaceVerification ? 'both' : 
                              hasEmailVerification ? 'email' : 
                              hasFaceVerification ? 'face' : 'food_log'
          });
        }
      });

      console.log('✅ Final unique verified users:', uniqueVerifiedUsers);
      setVerifiedUsers(uniqueVerifiedUsers);
    } catch (error) {
      console.error('❌ Error loading verified users:', error);
      // Show error to user
      alert(`Error loading verified users: ${error.message}`);
    } finally {
      setVerifiedUsersLoading(false);
    }
  };

  const exportToCSV = () => {
    if (verifiedUsers.length === 0) {
      alert('No verified users to export');
      return;
    }

    const headers = ['Email', 'Email Verified', 'Face Verified', 'Last Verification', 'Verification Method'];
    const csvContent = [
      headers.join(','),
      ...verifiedUsers.map(user => [
        user.email,
        user.emailVerified ? 'Yes' : 'No',
        user.faceVerified ? 'Yes' : 'No',
        user.lastVerification ? new Date(user.lastVerification.toDate ? user.lastVerification.toDate() : user.lastVerification).toLocaleString() : 'N/A',
        user.verificationMethod || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `verified_users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateSystemStats = (logs, adminsList) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= today);
    const weekLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= thisWeek);
    const monthLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= thisMonth);

    // Get unique users
    const uniqueUsers = [...new Set(logs.map(log => log.userId))];
    const activeUsersToday = [...new Set(todayLogs.map(log => log.userId))];
    const activeUsersWeek = [...new Set(weekLogs.map(log => log.userId))];

    // Calculate admin activity
    const superAdmins = adminsList.filter(admin => admin.role === 'super_admin');
    const regularAdmins = adminsList.filter(admin => admin.role === 'admin');

    setSystemStats({
      totalUsers: uniqueUsers.length,
      totalAdmins: adminsList.length,
      superAdmins: superAdmins.length,
      regularAdmins: regularAdmins.length,
      todayMeals: todayLogs.length,
      weeklyMeals: weekLogs.length,
      monthlyMeals: monthLogs.length,
      activeUsersToday: activeUsersToday.length,
      activeUsersWeek: activeUsersWeek.length,
      avgMealsPerUser: uniqueUsers.length > 0 ? (logs.length / uniqueUsers.length).toFixed(1) : 0,
      systemUptime: '99.9%',
      lastBackup: new Date().toLocaleDateString()
    });
  };

  const handleAddAdmin = async () => {
    console.log('handleAddAdmin called with:', { email: newAdmin.email, role: newAdmin.role });
    
    if (!newAdmin.email) {
      setInvitationStatus({ loading: false, message: 'Please enter an email address' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      setInvitationStatus({ loading: false, message: 'Please enter a valid email address' });
      return;
    }

    setInvitationStatus({ loading: true, message: 'Sending invitation...' });

    try {
      console.log('Calling adminInvitationService.inviteAdmin...');
      const result = await adminInvitationService.inviteAdmin(
        newAdmin.email,
        newAdmin.role,
        currentUser?.email || 'super_admin@company.com'
      );

      console.log('Invitation result:', result);
      if (result.success) {
        setInvitationStatus({ loading: false, message: 'Invitation sent successfully!' });
        setNewAdmin({ email: '', role: 'admin' });
        setTimeout(() => {
          setShowAddAdmin(false);
          setInvitationStatus({ loading: false, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending admin invitation:', error);
      console.error('Error stack:', error.stack);
      setInvitationStatus({ 
        loading: false, 
        message: error.message || 'Failed to send invitation. Please try again.' 
      });
    }
  };

  const handleUpdateAdminRole = async (adminId, newRole) => {
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        role: newRole,
        updatedAt: serverTimestamp(),
        permissions: newRole === 'super_admin' 
          ? ['manage_admins', 'view_analytics', 'system_settings', 'user_management']
          : ['view_analytics', 'user_management']
      });
    } catch (error) {
      console.error('Error updating admin role:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await deleteDoc(doc(db, 'admins', adminId));
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const getWeeklyTrendData = () => {
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayLogs = foodLogs.filter(log => {
        const logDate = new Date(log.timestamp.toDate());
        return logDate.toDateString() === date.toDateString();
      });
      
      weekData.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        meals: dayLogs.length,
        users: [...new Set(dayLogs.map(log => log.userId))].length
      });
    }
    
    return weekData;
  };

  const getTopUsersData = () => {
    const userCounts = {};
    foodLogs.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });
    
    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({
        name: userId.split('@')[0], // Show username part of email
        value: count
      }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.toDate()).toLocaleString();
  };

  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      subtitle="Manage your organization's food service system"
      userType="super_admin"
      currentPage="dashboard"
    >
      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '24px' 
      }}>
        <StatCard
          title="Total Users"
          value={systemStats.totalUsers || 0}
          icon="👥"
          color="#007bff"
          subtitle="Registered users"
        />
        <StatCard
          title="Active Today"
          value={systemStats.activeUsersToday || 0}
          icon="🟢"
          color="#28a745"
          subtitle={`${((systemStats.activeUsersToday / systemStats.totalUsers) * 100 || 0).toFixed(1)}% of total`}
        />
        <StatCard
          title="Total Admins"
          value={systemStats.totalAdmins || 0}
          icon="👨‍💼"
          color="#6f42c1"
          subtitle={`${systemStats.superAdmins || 0} Super, ${systemStats.regularAdmins || 0} Regular`}
        />
        <StatCard
          title="System Health"
          value={systemStats.systemUptime || '99.9%'}
          icon="💚"
          color="#20c997"
          subtitle="Uptime"
        />
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'white',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'admins', label: 'Admin Management', icon: '👨‍💼' },
            { id: 'users', label: 'Verified Users', icon: '✅' },
            { id: 'analytics', label: 'System Analytics', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'rgba(0,0,0,0.7)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DashboardCard
              title="Weekly System Usage"
              icon="📈"
              loading={loading}
            >
              <WeeklyTrendChart data={getWeeklyTrendData()} height={250} />
            </DashboardCard>

            <DashboardCard
              title="Recent System Activity"
              icon="🕐"
            >
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {foodLogs.slice(0, 10).map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>
                        {log.userId?.split('@')[0] || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: log.status === 'success' ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)',
                      color: log.status === 'success' ? '#28a745' : '#dc3545'
                    }}>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DashboardCard
              title="Top Active Users"
              icon="🏆"
              loading={loading}
            >
              <SimpleBarChart data={getTopUsersData()} height={200} />
            </DashboardCard>

            <DashboardCard
              title="System Overview"
              icon="📊"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Total Meals Served</span>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{systemStats.monthlyMeals || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Avg Meals/User</span>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{systemStats.avgMealsPerUser || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Last Backup</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{systemStats.lastBackup}</span>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {activeTab === 'admins' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Admin Management</h3>
            <button
              onClick={() => setShowAddAdmin(true)}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📧</span>
              Invite New Admin
            </button>
          </div>

          {showAddAdmin && (
            <DashboardCard
              title="Invite New Admin"
              icon="📧"
              style={{ marginBottom: '24px' }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder="admin@example.com"
                    disabled={invitationStatus.loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      opacity: invitationStatus.loading ? 0.6 : 1
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    disabled={invitationStatus.loading}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      opacity: invitationStatus.loading ? 0.6 : 1
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <button
                  onClick={handleAddAdmin}
                  disabled={invitationStatus.loading}
                  style={{
                    padding: '12px 24px',
                    background: invitationStatus.loading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: invitationStatus.loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {invitationStatus.loading ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => {
                    setShowAddAdmin(false);
                    setInvitationStatus({ loading: false, message: '' });
                  }}
                  disabled={invitationStatus.loading}
                  style={{
                    padding: '12px 24px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: invitationStatus.loading ? 'not-allowed' : 'pointer',
                    opacity: invitationStatus.loading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
              </div>
              
              {invitationStatus.message && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: invitationStatus.message.includes('success') ? '#d4edda' : '#f8d7da',
                  color: invitationStatus.message.includes('success') ? '#155724' : '#721c24',
                  border: `1px solid ${invitationStatus.message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
                  fontSize: '14px'
                }}>
                  {invitationStatus.message}
                </div>
              )}
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#e9ecef',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#495057'
              }}>
                <strong>📧 How it works:</strong> An invitation email will be sent to the admin with a secure link to set their password and access the system.
              </div>
            </DashboardCard>
          )}

          <DashboardCard
            title="Current Admins"
            icon="👨‍💼"
            loading={loading}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Last Login</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{admin.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: admin.role === 'super_admin' ? 'rgba(111,66,193,0.1)' : 'rgba(0,123,255,0.1)',
                          color: admin.role === 'super_admin' ? '#6f42c1' : '#007bff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          color: admin.status === 'active' ? '#28a745' : '#dc3545',
                          fontWeight: '500'
                        }}>
                          {admin.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                        {formatTimestamp(admin.lastLogin)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select
                            value={admin.role}
                            onChange={(e) => handleUpdateAdminRole(admin.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            style={{
                              padding: '4px 8px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Verified Users</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={loadVerifiedUsers}
                disabled={verifiedUsersLoading}
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: verifiedUsersLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: verifiedUsersLoading ? 0.6 : 1
                }}
              >
                <span>🔄</span>
                {verifiedUsersLoading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={exportToCSV}
                disabled={verifiedUsers.length === 0}
                style={{
                  padding: '12px 24px',
                  background: verifiedUsers.length === 0 ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: verifiedUsers.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📥</span>
                Export to CSV
              </button>
            </div>
          </div>

          <DashboardCard
            title={`Verified Users (${verifiedUsers.length})`}
            icon="✅"
            loading={verifiedUsersLoading}
          >
            {verifiedUsers.length === 0 && !verifiedUsersLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(0,0,0,0.6)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No Verified Users Found</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  No users have completed the verification process yet.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Email Verified</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Face Verified</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Last Verification</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedUsers.map((user, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{user.email}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: user.emailVerified ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)',
                            color: user.emailVerified ? '#28a745' : '#dc3545',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user.emailVerified ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: user.faceVerified ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)',
                            color: user.faceVerified ? '#28a745' : '#dc3545',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user.faceVerified ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                          {user.lastVerification ? 
                            new Date(user.lastVerification.toDate ? user.lastVerification.toDate() : user.lastVerification).toLocaleString() 
                            : 'N/A'
                          }
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: 'rgba(0,123,255,0.1)',
                            color: '#007bff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {user.verificationMethod === 'email' ? '📧 Email' : 
                             user.verificationMethod === 'face' ? '👤 Face' : '🔍 Mixed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>

          <div style={{ marginTop: '24px' }}>
            <DashboardCard
              title="Verification Statistics"
              icon="📊"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#007bff', marginBottom: '8px' }}>
                    {verifiedUsers.length}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>Total Verified Users</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#28a745', marginBottom: '8px' }}>
                    {verifiedUsers.filter(u => u.emailVerified).length}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>Email Verified</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#6f42c1', marginBottom: '8px' }}>
                    {verifiedUsers.filter(u => u.faceVerified).length}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>Face Verified</div>
                </div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '600', color: '#ffc107', marginBottom: '8px' }}>
                    {verifiedUsers.filter(u => u.emailVerified && u.faceVerified).length}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>Fully Verified</div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <DashboardCard
            title="Usage Comparison"
            icon="📊"
            loading={loading}
          >
            <UsageComparisonChart 
              data={[
                { name: 'This Week', current: systemStats.weeklyMeals || 0, previous: (systemStats.weeklyMeals || 0) * 0.8 },
                { name: 'This Month', current: systemStats.monthlyMeals || 0, previous: (systemStats.monthlyMeals || 0) * 0.9 }
              ]} 
              height={250} 
            />
          </DashboardCard>

          <DashboardCard
            title="System Metrics"
            icon="⚡"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>User Engagement</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {((systemStats.activeUsersWeek / systemStats.totalUsers) * 100 || 0).toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(systemStats.activeUsersWeek / systemStats.totalUsers) * 100 || 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #007bff, #0056b3)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>System Load</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>23%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '23%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #28a745, #1e7e34)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>Storage Used</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>45%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '45%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #ffc107, #e0a800)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;