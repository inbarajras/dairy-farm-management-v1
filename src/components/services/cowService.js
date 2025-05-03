import { supabase } from '../../lib/supabase'

// Fetch all cows
export const fetchCows = async () => {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('*, milk_production(*)')
      .order('id', { ascending: true })

    if (error) throw error
    
    // Transform the data to match the component's expected format
    return data.map(cow => ({
      id: cow.id,
      tagNumber: cow.tag_number,
      name: cow.name,
      breed: cow.breed,
      dateOfBirth: cow.date_of_birth,
      age: calculateAge(cow.date_of_birth),
      status: cow.status,
      healthStatus: cow.health_status,
      owner: cow.owner,
      milkProduction: cow.milk_production.map(record => ({
        date: record.date,
        amount: record.amount
      })),
      lastHealthCheck: cow.last_health_check,
      vaccinationStatus: cow.vaccination_status,
      alerts: cow.alerts ? JSON.parse(cow.alerts) : [],
      image: cow.image_url || '/api/placeholder/160/160'
    }))
  } catch (error) {
    console.error('Error fetching cows:', error)
    throw error
  }
}

// Add a new cow
export const addCow = async (cowData) => {
  try {
    // Transform the data to match the database schema
    const dbCow = {
      tag_number: cowData.tagNumber,
      name: cowData.name,
      breed: cowData.breed,
      date_of_birth: cowData.dateOfBirth,
      status: cowData.status,
      health_status: cowData.healthStatus,
      owner: cowData.owner,
      last_health_check: cowData.lastHealthCheck,
      vaccination_status: cowData.vaccinationStatus,
      alerts: JSON.stringify(cowData.alerts || []),
      image_url: cowData.image,
      purchase_date: cowData.purchaseDate || null,
      purchase_price: cowData.purchasePrice || null,
      initial_weight: cowData.initialWeight || null,
      notes: cowData.notes || null
    }
    console.log('dbCow', dbCow);

    const { data, error } = await supabase
      .from('cows')
      .insert(dbCow)
      .select()

    if (error) throw error
    
    // Add initial milk production record if provided
    if (cowData.milkProduction && cowData.milkProduction.length > 0) {
      const initialMilkRecord = {
        cow_id: data[0].id,
        date: cowData.milkProduction[0].date,
        amount: cowData.milkProduction[0].amount,
        quality: 'Good',
        notes: 'Initial record'
      }
      
      const { error: milkError } = await supabase
        .from('milk_production')
        .insert(initialMilkRecord)
        
      if (milkError) throw milkError
    }
    
    return data[0]
  } catch (error) {
    console.error('Error adding cow:', error)
    throw error
  }
}

// Update an existing cow
export const updateCow = async (cowId, cowData) => {
  try {
    // Transform the data to match the database schema
    const dbCow = {
      tag_number: cowData.tagNumber,
      name: cowData.name,
      breed: cowData.breed,
      date_of_birth: cowData.dateOfBirth,
      status: cowData.status,
      health_status: cowData.healthStatus,
      owner: cowData.owner,
      last_health_check: cowData.lastHealthCheck,
      vaccination_status: cowData.vaccinationStatus,
      alerts: JSON.stringify(cowData.alerts || []),
      image_url: cowData.image,
      purchase_date: cowData.purchaseDate || null,
      purchase_price: cowData.purchasePrice || null,
      initial_weight: cowData.initialWeight || null,
      notes: cowData.notes || null
    }

    const { data, error } = await supabase
      .from('cows')
      .update(dbCow)
      .eq('id', cowId)
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error updating cow:', error)
    throw error
  }
}

// Delete a cow
export const deleteCow = async (cowId) => {
  try {
    // First delete related milk production records
    const { error: milkError } = await supabase
      .from('milk_production')
      .delete()
      .eq('cow_id', cowId)
      
    if (milkError) throw milkError
    
    // Then delete the cow
    const { error } = await supabase
      .from('cows')
      .delete()
      .eq('id', cowId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting cow:', error)
    throw error
  }
}

// Record health event
export const recordHealthEvent = async (cowId, eventData) => {
  try {
    // Add health event record
    const healthEvent = {
      cow_id: cowId,
      event_type: eventData.eventType,
      event_date: eventData.eventDate,
      description: eventData.description,
      performed_by: eventData.performedBy,
      medications: JSON.stringify(eventData.medications || []),
      notes: eventData.notes || null,
      follow_up: eventData.followUp || null,
      status: eventData.status
    }
    
    const { error: eventError } = await supabase
      .from('health_events')
      .insert(healthEvent)
      
    if (eventError) throw eventError
    
    // Update cow's last health check and status
    const { error: cowError } = await supabase
      .from('cows')
      .update({
        last_health_check: eventData.eventDate,
        health_status: eventData.status || 'Healthy'
      })
      .eq('id', cowId)
      
    if (cowError) throw cowError
    
    return true
  } catch (error) {
    console.error('Error recording health event:', error)
    throw error
  }
}

// Record milk production
export const recordMilkProduction = async (cowId, recordData) => {
    try {
      const { data, error } = await supabase
        .from('milk_production')
        .insert({
          cow_id: cowId,
          date: recordData.date,
          amount: recordData.amount,
          shift: recordData.shift || 'Morning',
          quality: recordData.quality || 'Good',
          notes: recordData.notes || ''
        })
        .select('*');
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error recording milk production:', error);
      throw error;
    }
};

export const fetchCowMilkProduction = async (cowId) => {
    try {
      const { data, error } = await supabase
        .from('milk_production')
        .select('*')
        .eq('cow_id', cowId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(record => ({
        date: record.date,
        amount: parseFloat(record.amount),
        shift: record.shift || 'Morning',
        quality: record.quality || 'Good',
        notes: record.notes || ''
      }));
    } catch (error) {
      console.error('Error fetching cow milk production:', error);
      throw error;
    }
  };

// Record breeding event
export const recordBreedingEvent = async (cowId, formData) => {
    try {
      // Insert the breeding event
      const breedingEvent = {
        cow_id: cowId,
        date: formData.date,
        event_type: formData.eventType,
        details: formData.details,
        result: formData.result,
        notes: formData.notes || null,
        performed_by: formData.performedBy || null
      };
      
      const { data: respData, error: eventError } = await supabase
        .from('breeding_events')
        .insert(breedingEvent)
        .select();
        
      if (eventError) throw eventError;
      
      // Update reproductive status based on the event
      await updateReproductiveStatus(cowId, respData);
      
      return respData[0];
    } catch (error) {
      console.error('Error recording breeding event:', error);
      throw error;
    }
};

// Update reproductive status based on breeding events
export const updateReproductiveStatus = async (cowId, eventData) => {
    try {
      // Get current reproductive status
      const { data: currentStatus, error: statusError } = await supabase
        .from('reproductive_status')
        .select('*')
        .eq('cow_id', cowId)
        .single();
        
      if (statusError && statusError.code !== 'PGRST116') throw statusError;
      
      // Prepare updates based on event type
      const updates = {};
      const event = eventData[0]; // Use the first event if array
      
      switch(event.event_type) {
        case 'Heat Detection':
          if (event.result === 'Confirmed') {
            updates.last_heat_date = event.date;
            
            // Calculate next heat date (21 days later for cattle)
            const nextHeatDate = new Date(event.date);
            nextHeatDate.setDate(nextHeatDate.getDate() + 21);
            updates.next_heat_date = nextHeatDate.toISOString().split('T')[0];
            
            updates.status = 'In Heat';
          }
          break;
          
        case 'Insemination':
          if (event.result === 'Completed') {
            updates.status = 'Inseminated';
            updates.breeding_plan = 'Waiting for pregnancy check';
          }
          break;
          
        case 'Pregnancy Check':
          if (event.result === 'Positive') {
            updates.status = 'Pregnant';
          } else if (event.result === 'Negative') {
            updates.status = 'Open';
          }
          break;
          
        case 'Calving':
          if (event.result === 'Healthy' || event.result === 'Complications') {
            updates.status = 'Fresh';
            updates.last_calving_date = event.date;
            updates.calving_count = (currentStatus?.calving_count || 0) + 1;
          }
          break;
      }
      
      // If we have updates to make
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('reproductive_status')
          .upsert({
            cow_id: cowId,
            ...updates,
            updated_at: new Date().toISOString()
          });
          
        if (updateError) throw updateError;
      }
      
    } catch (error) {
      console.error('Error updating reproductive status:', error);
      throw error;
    }
};

// Helper function to calculate age in years
const calculateAge = (dateOfBirth) => {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return `${age} years`
}

// Fetch health history for a cow
export const fetchHealthHistory = async (cowId) => {
  try {
    const { data, error } = await supabase
      .from('health_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('event_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(event => {
      // This is where the error is happening - trying to parse medications that might be a string
      const medications = typeof event.medications === 'string' 
        ? (event.medications === '[object Object]' ? [] : JSON.parse(event.medications)) 
        : (Array.isArray(event.medications) ? event.medications : []);
      
      return {
        ...event,
        medications
      };
    });
  } catch (error) {
    console.error(`Error fetching health history for cow ${cowId}:`, error);
    throw error;
  }
};
  
  // Fetch breeding events for a cow
  export const fetchBreedingEvents = async (cowId) => {
    try {
      const { data, error } = await supabase
        .from('breeding_events')
        .select('*')
        .eq('cow_id', cowId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching breeding events:', error);
      throw error;
    }
  };

  // Fetch reproductive status for a cow
export const fetchReproductiveStatus = async (cowId) => {
    try {
      const { data, error } = await supabase
        .from('reproductive_status')
        .select('*')
        .eq('cow_id', cowId)
        .single();
        
      if (error) {
        // If no record exists, create a default one
        if (error.code === 'PGRST116') {
          const defaultStatus = {
            cow_id: cowId,
            status: 'Open',
            calving_count: 0,
            breeding_plan: 'Not set'
          };
          
          const { data: newData, error: newError } = await supabase
            .from('reproductive_status')
            .insert(defaultStatus)
            .select()
            .single();
            
          if (newError) throw newError;
          return newData;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching reproductive status:', error);
      throw error;
    }
  };
  
  // Fetch recent activities for a cow
  export const fetchRecentActivity = async (cowId) => {
    try {
      // This query combines recent activities from different tables
      const { data: healthEvents, error: healthError } = await supabase
        .from('health_events')
        .select('id, event_date, event_type, description')
        .eq('cow_id', cowId)
        .order('event_date', { ascending: false })
        .limit(5);
      
      if (healthError) throw healthError;
      
      const { data: milkRecords, error: milkError } = await supabase
        .from('milk_production')
        .select('id, date, amount')
        .eq('cow_id', cowId)
        .order('date', { ascending: false })
        .limit(5);
      
      if (milkError) throw milkError;
      
      const { data: breedingEvents, error: breedingError } = await supabase
        .from('breeding_events')
        .select('id, date, event_type, details')
        .eq('cow_id', cowId)
        .order('date', { ascending: false })
        .limit(5);
      
      if (breedingError) throw breedingError;
      
      // Combine and format all activities
      const healthActivities = healthEvents.map(event => ({
        id: `health_${event.id}`,
        type: 'health',
        description: `${event.event_type}: ${event.description}`,
        date: event.event_date,
        timestamp: new Date(event.event_date).getTime()
      }));
      
      const milkActivities = milkRecords.map(record => ({
        id: `milk_${record.id}`,
        type: 'milk',
        description: `Milk collection recorded: ${record.amount}L`,
        date: record.date,
        timestamp: new Date(record.date).getTime()
      }));
      
      const breedingActivities = breedingEvents.map(event => ({
        id: `breeding_${event.id}`,
        type: 'breeding',
        description: `${event.event_type}: ${event.details}`,
        date: event.date,
        timestamp: new Date(event.date).getTime()
      }));
      
      // Combine all activities, sort by date (newest first), and take the top 10
      const allActivities = [...healthActivities, ...milkActivities, ...breedingActivities]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
      
      return allActivities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  };