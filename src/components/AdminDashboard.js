import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [foodLogs, setFoodLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [rushTimeData, setRushTimeData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'foodLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFoodLogs(logs);
      calculateStats(logs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [foodLogs, dateFilter, searchTerm]);

  const calculateStats = (logs) => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => 
      log.timestamp && new Date(log.timestamp.seconds * 1000).toDateString() === today
    );

    const timeStats = {
      breakfast: 0,
      lunch: 0,
      snacks: 0
    };

    todayLogs.forEach(log => {
      if (log.timestamp) {
        const hour = new Date(log.timestamp.seconds * 1000).getHours();
        if (hour >= 6 && hour < 11) timeStats.breakfast++;
        else if (hour >= 11 && hour < 16) timeStats.lunch++;
        else timeStats.snacks++;
      }
    });

    setStats({
      totalToday: todayLogs.length,
      totalEver: logs.length,
      successRate: logs.length ? Math.round((logs.filter(l => l.authenticated).length / logs.length) * 100) : 0,
      timeStats
    });

    // Calculate rush time data for the chart
    calculateRushTimeData(todayLogs);
  };

  const calculateRushTimeData = (logs) => {
    // Create hourly bins from 6 AM to 9 PM
    const hourlyData = [];
    for (let hour = 6; hour <= 21; hour++) {
      const timeLabel = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
      if (hour === 12) {
        hourlyData.push({
          time: '12:00 PM',
          people: 0,
          hour: hour
        });
      } else {
        hourlyData.push({
          time: timeLabel,
          people: 0,
          hour: hour
        });
      }
    }

    // Count people for each hour
    logs.forEach(log => {
      if (log.timestamp) {
        const hour = new Date(log.timestamp.seconds * 1000).getHours();
        const dataPoint = hourlyData.find(d => d.hour === hour);
        if (dataPoint) {
          dataPoint.people++;
        }
      }
    });

    setRushTimeData(hourlyData);
  };

  const filterLogs = () => {
    let filtered = foodLogs;

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(log => 
        log.timestamp && new Date(log.timestamp.seconds * 1000).toDateString() === today
      );
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => 
        log.timestamp && new Date(log.timestamp.seconds * 1000) >= weekAgo
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Timestamp', 'User ID', 'Transaction ID', 'Status', 'Authenticated', 'Matches', 'Block Matches'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.userId || 'Unknown',
        log.transactionId || 'N/A',
        log.status || 'N/A',
        log.authenticated ? 'Yes' : 'No',
        log.matches || 0,
        log.blockMatches || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const getMealTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const hour = new Date(timestamp.seconds * 1000).getHours();
    if (hour >= 6 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    return 'Snacks/Dinner';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.03)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#212529', fontSize: '1.8rem' }}>Admin Dashboard</h1>
            <p style={{ margin: '5px 0 0', color: 'rgba(0,0,0,0.7)' }}>Food Authentication System</p>
          </div>
          <Link to="/" style={{
            background: '#212529',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500'
          }}>← Back to Auth</Link>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '20px' 
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#212529' }}>Today's Meals</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{stats.totalToday}</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#212529' }}>Success Rate</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{stats.successRate}%</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#212529' }}>Total Records</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212529' }}>{stats.totalEver}</div>
          </div>
        </div>

        {/* Rush Time Chart */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px', color: '#212529', fontSize: '1.3rem' }}>Today's Food Rush Pattern</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rushTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#212529"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#212529"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: '#212529' }}
                />
                <Bar 
                  dataKey="people" 
                  fill="rgba(0,0,0,0.7)"
                  radius={[4, 4, 0, 0]}
                  name="People"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ 
            margin: '15px 0 0', 
            color: 'rgba(0,0,0,0.7)', 
            fontSize: '0.9rem',
            textAlign: 'center' 
          }}>
            📊 Peak hours help plan better food distribution and reduce waiting times
          </p>
        </div>

        {/* Meal Time Breakdown */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px', color: '#212529' }}>Today's Meal Distribution</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>🌅 {stats.timeStats?.breakfast || 0}</div>
              <div style={{ color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem' }}>Breakfast (6-11 AM)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(0,0,0,0.08)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>🍽️ {stats.timeStats?.lunch || 0}</div>
              <div style={{ color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem' }}>Lunch (11 AM-4 PM)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#212529' }}>🍪 {stats.timeStats?.snacks || 0}</div>
              <div style={{ color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem' }}>Snacks/Dinner</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </select>
            
            <input
              type="text"
              placeholder="Search by User ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0,0,0,0.1)',
                minWidth: '250px',
                flex: 1
              }}
            />
            
            <button 
              onClick={exportToCSV}
              style={{
                background: '#212529',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              📊 Export CSV
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, color: '#212529' }}>Authentication Logs ({filteredLogs.length})</h3>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(0,0,0,0.6)' }}>
                No logs found for the selected criteria
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.05)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>User ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Meal Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{formatTimestamp(log.timestamp)}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{log.userId || 'Unknown'}</td>
                      <td style={{ padding: '12px' }}>{getMealTime(log.timestamp)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          background: log.authenticated ? '#d4edda' : '#f8d7da',
                          color: log.authenticated ? '#155724' : '#721c24'
                        }}>
                          {log.authenticated ? '✅ Success' : '❌ Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                        {log.transactionId?.substring(0, 20)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
