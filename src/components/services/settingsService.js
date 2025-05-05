// src/services/settingsService.js
import { supabase } from '../../lib/supabase';

// Fetch all system settings
export const fetchSystemSettings = async () => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');
    
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  const settings = {};
  data.forEach(item => {
    settings[item.key] = item.value;
  });
  
  return settings;
};

// Update system settings
export const updateSystemSettings = async (category, value) => {
  try {
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('key', category);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};