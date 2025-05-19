import { supabase } from '../../lib/supabase';

// Fetch all shift templates
export const getShiftTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    return [];
  }
};

// Add a new shift template
export const addShiftTemplate = async (templateData) => {
  try {
    const { data, error } = await supabase
      .from('shift_templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding shift template:', error);
    throw error;
  }
};

// Update an existing shift template
export const updateShiftTemplate = async (templateId, templateData) => {
  try {
    const { data, error } = await supabase
      .from('shift_templates')
      .update(templateData)
      .eq('id', templateId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating shift template with ID ${templateId}:`, error);
    throw error;
  }
};

// Delete a shift template
export const deleteShiftTemplate = async (templateId) => {
  try {
    const { error } = await supabase
      .from('shift_templates')
      .delete()
      .eq('id', templateId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting shift template with ID ${templateId}:`, error);
    throw error;
  }
};
