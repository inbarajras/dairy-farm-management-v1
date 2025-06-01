import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { AlertTriangle } from 'lucide-react';

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
    <AlertTriangle size={64} className="text-yellow-500 mb-4" />
    <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
    <p className="text-gray-600 text-center max-w-md mb-4">
      You don't have permission to access this page.
      Please contact your administrator if you believe this is an error.
    </p>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

// Component to protect routes based on authentication and role
const RequireAuth = ({ children, requiredRole }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useRole();
  
  const loading = authLoading || roleLoading;
  
  // Show loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, render nothing (app will redirect to login)
  if (!isAuthenticated) {
    return null;
  }
  
  // If role is required and user doesn't have the required role, show access denied
  if (requiredRole && (!userRole || !requiredRole.includes(userRole))) {
    return <AccessDenied />;
  }
  
  // User is authenticated and has required role, render children
  return children;
};

export default RequireAuth;
