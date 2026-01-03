import { supabase } from '../../lib/supabase';

// Fetch all health events with cow details
export const fetchHealthEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('health_events')
      .select(`
        *,
        cows:cow_id (id, name, tag_number, breed, owner)
      `)
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    
    // Format the data to match the expected structure
    return data.map(event => ({
      id: event.id,
      cowId: event.cow_id,
      cowName: event.cows ? event.cows.name : 'Unknown',
      cowTag: event.cows ? event.cows.tag_number : 'Unknown',
      eventType: event.event_type,
      eventDate: event.event_date,
      description: event.description,
      performedBy: event.performed_by,
      medications: event.medications || [],
      notes: event.notes || '',
      followUp: event.follow_up,
      status: event.status
    }));
  } catch (error) {
    console.error('Error fetching health events:', error);
    throw error;
  }
};

// Fetch health events for a specific cow
export const fetchCowHealthEvents = async (cowId) => {
  try {
    const { data, error } = await supabase
      .from('health_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching health events for cow ${cowId}:`, error);
    throw error;
  }
};

// Add a new health event
export const addHealthEvent = async (eventData) => {
  try {
    // Make sure medications is properly formatted as an array
    const medications = eventData.medications || [];
    
    // Convert data to the database schema
    const dbRecord = {
      cow_id: eventData.cowId,
      event_type: eventData.eventType,
      event_date: eventData.eventDate,
      description: eventData.description,
      performed_by: eventData.performedBy,
      // Ensure medications is stored as a proper JSONB array, not a string
      medications: Array.isArray(medications) ? medications : [],
      notes: eventData.notes,
      follow_up: eventData.followUp || null,
      status: eventData.status
    };
    
    const { data, error } = await supabase
      .from('health_events')
      .insert(dbRecord)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding health event:', error);
    throw error;
  }
};

//updateHealthEvent function
export const updateHealthEvent = async (eventId, eventData) => {
  try {
    // Make sure medications is properly formatted as an array
    const medications = eventData.medications || [];
    
    // Convert data to the database schema
    const dbRecord = {
      cow_id: eventData.cowId,
      event_type: eventData.eventType,
      event_date: eventData.eventDate,
      description: eventData.description,
      performed_by: eventData.performedBy,
      // Ensure medications is stored as a proper JSONB array
      medications: Array.isArray(medications) ? medications : [],
      notes: eventData.notes,
      follow_up: eventData.followUp || null,
      status: eventData.status
    };
    
    const { data, error } = await supabase
      .from('health_events')
      .update(dbRecord)
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating health event ${eventId}:`, error);
    throw error;
  }
};

// Delete a health event
export const deleteHealthEvent = async (eventId) => {
  try {
    const { error } = await supabase
      .from('health_events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting health event ${eventId}:`, error);
    throw error;
  }
};

// Fetch all cows for dropdown selection
export const fetchCowsForSelection = async () => {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('id, name, tag_number, breed')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching cows for selection:', error);
    throw error;
  }
};

// Generate health statistics
export const generateHealthStats = async () => {
  try {
    // Get current date
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Format dates for Supabase query
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Active cases (in progress or monitoring)
    const { data: activeCases, error: activeError } = await supabase
      .from('health_events')
      .select('id')
      .in('status', ['In progress', 'Monitoring']);
    
    if (activeError) throw activeError;
    
    // Scheduled checkups (follow_up date is today or in the future and status is not Completed)
    const { data: scheduledCheckups, error: scheduledError } = await supabase
      .from('health_events')
      .select('id')
      .gte('follow_up', todayStr)
      .neq('status', 'Completed');
    
    if (scheduledError) throw scheduledError;
    
    // Treated in last month
    const { data: treatedLastMonth, error: treatedError } = await supabase
      .from('health_events')
      .select('id')
      .gte('event_date', thirtyDaysAgoStr)
      .eq('status', 'Completed');
    
    if (treatedError) throw treatedError;
    
    // Vaccinations count
    const { data: vaccinations, error: vaccinationError } = await supabase
      .from('health_events')
      .select('id')
      .eq('event_type', 'Vaccination')
      .gte('event_date', `${today.getFullYear()}-01-01`);
    
    if (vaccinationError) throw vaccinationError;
    
    // Common issues (analyze health event types for the last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
    
    const { data: healthIssues, error: issuesError } = await supabase
      .from('health_events')
      .select('description')
      .gte('event_date', threeMonthsAgoStr);
    
    if (issuesError) throw issuesError;
    
    // Process health issues to find common ones
    const issuesMap = {};
    healthIssues.forEach(issue => {
      const desc = issue.description.toLowerCase();
      
      // Check for common conditions
      if (desc.includes('mastitis')) {
        issuesMap.Mastitis = (issuesMap.Mastitis || 0) + 1;
      } else if (desc.includes('lame') || desc.includes('hoof') || desc.includes('foot')) {
        issuesMap.Lameness = (issuesMap.Lameness || 0) + 1;
      } else if (desc.includes('respiratory') || desc.includes('breath') || desc.includes('cough')) {
        issuesMap.Respiratory = (issuesMap.Respiratory || 0) + 1;
      } else if (desc.includes('digest') || desc.includes('diarrhea') || desc.includes('stomach')) {
        issuesMap.Digestive = (issuesMap.Digestive || 0) + 1;
      } else {
        issuesMap.Other = (issuesMap.Other || 0) + 1;
      }
    });
    
    const commonIssues = Object.keys(issuesMap).map(name => ({
      name,
      count: issuesMap[name]
    })).sort((a, b) => b.count - a.count);
    
    // Monthly data for treatments and checkups
    const monthlyData = [];
    for (let i = 3; i >= 0; i--) {
      const month = new Date();
      month.setMonth(today.getMonth() - i);
      
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      
      // Count treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('health_events')
        .select('id')
        .in('event_type', ['Treatment', 'Surgery'])
        .gte('event_date', monthStartStr)
        .lte('event_date', monthEndStr);
      
      if (treatmentsError) throw treatmentsError;
      
      // Count checkups
      const { data: checkupsData, error: checkupsError } = await supabase
        .from('health_events')
        .select('id')
        .in('event_type', ['Examination', 'Regular Checkup', 'Hoof Trimming'])
        .gte('event_date', monthStartStr)
        .lte('event_date', monthEndStr);
      
      if (checkupsError) throw checkupsError;
      
      monthlyData.push({
        month: month.toLocaleString('default', { month: 'short' }),
        treatments: treatmentsData.length,
        checkups: checkupsData.length
      });
    }
    
    return {
      activeCases: activeCases.length,
      scheduledCheckups: scheduledCheckups.length,
      treatedLastMonth: treatedLastMonth.length,
      totalVaccinations: vaccinations.length,
      commonIssues,
      monthlyData
    };
  } catch (error) {
    console.error('Error generating health statistics:', error);
    throw error;
  }
};

// Create vaccination schedule table if it doesn't exist in your database schema
export const createVaccinationScheduleIfNeeded = async () => {
  // This would typically be done through migrations
  // For demo purposes, we'll just check if data exists already
  try {
    const { data, error } = await supabase
      .from('vaccination_schedule')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Vaccination schedule table needs to be created');
      // In a real app, you would create the table or use migrations
      // For now we'll return an empty array
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error checking vaccination schedule:', error);
    return [];
  }
};

// Fetch vaccination schedule
export const fetchVaccinationSchedule = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if table exists first
    await createVaccinationScheduleIfNeeded();

    // Get vaccinations from vaccination_schedule table
    const { data: vacScheduleData, error: vacScheduleError } = await supabase
      .from('vaccination_schedule')
      .select(`
        id,
        cow_id,
        vaccination_type,
        due_date,
        status,
        assigned_to,
        notes,
        cows:cow_id (id, name, tag_number)
      `)
      .not('status', 'eq', 'Completed')
      .order('due_date');

    if (vacScheduleError) throw vacScheduleError;

    // Also get scheduled vaccinations from health_events table
    // Only get events that are explicitly scheduled (not completed ones with follow-up dates)
    const { data: healthEventsVac, error: healthError } = await supabase
      .from('health_events')
      .select(`
        id,
        cow_id,
        event_type,
        event_date,
        status,
        performed_by,
        description,
        cows:cow_id (id, name, tag_number)
      `)
      .eq('event_type', 'Vaccination')
      .eq('status', 'Scheduled')
      .gte('event_date', today)
      .order('event_date');

    if (healthError) {
      console.log('No health events vaccinations found:', healthError);
    }

    // Combine both sources
    const scheduledVaccinations = vacScheduleData.map(vac => ({
      id: `vac-${vac.id}`,
      cowId: vac.cow_id,
      cowName: vac.cows ? vac.cows.name : 'Unknown',
      cowTag: vac.cows ? vac.cows.tag_number : 'N/A',
      vaccinationType: vac.vaccination_type,
      dueDate: vac.due_date,
      status: vac.status || 'Scheduled',
      assignedTo: vac.assigned_to || 'Unassigned'
    }));

    const healthEventsVaccinations = healthEventsVac ? healthEventsVac.map(event => ({
      id: `event-${event.id}`,
      cowId: event.cow_id,
      cowName: event.cows ? event.cows.name : 'Unknown',
      cowTag: event.cows ? event.cows.tag_number : 'N/A',
      vaccinationType: event.description || 'Vaccination',
      dueDate: event.event_date,
      status: event.status || 'Scheduled',
      assignedTo: event.performed_by || 'Unassigned'
    })) : [];

    // Merge and sort by due date
    const allVaccinations = [...scheduledVaccinations, ...healthEventsVaccinations];
    allVaccinations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return allVaccinations;
  } catch (error) {
    console.error('Error fetching vaccination schedule:', error);
    return [];
  }
};

// Let's also create a medications table and functions since it's referenced in our component
export const createMedicationsTableIfNeeded = async () => {
  // Similar approach as above - would typically be handled by migrations
  try {
    const { data, error } = await supabase
      .from('medications')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Medications table needs to be created');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error checking medications table:', error);
    return [];
  }
};

// Fetch medications inventory
export const fetchMedications = async () => {
  try {
    // Check if table exists first
    await createMedicationsTableIfNeeded();
    
    // If the table exists, fetch data
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('name');
    
    if (error) {
      // If we get a different error than "table doesn't exist", throw it
      if (error.code !== '42P01') throw error;
      
      // If table doesn't exist, just return mock data for demo
      return mockHealthData.medications;
    }
    
    return data.length > 0 ? data : mockHealthData.medications;
  } catch (error) {
    console.error('Error fetching medications:', error);
    // Return mock data as fallback
    return mockHealthData.medications;
  }
};

// Add a medication to inventory
export const addMedication = async (medicationData) => {
  try {
    // Try to create table first if needed
    await createMedicationsTableIfNeeded();
    
    // Try to insert data
    const { data, error } = await supabase
      .from('medications')
      .insert({
        name: medicationData.name,
        type: medicationData.type,
        stock: parseInt(medicationData.stock),
        unit: medicationData.unit,
        expiration_date: medicationData.expirationDate,
        supplier: medicationData.supplier,
        reorder_level: medicationData.reorderLevel ? parseInt(medicationData.reorderLevel) : null,
        notes: medicationData.notes
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding medication:', error);
    throw error;
  }
};

// Mock data for fallback
const mockHealthData = {
  // Include your existing mock data here as fallback
  medications: [
    { 
      id: 'M001', 
      name: 'BVD Vaccine', 
      type: 'Vaccine', 
      stock: 45, 
      unit: 'doses', 
      expirationDate: '2023-12-15',
      supplier: 'VetSupply Inc.'
    },
    { 
      id: 'M002', 
      name: 'Mastitis Treatment', 
      type: 'Antibiotic', 
      stock: 12, 
      unit: 'tubes', 
      expirationDate: '2023-10-30',
      supplier: 'AnimalHealth Co.'
    },
    // ...rest of your mock medications
  ]
};