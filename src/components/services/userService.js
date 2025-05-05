import { supabase } from '../../lib/supabase';

export const fetchCurrentUser = async () => {
    try {
      // First get the current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!authData?.user) return null;
      
      // Then fetch the full profile data
      const { data, error } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', authData.user.id)
        .single();
      
      if (error) throw error;
      
      // Update last login time
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);
        
      return {
        id: data.id,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        name: data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email,
        role: data.role,
        status: data.status,
        phone: data.phone || '',
        address: data.address || '',
        jobTitle: data.job_title || '',
        department: data.department || '',
        lastLogin: data.last_login,
        dateJoined: data.date_joined,
        workSchedule: data.work_schedule || 'Full-time',
        twoFactorEnabled: data.two_factor_enabled,
        profileImage: data.profile_image,
        bio: data.bio || '',
        skills: data.skills || [],
        certifications: data.certifications || []
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  };


/**
 * Fetch all users
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name');
    
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.display_name || `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLogin: user.last_login,
    twoFactorEnabled: user.two_factor_enabled,
    profileImage: user.profile_image || 'https://via.placeholder.com/120'
  }));
};

/**
 * Create a new user
 * This uses standard Supabase signup rather than admin API
 */
export const createUser = async (userData) => {
  try {
    // First create the auth user via signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role
        }
      }
    });
    
    if (authError) throw authError;
    
    // Then manually update the profile record
    // This is needed because RLS policies might prevent the trigger from working properly
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        display_name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        status: userData.status,
        two_factor_enabled: userData.twoFactorEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);
    
    if (profileError) {
      console.warn('Error updating profile:', profileError);
      // Continue even if this fails as the trigger should handle it
    }
    
    // Log action
    await logAuditAction('user_created', { 
      userId: authData.user.id,
      email: userData.email,
      role: userData.role
    });
    
    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update an existing user
 */
export const updateUser = async (userId, userData) => {
  try {
    const updates = {
      ...(userData.name && {
        display_name: userData.name,
        // Split name into first and last
        first_name: userData.name.split(' ')[0] || '',
        last_name: userData.name.split(' ').slice(1).join(' ') || ''
      }),
      ...(userData.email && { email: userData.email }),
      ...(userData.role && { role: userData.role }),
      ...(userData.status && { status: userData.status }),
      two_factor_enabled: userData.twoFactorEnabled,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log action
    await logAuditAction('user_updated', { userId, updates: Object.keys(updates) });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete a user
 * Note: In production, this should be handled by a secure server endpoint
 */
export const deleteUser = async (userId) => {
  try {
    // In production, this requires admin privileges via a server endpoint
    // For now, we'll just delete from the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'Deleted', updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log action
    await logAuditAction('user_deleted', { userId });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Reset user password
 * Note: This requires a server endpoint in production
 */
export const resetUserPassword = async (userId, newPassword) => {
  try {
    // For demo purposes - normally this would be done via admin API on the server
    // Instead we'll send a password reset email to the user
    
    // First get the user's email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
      redirectTo: window.location.origin
    });
    
    if (error) throw error;
    
    // Log action
    await logAuditAction('password_reset_requested', { userId });
    
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

/**
 * Update user status
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    // Log action
    await logAuditAction('status_updated', { userId, status });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Log an audit action
 */
export const logAuditAction = async (action, details) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) return;
    
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        details,
        ip_address: 'client' // In production, use a server to get the real IP
      });
  } catch (error) {
    console.error('Error logging audit action:', error);
  }
};