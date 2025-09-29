import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#212529' }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '4px 0', 
            color: entry.color,
            fontSize: '14px'
          }}>
            {`${entry.name}: ${formatter ? formatter(entry.value) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Rush Time Chart
export const RushTimeChart = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="rushGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.05}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
      <XAxis 
        dataKey="time" 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <YAxis 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area 
        type="monotone" 
        dataKey="count" 
        stroke="#1a1a1a" 
        strokeWidth={2}
        fill="url(#rushGradient)" 
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Meal Distribution Chart
export const MealDistributionChart = ({ data, height = 300 }) => {
  const COLORS = ['#1a1a1a', '#333', '#6c757d', '#adb5bd'];
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Weekly Trend Chart
export const WeeklyTrendChart = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
      <XAxis 
        dataKey="day" 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <YAxis 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <Tooltip content={<CustomTooltip />} />
      <Line 
        type="monotone" 
        dataKey="meals" 
        stroke="#1a1a1a" 
        strokeWidth={3}
        dot={{ fill: '#1a1a1a', strokeWidth: 2, r: 4 }}
        activeDot={{ r: 6, stroke: '#1a1a1a', strokeWidth: 2 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

// Usage Comparison Chart
export const UsageComparisonChart = ({ data, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
      <XAxis 
        dataKey="category" 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <YAxis 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar 
        dataKey="current" 
        fill="#1a1a1a" 
        radius={[4, 4, 0, 0]}
        name="This Period"
      />
      <Bar 
        dataKey="previous" 
        fill="#6c757d" 
        radius={[4, 4, 0, 0]}
        name="Previous Period"
      />
    </BarChart>
  </ResponsiveContainer>
);

// Simple Bar Chart
export const SimpleBarChart = ({ data, dataKey, height = 200, color = "#1a1a1a" }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
      <XAxis 
        dataKey="name" 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <YAxis 
        stroke="rgba(0,0,0,0.6)"
        fontSize={12}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar 
        dataKey={dataKey} 
        fill={color} 
        radius={[4, 4, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
);