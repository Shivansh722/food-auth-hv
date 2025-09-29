import React from 'react';

const DashboardCard = ({ 
  title, 
  children, 
  icon, 
  action, 
  className = '', 
  headerColor = '#212529',
  loading = false 
}) => {
  return (
    <div className={`dashboard-card ${className}`} style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #007bff, #28a745, #007bff)',
          backgroundSize: '200% 100%',
          animation: 'loading 2s infinite'
        }} />
      )}
      
      {(title || icon || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon && (
              <div style={{
                fontSize: '24px',
                color: headerColor,
                display: 'flex',
                alignItems: 'center'
              }}>
                {icon}
              </div>
            )}
            {title && (
              <h3 style={{
                margin: 0,
                color: headerColor,
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                {title}
              </h3>
            )}
          </div>
          {action && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {action}
            </div>
          )}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
      `}</style>
    </div>
  );
};

export default DashboardCard;