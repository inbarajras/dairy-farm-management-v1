import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const roleColors = {
  'Administrator': 'bg-purple-100 text-purple-800 border-purple-200',
  'Manager': 'bg-blue-100 text-blue-800 border-blue-200',
  'Helper': 'bg-gray-100 text-gray-800 border-gray-200',
};

const UserRoleBadge = ({ className = '' }) => {
  const { userProfile } = useAuth();
  
  if (!userProfile || !userProfile.role) {
    return null;
  }
  
  const role = userProfile.role;
  const colorClass = roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClass} ${className}`}>
      {role}
    </span>
  );
};

export default UserRoleBadge;
