import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = '#007bff',
  size = 'medium' 
}) => {
  const sizes = {
    small: { padding: '16px', fontSize: '1.5rem' },
    medium: { padding: '20px', fontSize: '2rem' },
    large: { padding: '24px', fontSize: '2.5rem' }
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return '#28a745';
    if (trend === 'down') return '#dc3545';
    return '#6c757d';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '➡️';
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: sizes[size].padding,
      boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: '#1a1a1a'
      }} />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '24px',
          color: '#1a1a1a',
          opacity: 0.8
        }}>
          {icon}
        </div>
        
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: getTrendColor(trend),
            fontWeight: '500'
          }}>
            <span>{getTrendIcon(trend)}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div style={{
        fontSize: sizes[size].fontSize,
        fontWeight: '700',
        color: '#212529',
        marginBottom: '4px',
        lineHeight: 1
      }}>
        {value}
      </div>
      
      <div style={{
        fontSize: '14px',
        color: 'rgba(0,0,0,0.6)',
        fontWeight: '500'
      }}>
        {title}
      </div>
    </div>
  );
};

export default StatCard;