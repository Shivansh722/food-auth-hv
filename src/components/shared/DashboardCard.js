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
          background: '#1a1a1a',
          backgroundSize: '200% 100%',
          animation: 'loading 2s infinite'
        }} />
      )}
      
      {(title || icon || action) && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          background: headerColor || '#1a1a1a'
        }}>
          <h3 style={{
            margin: 0,
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {icon && <span>{icon}</span>}
            {title}
          </h3>
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