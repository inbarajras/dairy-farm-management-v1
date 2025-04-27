// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://lpbqcskmlgfysijtxsau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYnFjc2ttbGdmeXNpanR4c2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODg3MjIsImV4cCI6MjA2MTI2NDcyMn0.2nzuxsqshaDcrY1TeXgiiCCoLr9z5uOAsM4yFdWqGQU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anonymous Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const auth = {
  // Sign up a new user
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      // Get the user's profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        user.profile = profile;
      }
    }
    
    return { user, error };
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  },

  // Update password with recovery token
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { data, error };
  },

  // Get the current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },
  
  // Send OTP to email
  sendOTP: async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    });
    return { data, error };
  },
  
  // Verify OTP
  verifyOTP: async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    return { data, error };
  }
};

export default supabase;