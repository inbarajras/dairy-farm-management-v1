// src/services/auditService.js
import { supabase } from '../../lib/supabase';

/**
 * Log an audit action
 */
export const logAuditAction = async (action, details) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    
    // Get client IP address (in a real app, this would come from the server)
    let ipAddress = 'unknown';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (error) {
      console.error('Error getting IP address:', error);
    }
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        action,
        details,
        ip_address: ipAddress
      });
      
    if (error) {
      console.error('Error logging audit action:', error);
    }
  } catch (error) {
    console.error('Error in audit logging:', error);
  }
};

/**
 * Fetch audit logs with pagination
 */
export const fetchAuditLogs = async (options = {}) => {
  const { 
    page = 1, 
    pageSize = 20, 
    userId = null, 
    action = null,
    startDate = null,
    endDate = null 
  } = options;
  
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:user_id (display_name, email)
    `, { count: 'exact' });
  
  // Apply filters
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (action) {
    query = query.eq('action', action);
  }
  
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  
  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  
  query = query
    .order('created_at', { ascending: false })
    .range(start, end);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
  
  return {
    logs: data,
    totalCount: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  };
};