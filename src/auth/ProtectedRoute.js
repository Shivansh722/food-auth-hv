import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requireSuperAdmin = false }) => {
  const { currentUser, userData } = useAuth();

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!userData || !userData.isActive) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireSuperAdmin && userData.role !== 'super_admin') {
    return (
      <div className="unauthorized">
        <h2>Unauthorized</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;