import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create role-based access context
const RoleContext = createContext();

// Define module access configuration
const moduleAccess = {
  dashboard: ['Administrator'],
  cows: ['Administrator', 'Manager', 'Helper'],
  milk: ['Administrator', 'Manager', 'Helper'],
  health: ['Administrator', 'Manager'],
  employees: ['Administrator', 'Manager'],
  inventory: ['Administrator', 'Manager'],
  finances: ['Administrator', 'Manager'],
  settings: ['Administrator']
};

export const RoleProvider = ({ children }) => {
  const { userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set the user role when user profile is loaded
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && userProfile) {
        setUserRole(userProfile.role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    }
  }, [isAuthenticated, userProfile, authLoading]);

  // Check if user has access to a specific module
  const hasAccess = (module) => {
    if (!userRole || !moduleAccess[module]) return false;
    return moduleAccess[module].includes(userRole);
  };

  // Permission definitions based on user role
  const permissions = {
    'Administrator': ['cow:create', 'cow:read', 'cow:update', 'cow:delete', 
                      'milk:create', 'milk:read', 'milk:update', 'milk:delete',
                      'health:create', 'health:read', 'health:update', 'health:delete',
                      'breeding:create', 'breeding:read', 'breeding:update', 'breeding:delete', 
                      'growth:create', 'growth:read', 'growth:update', 'growth:delete'],
    'Manager': ['cow:create', 'cow:read', 'cow:update', 
                'milk:create', 'milk:read', 'milk:update',
                'health:create', 'health:read', 'health:update',
                'breeding:create', 'breeding:read', 'breeding:update',
                'growth:create', 'growth:read', 'growth:update'],
    'Helper': ['cow:read', 'milk:create', 'milk:read', 'health:read', 'breeding:read', 'growth:read'],
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!userRole || !permissions[userRole]) {
      // Default to true for Administrator role if no role is set (for development)
      // Remove this in production or adjust based on security needs
      console.warn('Role permission check failed - defaulting to restricted access');
      return false;
    }
    return permissions[userRole].includes(permission);
  };

  // Context value
  const contextValue = {
    userRole,
    loading: loading || authLoading,
    hasAccess,
    hasPermission,
    moduleAccess
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

// Custom hook to use the role context
export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export default RoleContext;
