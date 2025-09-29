import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import RegularAdminDashboard from './components/RegularAdminDashboard';
import AdminLogin from './auth/AdminLogin';
import AdminManagement from './auth/AdminManagement';
import EmailVerification from './components/EmailVerification';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from './auth/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/verify" element={<EmailVerification />} />
            
            {/* User Routes */}
            <Route path="/dashboard" element={<UserDashboard />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <RegularAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/manage" element={
              <ProtectedRoute requireSuperAdmin={true}>
                <AdminManagement />
              </ProtectedRoute>
            } />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin/dashboard" element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
