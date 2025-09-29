import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const DashboardLayout = ({ 
  title, 
  subtitle, 
  children, 
  userType = 'user', // 'user', 'admin', 'super_admin'
  currentPage = 'dashboard',
  userEmail = null, // For regular users who don't use AuthContext
  userRole = 'user' // Default role for regular users
}) => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      if (userType === 'user') {
        navigate('/');
      } else {
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNavItems = () => {
    switch (userType) {
      case 'super_admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: '📊' },
          { path: '/admin/manage', label: 'Manage Admins', icon: '👥' },
          { path: '/admin/users', label: 'Users', icon: '👤' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
          { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: '📊' },
          { path: '/admin/users', label: 'Users', icon: '👤' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' }
        ];
      case 'user':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: '🏠' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: 'white',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000
      }}>
        {/* Logo/Brand */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #007bff, #0056b3)'
        }}>
          <h2 style={{
            margin: 0,
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🍽️ FoodAuth
          </h2>
          <p style={{
            margin: '4px 0 0',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {userType === 'user' ? 'User Portal' : 'Admin Portal'}
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: currentPage === item.label.toLowerCase() ? '#007bff' : 'rgba(0,0,0,0.7)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                background: currentPage === item.label.toLowerCase() ? 'rgba(0,123,255,0.1)' : 'transparent',
                borderRight: currentPage === item.label.toLowerCase() ? '3px solid #007bff' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(0,0,0,0.02)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {(userEmail || userData?.email)?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#212529',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {userEmail || userData?.email}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(0,0,0,0.6)',
                textTransform: 'capitalize'
              }}>
                {(userRole || userData?.role)?.replace('_', ' ')}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(220,53,69,0.1)',
              color: '#dc3545',
              border: '1px solid rgba(220,53,69,0.2)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginLeft: '260px', 
        flex: 1, 
        padding: '24px',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h1 style={{
            margin: 0,
            color: '#212529',
            fontSize: '1.75rem',
            fontWeight: '700'
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '8px 0 0',
              color: 'rgba(0,0,0,0.6)',
              fontSize: '14px'
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;