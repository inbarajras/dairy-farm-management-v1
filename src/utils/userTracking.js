// Utility functions for user tracking in CRUD operations
import { supabase } from '../lib/supabase';

/**
 * Get the current authenticated user's ID
 * @returns {Promise<string|null>} User ID or null if not authenticated
 */
export const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

/**
 * Get user tracking fields for create operations
 * @returns {Promise<Object>} Object with created_by field
 */
export const getCreateUserTracking = async () => {
  const userId = await getCurrentUserId();
  return {
    created_by: userId
  };
};

/**
 * Get user tracking fields for update operations
 * @returns {Promise<Object>} Object with updated_by field
 */
export const getUpdateUserTracking = async () => {
  const userId = await getCurrentUserId();
  return {
    updated_by: userId
  };
};

/**
 * Format user tracking display text
 * @param {string} email - User email
 * @param {string} timestamp - Timestamp string
 * @returns {string} Formatted display text
 */
export const formatUserTrackingDisplay = (email, timestamp) => {
  if (!email) return 'Unknown';

  const userName = email.split('@')[0]; // Extract name from email
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  let timeText;
  if (diffInHours < 1) {
    timeText = 'just now';
  } else if (diffInHours < 24) {
    timeText = `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 168) {
    timeText = `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    timeText = date.toLocaleDateString();
  }

  return `${userName} • ${timeText}`;
};

/**
 * Get user information from email
 * @param {string} email - User email
 * @returns {Object} User display information
 */
export const getUserDisplayInfo = (email) => {
  if (!email) return { name: 'Unknown', initials: '?' };

  const name = email.split('@')[0];
  const initials = name
    .split(/[\s._-]+/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    name: name.replace(/[._-]/g, ' '),
    initials: initials || '?',
    email
  };
};
