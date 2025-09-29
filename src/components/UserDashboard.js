import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import DashboardLayout from './shared/DashboardLayout';
import DashboardCard from './shared/DashboardCard';
import StatCard from './shared/StatCard';
import { RushTimeChart, WeeklyTrendChart, MealDistributionChart } from './shared/ChartComponents';

const UserDashboard = () => {
  const [searchParams] = useSearchParams();
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [weeklyData, setWeeklyData] = useState([]);
  const [rushTimeData, setRushTimeData] = useState([]);
  const [mealDistribution, setMealDistribution] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [currentWeekVerifications, setCurrentWeekVerifications] = useState(0);

  // Get user ID from URL parameters
  const userId = searchParams.get('user') || 'user@company.com'; // Fallback to default if no user param

  // Fetch user stats and verification history from Firebase
  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const userStatsRef = doc(db, 'userStats', userId);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
          const statsData = userStatsDoc.data();
          setUserStats(statsData);
          setWeeklyData(statsData.weeklyData || []);
          setRushTimeData(statsData.rushTimeData || []);
          setMealDistribution(statsData.mealDistribution || []);
        } else {
          // Initialize user stats if they don't exist
          await initializeUserStats(userId);
        }

        // Fetch verification history (meal history based on verifications)
        const verificationsQuery = query(
          collection(db, 'verifications'),
          where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(verificationsQuery, async (snapshot) => {
          const verificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            // Sort by timestamp descending (newest first)
            if (a.timestamp && b.timestamp) {
              return b.timestamp.toDate() - a.timestamp.toDate();
            }
            return 0;
          });
          
          setVerificationHistory(verificationsData);
          
          // Update user stats based on verification data
          await updateUserStatsFromVerifications(userId, verificationsData);
          
          // Calculate current week verifications
          const now = new Date();
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          startOfWeek.setHours(0, 0, 0, 0);
          
          const currentWeekCount = verificationsData.filter(verification => {
            const verificationDate = new Date(verification.timestamp.toDate());
            return verificationDate >= startOfWeek;
          }).length;
          
          setCurrentWeekVerifications(currentWeekCount);
        });

        setLoading(false);
        return () => unsubscribe();
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Initialize user stats document
  const initializeUserStats = async (userId) => {
    try {
      const userStatsRef = doc(db, 'userStats', userId);
      const initialStats = {
        todayMeals: 0,
        weeklyMeals: 0,
        monthlyMeals: 0,
        totalMeals: 0,
        currentStreak: 0,
        avgWeekly: 0,
        avgDaily: 0,
        favoriteTime: '12:00',
        weeklyData: [],
        rushTimeData: [],
        mealDistribution: [],
        lastUpdated: serverTimestamp()
      };
      await setDoc(userStatsRef, initialStats);
      setUserStats(initialStats);
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  };

  // Update user stats based on verification data
  const updateUserStatsFromVerifications = async (userId, verifications) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayVerifications = verifications.filter(v => new Date(v.timestamp.toDate()) >= today);
      const weekVerifications = verifications.filter(v => new Date(v.timestamp.toDate()) >= thisWeek);
      const monthVerifications = verifications.filter(v => new Date(v.timestamp.toDate()) >= thisMonth);

      // Calculate meal distribution using mealType field (fallback to hour-based calculation)
      const mealCounts = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
      weekVerifications.forEach(v => {
        if (v.mealType) {
          // Use the mealType field if available
          mealCounts[v.mealType] = (mealCounts[v.mealType] || 0) + 1;
        } else {
          // Fallback to hour-based calculation for older records
          const hour = new Date(v.timestamp.toDate()).getHours();
          if (hour >= 6 && hour < 11) mealCounts.breakfast++;
          else if (hour >= 11 && hour < 16) mealCounts.lunch++;
          else if (hour >= 16 && hour < 22) mealCounts.dinner++;
          else mealCounts.snack++;
        }
      });

      const mealDistribution = [
        { name: 'Breakfast', value: mealCounts.breakfast },
        { name: 'Lunch', value: mealCounts.lunch },
        { name: 'Dinner', value: mealCounts.dinner },
        { name: 'Snacks', value: mealCounts.snack }
      ];

      // Calculate weekly trend
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayVerifications = verifications.filter(v => {
          const vDate = new Date(v.timestamp.toDate());
          return vDate.toDateString() === date.toDateString();
        });
        weeklyTrend.push({
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          meals: dayVerifications.length
        });
      }

      // Calculate rush time data
      const hourCounts = new Array(24).fill(0);
      weekVerifications.forEach(v => {
        const hour = new Date(v.timestamp.toDate()).getHours();
        hourCounts[hour]++;
      });

      const rushData = hourCounts.map((count, hour) => ({
        time: `${hour}:00`,
        count
      })).filter(item => item.count > 0);

      // Calculate streak
      const streak = calculateStreakFromVerifications(verifications);

      // Get most active time
      const favoriteTime = getMostActiveTimeFromVerifications(weekVerifications);

      const updatedStats = {
        todayMeals: todayVerifications.length,
        weeklyMeals: weekVerifications.length,
        monthlyMeals: monthVerifications.length,
        totalMeals: verifications.length,
        currentStreak: streak,
        avgWeekly: weekVerifications.length,
        avgDaily: todayVerifications.length,
        favoriteTime,
        weeklyData: weeklyTrend,
        rushTimeData: rushData,
        mealDistribution,
        lastUpdated: serverTimestamp()
      };

      const userStatsRef = doc(db, 'userStats', userId);
      await updateDoc(userStatsRef, updatedStats);
      setUserStats(updatedStats);
      setWeeklyData(weeklyTrend);
      setRushTimeData(rushData);
      setMealDistribution(mealDistribution);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  const calculateStreakFromVerifications = (verifications) => {
    if (verifications.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    for (let i = 0; i < 30; i++) {
      const dayVerifications = verifications.filter(v => {
        const vDate = new Date(v.timestamp.toDate());
        return vDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayVerifications.length > 0) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const getMostActiveTimeFromVerifications = (verifications) => {
    const hourCounts = {};
    verifications.forEach(v => {
      const hour = new Date(v.timestamp.toDate()).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const mostActiveHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, '12'
    );
    
    return `${mostActiveHour}:00`;
  };





  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.toDate()).toLocaleString();
  };

  const getMealTime = (verification) => {
    if (!verification) return 'Unknown';
    
    // Use mealType field if available
    if (verification.mealType) {
      return verification.mealType.charAt(0).toUpperCase() + verification.mealType.slice(1);
    }
    
    // Fallback to hour-based calculation
    if (!verification.timestamp) return 'Unknown';
    const hour = new Date(verification.timestamp.toDate()).getHours();
    if (hour >= 6 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 22) return 'Dinner';
    return 'Snack';
  };

  return (
    <DashboardLayout
      title="Welcome Back!"
      subtitle="Track your meal history and discover your eating patterns"
      userType="user"
      currentPage="dashboard"
      userEmail={userId}
      userRole="user"
    >
      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '24px' 
      }}>
        <StatCard
          title="Today's Meals"
          value={userStats.todayMeals || 0}
          icon="🍽️"
          trend={userStats.todayMeals > userStats.avgDaily ? 'up' : userStats.todayMeals < userStats.avgDaily ? 'down' : 'neutral'}
          trendValue={`vs ${userStats.avgDaily || 0} avg`}
        />
        <StatCard
          title="This Week"
          value={userStats.weeklyMeals || 0}
          icon="📅"
          trend={userStats.weeklyMeals > (userStats.lastWeekMeals || 0) ? 'up' : userStats.weeklyMeals < (userStats.lastWeekMeals || 0) ? 'down' : 'neutral'}
          trendValue={`vs ${userStats.lastWeekMeals || 0} last week`}
        />
        <StatCard
          title="Weekly Verifications"
          value={currentWeekVerifications}
          icon="✅"
          trend="neutral"
          trendValue={`${userStats.totalMeals || 0} total`}
        />
        <StatCard
          title="Current Streak"
          value={`${userStats.currentStreak || 0} days`}
          icon="🔥"
        />
        <StatCard
          title="Favorite Time"
          value={userStats.favoriteTime || '12:00'}
          icon="⏰"
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
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'history', label: 'History', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
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
              title="Weekly Meal Trend"
              icon="📈"
              loading={loading}
            >
              <WeeklyTrendChart data={weeklyData} height={250} />
            </DashboardCard>


          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <DashboardCard
              title="Meal Distribution"
              icon="🥘"
              loading={loading}
            >
              <MealDistributionChart data={mealDistribution} height={200} />
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                Based on this week's activity
              </div>
            </DashboardCard>

            <DashboardCard
              title="Recent Activity"
              icon="🕐"
            >
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {verificationHistory.slice(0, 5).map(verification => (
                  <div
                    key={verification.id}
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
                        {getMealTime(verification)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                        {formatTimestamp(verification.timestamp)}
                      </div>
                    </div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: verification.verified ? '#1a1a1a' : '#6c757d'
                    }} />
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <DashboardCard
            title="Rush Time Analysis"
            icon="⏰"
            loading={loading}
          >
            <RushTimeChart data={rushTimeData} height={250} />
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
              Your most active eating times this week
            </div>
          </DashboardCard>

          <DashboardCard
            title="Monthly Summary"
            icon="📊"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Total Meals</span>
                <span style={{ fontWeight: '600', fontSize: '18px' }}>{userStats.monthlyMeals || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Daily Average</span>
                <span style={{ fontWeight: '600', fontSize: '18px' }}>
                  {((userStats.monthlyMeals || 0) / new Date().getDate()).toFixed(1)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(0,0,0,0.7)' }}>Best Streak</span>
                <span style={{ fontWeight: '600', fontSize: '18px' }}>{userStats.currentStreak || 0} days</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {activeTab === 'analytics' && (
        <DashboardCard
          title="Verification Analytics"
          icon="✅"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                {currentWeekVerifications}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                📅 This Week
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                {mealDistribution.find(m => m.name === 'Breakfast')?.value || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                🌅 Breakfast
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                {mealDistribution.find(m => m.name === 'Lunch')?.value || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                🌞 Lunch
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a' }}>
                {mealDistribution.find(m => m.name === 'Dinner')?.value || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', marginTop: '4px' }}>
                🌙 Dinner
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>
            Total verifications: {userStats.totalMeals || 0}
          </div>
        </DashboardCard>
      )}

      {activeTab === 'history' && (
        <DashboardCard
          title="Meal History"
          icon="📋"
          loading={loading}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Date & Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Meal Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Method</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {verificationHistory.map(verification => (
                  <tr key={verification.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{formatTimestamp(verification.timestamp)}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{getMealTime(verification)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: 'rgba(0,123,255,0.1)',
                        color: '#007bff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {verification.method || 'QR Scan'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: verification.verified ? '#1a1a1a' : '#6c757d',
                        fontWeight: '500'
                      }}>
                        {verification.verified ? '✅ Verified' : '❌ Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}
    </DashboardLayout>
  );
};

export default UserDashboard;