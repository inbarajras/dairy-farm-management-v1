// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, supabase } from '../lib/supabase';
import { fetchCurrentUser } from '../components/services/userService';

// Create the context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount and subscription to auth changes
  useEffect(() => {
    // Get the current session
    const checkUser = async () => {
      try {
        setLoading(true);
        
        // Get the current session and user
        const { session } = await auth.getSession();
        
        if (session) {
          const { user: currentUser } = await auth.getCurrentUser();
          setUser(currentUser);
          
          // Fetch complete user profile with role information
          try {
            const profile = await fetchCurrentUser();
            setUserProfile(profile);
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError(err.message);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // Call check user initially
    checkUser();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    // Cleanup subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context value
  const value = {
    user,
    userProfile,
    loading,
    error,
    signOut,
    isAuthenticated: !!user,
    role: userProfile?.role || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;