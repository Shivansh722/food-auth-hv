import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import DashboardLayout from './shared/DashboardLayout';
import DashboardCard from './shared/DashboardCard';
import StatCard from './shared/StatCard';
import { WeeklyTrendChart, RushTimeChart, SimpleBarChart } from './shared/ChartComponents';

const RegularAdminDashboard = () => {
  const [foodLogs, setFoodLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Load food logs
    const logsQuery = query(collection(db, 'foodLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFoodLogs(logs);
      calculateStats(logs);
      generateAlerts(logs);
      setLoading(false);
    });

    return () => unsubscribeLogs();
  }, []);

  const calculateStats = (logs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= today);
    const weekLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= thisWeek);
    const monthLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= thisMonth);
    const lastWeekLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp.toDate());
      return logDate >= lastWeek && logDate < thisWeek;
    });

    // Get unique users
    const uniqueUsers = [...new Set(logs.map(log => log.userId))];
    const activeUsersToday = [...new Set(todayLogs.map(log => log.userId))];
    const activeUsersWeek = [...new Set(weekLogs.map(log => log.userId))];

    // Calculate success rate
    const successfulLogs = logs.filter(log => log.status === 'success');
    const successRate = logs.length > 0 ? ((successfulLogs.length / logs.length) * 100).toFixed(1) : 0;

    // Calculate growth
    const weekGrowth = lastWeekLogs.length > 0 
      ? (((weekLogs.length - lastWeekLogs.length) / lastWeekLogs.length) * 100).toFixed(1)
      : 0;

    setStats({
      totalUsers: uniqueUsers.length,
      todayMeals: todayLogs.length,
      weeklyMeals: weekLogs.length,
      monthlyMeals: monthLogs.length,
      activeUsersToday: activeUsersToday.length,
      activeUsersWeek: activeUsersWeek.length,
      successRate,
      weekGrowth,
      avgMealsPerUser: uniqueUsers.length > 0 ? (logs.length / uniqueUsers.length).toFixed(1) : 0,
      peakHour: getPeakHour(weekLogs),
      totalTransactions: logs.length
    });

    setUsers(uniqueUsers.map(userId => {
      const userLogs = logs.filter(log => log.userId === userId);
      const lastActivity = userLogs.length > 0 ? userLogs[0].timestamp : null;
      return {
        id: userId,
        email: userId,
        totalMeals: userLogs.length,
        lastActivity,
        status: todayLogs.some(log => log.userId === userId) ? 'active' : 'inactive',
        weeklyMeals: weekLogs.filter(log => log.userId === userId).length
      };
    }));
  };

  const getPeakHour = (logs) => {
    const hourCounts = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp.toDate()).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '12'
    );
    
    return `${peakHour}:00`;
  };

  const generateAlerts = (logs) => {
    const alerts = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check for unusual activity
    const todayLogs = logs.filter(log => new Date(log.timestamp.toDate()) >= today);
    const avgDailyMeals = logs.length / 30; // Rough average over 30 days
    
    if (todayLogs.length > avgDailyMeals * 1.5) {
      alerts.push({
        id: 'high_usage',
        type: 'warning',
        title: 'High Usage Alert',
        message: `Today's meal count (${todayLogs.length}) is significantly higher than average`,
        timestamp: new Date()
      });
    }

    // Check for failed transactions
    const failedToday = todayLogs.filter(log => log.status !== 'success');
    if (failedToday.length > 5) {
      alerts.push({
        id: 'failed_transactions',
        type: 'error',
        title: 'Failed Transactions',
        message: `${failedToday.length} failed transactions detected today`,
        timestamp: new Date()
      });
    }

    // Check for inactive users
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    if (inactiveUsers > users.length * 0.3) {
      alerts.push({
        id: 'inactive_users',
        type: 'info',
        title: 'User Engagement',
        message: `${inactiveUsers} users haven't been active today`,
        timestamp: new Date()
      });
    }

    setAlerts(alerts);
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

  const getRushTimeData = () => {
    const hourCounts = new Array(24).fill(0);
    const weekLogs = foodLogs.filter(log => {
      const logDate = new Date(log.timestamp.toDate());
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return logDate >= weekAgo;
    });

    weekLogs.forEach(log => {
      const hour = new Date(log.timestamp.toDate()).getHours();
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      time: `${hour}:00`,
      count
    })).filter(item => item.count > 0);
  };

  const getTopUsersData = () => {
    return users
      .sort((a, b) => b.totalMeals - a.totalMeals)
      .slice(0, 5)
      .map(user => ({
        name: user.email.split('@')[0],
        value: user.totalMeals
      }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp.toDate()).toLocaleString();
  };

  const handleUserAction = async (userId, action) => {
    try {
      // In a real app, you'd implement actual user management actions
      console.log(`${action} user: ${userId}`);
      
      // Example: Add a log entry for admin action
      await addDoc(collection(db, 'adminActions'), {
        action,
        targetUser: userId,
        adminId: 'admin@company.com', // Replace with actual admin ID
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Monitor and manage your food service operations"
      userType="admin"
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
          title="Active Users"
          value={stats.activeUsersToday || 0}
          icon="👥"
          color="#007bff"
          trend={stats.activeUsersToday > stats.activeUsersWeek / 7 ? 'up' : 'down'}
          trendValue={`${stats.activeUsersWeek || 0} this week`}
        />
        <StatCard
          title="Today's Meals"
          value={stats.todayMeals || 0}
          icon="🍽️"
          color="#28a745"
          trend={stats.weekGrowth > 0 ? 'up' : stats.weekGrowth < 0 ? 'down' : 'neutral'}
          trendValue={`${stats.weekGrowth}% vs last week`}
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate || 0}%`}
          icon="✅"
          color="#20c997"
          trend={stats.successRate > 95 ? 'up' : 'down'}
          trendValue="System reliability"
        />
        <StatCard
          title="Peak Hour"
          value={stats.peakHour || '12:00'}
          icon="⏰"
          color="#ffc107"
          subtitle="Busiest time today"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <DashboardCard
            title="System Alerts"
            icon="🚨"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: alert.type === 'error' ? 'rgba(220,53,69,0.1)' : 
                               alert.type === 'warning' ? 'rgba(255,193,7,0.1)' : 'rgba(23,162,184,0.1)',
                    border: `1px solid ${alert.type === 'error' ? '#dc3545' : 
                                        alert.type === 'warning' ? '#ffc107' : '#17a2b8'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)' }}>
                      {alert.message}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: 'rgba(0,0,0,0.5)'
                    }}
                    onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}

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
            { id: 'users', label: 'User Management', icon: '👥' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'monitoring', label: 'Monitoring', icon: '📡' }
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
              title="Weekly Activity Trend"
              icon="📈"
              loading={loading}
            >
              <WeeklyTrendChart data={getWeeklyTrendData()} height={250} />
            </DashboardCard>

            <DashboardCard
              title="Recent Transactions"
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
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Total Meals Today</span>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{stats.todayMeals || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Total Users</span>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{stats.totalUsers || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.7)' }}>Success Rate</span>
                  <span style={{ fontWeight: '600', fontSize: '18px' }}>{stats.successRate || 0}%</span>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <DashboardCard
          title="User Management"
          icon="👥"
          loading={loading}
        >
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search users..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <select
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">All Users</option>
              <option value="active">Active Today</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Total Meals</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>This Week</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Last Activity</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 20).map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      {user.email.split('@')[0]}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: user.status === 'active' ? '#28a745' : '#6c757d',
                        fontWeight: '500'
                      }}>
                        {user.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{user.totalMeals}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{user.weeklyMeals}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>
                      {formatTimestamp(user.lastActivity)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                        {user.status === 'active' ? 'Currently Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <DashboardCard
            title="Rush Hour Analysis"
            icon="⏰"
            loading={loading}
          >
            <RushTimeChart data={getRushTimeData()} height={250} />
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
              Peak usage times over the last 7 days
            </div>
          </DashboardCard>

          <DashboardCard
            title="Performance Metrics"
            icon="📊"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>Success Rate</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{stats.successRate}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.successRate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #28a745, #20c997)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.7)' }}>User Engagement</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>
                    {((stats.activeUsersWeek / stats.totalUsers) * 100 || 0).toFixed(1)}%
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
                    width: `${(stats.activeUsersWeek / stats.totalUsers) * 100 || 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #007bff, #6610f2)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Key Insights</div>
                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.7)', lineHeight: '1.4' }}>
                  • Peak usage at {stats.peakHour}<br/>
                  • {stats.avgMealsPerUser} avg meals per user<br/>
                  • {stats.weekGrowth > 0 ? '+' : ''}{stats.weekGrowth}% growth this week
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <DashboardCard
            title="System Status"
            icon="📡"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Database Connection</span>
                <span style={{ color: '#28a745', fontWeight: '500' }}>🟢 Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>API Response Time</span>
                <span style={{ fontWeight: '500' }}>142ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Active Sessions</span>
                <span style={{ fontWeight: '500' }}>{stats.activeUsersToday || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Error Rate</span>
                <span style={{ color: '#28a745', fontWeight: '500' }}>
                  {(100 - parseFloat(stats.successRate || 100)).toFixed(1)}%
                </span>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Recent Errors"
            icon="⚠️"
          >
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {foodLogs.filter(log => log.status !== 'success').slice(0, 5).map(log => (
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
                    <div style={{ fontWeight: '500', fontSize: '14px', color: '#dc3545' }}>
                      Transaction Failed
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                      User: {log.userId?.split('@')[0] || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    background: 'rgba(220,53,69,0.1)',
                    color: '#dc3545',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    Error
                  </span>
                </div>
              ))}
              {foodLogs.filter(log => log.status !== 'success').length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  color: 'rgba(0,0,0,0.5)',
                  fontSize: '14px'
                }}>
                  🎉 No recent errors detected
                </div>
              )}
            </div>
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RegularAdminDashboard;