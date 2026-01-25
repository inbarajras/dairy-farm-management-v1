import { supabase } from '../../lib/supabase';
import { sortMilkProductionRecords, compareMilkProductionRecords } from '../utils/cowSorting';
import {
  COW_HEAT_CYCLE_DAYS,
  COW_GESTATION_DAYS,
  FRESH_COW_PERIOD_DAYS,
  CALF_FIRST_WEEK_DAYS,
  DAYS_PER_MONTH,
  MONTHS_PER_YEAR,
  DEFAULT_QUALITY,
  SHIFT_TYPES,
  REPRODUCTIVE_STATUS,
  EVENT_TYPES,
  BREEDING_RESULTS,
  GROWTH_MILESTONES
} from '../utils/cowConstants';

// Fetch all cows
export const fetchCows = async () => {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('*, milk_production(*)')
      .order('id', { ascending: true });

    if (error) throw error;
    
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
      milkProduction: sortMilkProductionRecords(
        cow.milk_production.map(record => ({
          date: record.date,
          amount: record.amount,
          shift: record.shift || SHIFT_TYPES.MORNING,
          quality: record.quality || DEFAULT_QUALITY,
          notes: record.notes || ''
        }))
      ),
      lastHealthCheck: cow.last_health_check,
      vaccinationStatus: cow.vaccination_status,
      alerts: cow.alerts ? JSON.parse(cow.alerts) : [],
      image: cow.image_url || null,
      photo: cow.image_url || null,
      purchaseDate: cow.purchase_date,
      purchasePrice: cow.purchase_price,
      initialWeight: cow.initial_weight,
      currentWeight: cow.current_weight,
      growthRate: cow.growth_rate,
      notes: cow.notes,
      mother: cow.mother,
      father: cow.father,
      birthType: cow.birth_type,
      isCalf: cow.is_calf
    }));
  } catch (error) {
    console.error('Error fetching cows:', error);
    throw error;
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
      current_weight: cowData.currentWeight || cowData.initialWeight || null,
      notes: cowData.notes || null,
      // Add calf-specific fields
      mother: cowData.mother || null,
      father: cowData.father || null,
      birth_type: cowData.birthType || 'Single',
      is_calf: cowData.status === 'Calf'
    }
    console.log('dbCow', dbCow);

    const { data, error } = await supabase
      .from('cows')
      .insert(dbCow)
      .select()

    if (error) throw error

    // Transform the returned data to camelCase format
    const cow = data[0];
    return {
      id: cow.id,
      tagNumber: cow.tag_number,
      name: cow.name,
      breed: cow.breed,
      dateOfBirth: cow.date_of_birth,
      age: calculateAge(cow.date_of_birth),
      status: cow.status,
      healthStatus: cow.health_status,
      owner: cow.owner,
      milkProduction: cowData.milkProduction || [],
      lastHealthCheck: cow.last_health_check,
      vaccinationStatus: cow.vaccination_status,
      alerts: cow.alerts ? JSON.parse(cow.alerts) : [],
      image: cow.image_url || null,
      photo: cow.image_url || null,
      purchaseDate: cow.purchase_date,
      purchasePrice: cow.purchase_price,
      initialWeight: cow.initial_weight,
      currentWeight: cow.current_weight,
      growthRate: cow.growth_rate,
      notes: cow.notes,
      mother: cow.mother,
      father: cow.father,
      birthType: cow.birth_type,
      isCalf: cow.is_calf
    };
  } catch (error) {
    console.error('Error adding cow:', error)
    throw error
  }
}

// Update an existing cow
export const updateCow = async (cowId, cowData) => {
  try {
    console.log('Update cow received data:', cowData);
    
    // Transform the data to match the database schema
    const dbCow = {
      tag_number: cowData.tagNumber,
      name: cowData.name,
      breed: cowData.breed,
      date_of_birth: cowData.dateOfBirth,
      status: cowData.status,
      health_status: cowData.healthStatus,
      owner: cowData.owner,
      last_health_check: cowData.lastHealthCheck || new Date().toISOString().split('T')[0],
      vaccination_status: cowData.vaccinationStatus || 'Up to date',
      alerts: Array.isArray(cowData.alerts) ? JSON.stringify(cowData.alerts) : JSON.stringify([]),
      purchase_date: cowData.purchaseDate || null,
      purchase_price: cowData.purchasePrice ? parseFloat(cowData.purchasePrice) : null,
      initial_weight: cowData.initialWeight ? parseFloat(cowData.initialWeight) : null,
      notes: cowData.notes || null,
      updated_at: new Date().toISOString(), // Add updated timestamp
      
      // Handle transition data if present
      transition_date: cowData.transitionDate || null,
      current_weight: cowData.currentWeight ? parseFloat(cowData.currentWeight) : null,
      is_calf: cowData.status === 'Calf'
    };
    
    console.log('Transformed data for database:', dbCow);

    // If a new photo was uploaded, handle it
    if (cowData.photo && cowData.photo instanceof File) {
      // Upload the image file to storage and get the URL
      const fileName = `cow_${cowId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cow-images')
        .upload(fileName, cowData.photo);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('cow-images')
        .getPublicUrl(fileName);
        
      if (urlData) {
        dbCow.image_url = urlData.publicUrl;
      }
    } else if (cowData.photo && typeof cowData.photo === 'string') {
      // If it's already a URL string, keep it
      dbCow.image_url = cowData.photo;
    }

    const { data, error } = await supabase
      .from('cows')
      .update(dbCow)
      .eq('id', cowId)
      .select('*, milk_production(*)');

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Update successful, returned data:', data);
    
    // Transform the data back to frontend format (consistent with fetchCows and addCow)
    const cow = data[0];
    const transformedCow = {
      id: cow.id,
      tagNumber: cow.tag_number,
      name: cow.name,
      breed: cow.breed,
      dateOfBirth: cow.date_of_birth,
      age: calculateAge(cow.date_of_birth),
      status: cow.status,
      healthStatus: cow.health_status,
      owner: cow.owner,
      lastHealthCheck: cow.last_health_check,
      vaccinationStatus: cow.vaccination_status,
      alerts: cow.alerts ? JSON.parse(cow.alerts) : [],
      image: cow.image_url || null,
      photo: cow.image_url || null,
      purchaseDate: cow.purchase_date,
      purchasePrice: cow.purchase_price,
      initialWeight: cow.initial_weight,
      currentWeight: cow.current_weight,
      growthRate: cow.growth_rate,
      notes: cow.notes,
      mother: cow.mother,
      father: cow.father,
      birthType: cow.birth_type,
      isCalf: cow.is_calf,
      milkProduction: cow.milk_production ? sortMilkProductionRecords(
        cow.milk_production.map(record => ({
          date: record.date,
          amount: record.amount,
          shift: record.shift || SHIFT_TYPES.MORNING,
          quality: record.quality || DEFAULT_QUALITY,
          notes: record.notes || ''
        }))
      ) : []
    };
    
    return transformedCow;
  } catch (error) {
    console.error('Error updating cow:', error);
    throw error;
  }
};

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
    console.error('Error recording health event:', error);
    throw error
  }
}

// Record milk production
export const recordMilkProduction = async (cowId, recordData) => {
    try {
      // Check for existing record with same cow_id, date, and shift
      const { data: existingRecords, error: checkError } = await supabase
        .from('milk_production')
        .select('id')
        .eq('cow_id', cowId)
        .eq('date', recordData.date)
        .eq('shift', recordData.shift || SHIFT_TYPES.MORNING);
      
      if (checkError) {
        console.error('Error checking for existing records:', checkError);
        return {
          success: false,
          message: 'Failed to check for existing records. Please try again.'
        };
      }
      
      // If a record already exists, return failure with message
      if (existingRecords && existingRecords.length > 0) {
        return {
          success: false,
          message: `Milk production record already exists for this cow on ${recordData.date} for ${recordData.shift || SHIFT_TYPES.MORNING} shift. Duplicate records are not allowed.`
        };
      }
      
      const { data, error } = await supabase
        .from('milk_production')
        .insert({
          cow_id: cowId,
          date: recordData.date,
          amount: recordData.amount,
          shift: recordData.shift || SHIFT_TYPES.MORNING,
          quality: recordData.quality || DEFAULT_QUALITY,
          notes: recordData.notes || '',
          fat: recordData.fat || null,
          snf: recordData.snf || null
        })
        .select('*');
      
      if (error) {
        console.error('Error inserting milk production record:', error);
        return {
          success: false,
          message: 'Failed to record milk production. Please try again.'
        };
      }
      
      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      console.error('Error recording milk production:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    }
};

export const fetchCowMilkProduction = async (cowId) => {
    try {
      const { data, error } = await supabase
        .from('milk_production')
        .select('*')
        .eq('cow_id', cowId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(record => ({
        date: record.date,
        amount: parseFloat(record.amount),
        shift: record.shift || SHIFT_TYPES.MORNING,
        quality: record.quality || DEFAULT_QUALITY,
        notes: record.notes || '',
        created_at: record.created_at
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
    
    // After recording the breeding event, update the reproductive status based on all events
    await updateReproductiveStatus(cowId);
    
    return respData[0];
  } catch (error) {
    console.error('Error recording breeding event:', error);
    throw error;
  }
};

// Update reproductive status based on breeding events
export const updateReproductiveStatus = async (cowId) => {
  try {
    // Get all breeding events for this cow, sorted by date (newest first)
    const { data: allEvents, error: eventsError } = await supabase
      .from('breeding_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('date', { ascending: false });
      
    if (eventsError) throw eventsError;
    
    // Get current reproductive status using our improved function that cleans up duplicates
    const currentStatus = await fetchReproductiveStatus(cowId);
    
    // Initialize updates object with existing data or defaults
    const updates = {
      id: currentStatus?.id, // Keep the existing ID to ensure update instead of insert
      cow_id: cowId,
      status: currentStatus?.status || REPRODUCTIVE_STATUS.OPEN,
      calving_count: currentStatus?.calving_count || 0,
      breeding_plan: currentStatus?.breeding_plan || 'Not set',
      last_heat_date: currentStatus?.last_heat_date || null,
      next_heat_date: currentStatus?.next_heat_date || null,
      last_calving_date: currentStatus?.last_calving_date || null,
      updated_at: new Date().toISOString()
    };
    
    // If we have no events, just create/update with defaults
    if (!allEvents || allEvents.length === 0) {
      const { error: updateError } = await supabase
        .from('reproductive_status')
        .upsert(updates);
        
      if (updateError) throw updateError;
      return;
    }
    
    // Process events in chronological order (oldest to newest)
    // This ensures that the final status reflects the most recent relevant event
    const chronologicalEvents = [...allEvents].reverse();
    
    // Track important dates
    let lastHeatDate = currentStatus?.last_heat_date || null;
    let lastInseminationDate = null;
    let lastPregnancyCheckDate = null;
    let lastCalvingDate = currentStatus?.last_calving_date || null;
    let lastPregnancyCheckResult = null;
    
    // Track expected calving info
    let expectedCalvingDate = null;
    
    // Process each event to build the most accurate reproductive status
    chronologicalEvents.forEach(event => {
      const eventDate = new Date(event.date);
      
      switch(event.event_type) {
        case EVENT_TYPES.HEAT_DETECTION:
          if (event.result === BREEDING_RESULTS.CONFIRMED) {
            lastHeatDate = event.date;
            // Only update status to "In Heat" if there's no more recent pregnancy confirmation
            if (!lastPregnancyCheckResult || lastPregnancyCheckResult !== BREEDING_RESULTS.POSITIVE) {
              updates.status = REPRODUCTIVE_STATUS.IN_HEAT;
            }
          }
          break;

        case EVENT_TYPES.INSEMINATION:
          if (event.result === BREEDING_RESULTS.COMPLETED) {
            lastInseminationDate = event.date;
            // Only update to inseminated if there's no later pregnancy check
            if (!lastPregnancyCheckDate || new Date(lastPregnancyCheckDate) < eventDate) {
              updates.status = REPRODUCTIVE_STATUS.INSEMINATED;
              updates.breeding_plan = 'Waiting for pregnancy check';
            }
          }
          break;

        case EVENT_TYPES.PREGNANCY_CHECK:
          lastPregnancyCheckDate = event.date;
          lastPregnancyCheckResult = event.result;

          if (event.result === BREEDING_RESULTS.POSITIVE) {
            updates.status = REPRODUCTIVE_STATUS.PREGNANT;
            // Calculate expected calving date (approximately 280 days after last insemination)
            if (lastInseminationDate) {
              const dueDate = new Date(lastInseminationDate);
              dueDate.setDate(dueDate.getDate() + COW_GESTATION_DAYS);
              expectedCalvingDate = dueDate.toISOString().split('T')[0];
              // Store this in breeding_plan since we don't have expected_calving_date column
              updates.breeding_plan = `Due: ${expectedCalvingDate}`;
            }
          } else if (event.result === BREEDING_RESULTS.NEGATIVE) {
            updates.status = REPRODUCTIVE_STATUS.OPEN;
            updates.breeding_plan = 'Rebreeding needed';
            expectedCalvingDate = null;
          }
          break;

        case EVENT_TYPES.CALVING:
          if (event.result === BREEDING_RESULTS.HEALTHY || event.result === BREEDING_RESULTS.COMPLICATIONS) {
            lastCalvingDate = event.date;
            updates.status = REPRODUCTIVE_STATUS.FRESH;
            updates.last_calving_date = event.date;
            updates.calving_count = (currentStatus?.calving_count || 0) + 1;
            updates.breeding_plan = 'Post-calving rest';
            expectedCalvingDate = null;
          }
          break;
      }
    });
    
    // Calculate next heat date if we have a last heat date and the cow is not pregnant
    if (lastHeatDate && updates.status !== REPRODUCTIVE_STATUS.PREGNANT) {
      const nextHeatDate = new Date(lastHeatDate);
      nextHeatDate.setDate(nextHeatDate.getDate() + COW_HEAT_CYCLE_DAYS);
      updates.last_heat_date = lastHeatDate;
      updates.next_heat_date = nextHeatDate.toISOString().split('T')[0];
    }

    // If the cow has calved, but there are no subsequent events indicating otherwise,
    // we should update from 'Fresh' to 'Open' after a certain period
    if (updates.status === REPRODUCTIVE_STATUS.FRESH && lastCalvingDate) {
      const freshCutoff = new Date(lastCalvingDate);
      freshCutoff.setDate(freshCutoff.getDate() + FRESH_COW_PERIOD_DAYS); 
      
      if (new Date() > freshCutoff) {
        updates.status = REPRODUCTIVE_STATUS.OPEN;
        if (updates.breeding_plan === 'Post-calving rest') {
          updates.breeding_plan = 'Ready for breeding';
        }
      }
    }
    
    console.log('Updating reproductive status with ID:', updates.id);
    const { error: updateError } = await supabase
      .from('reproductive_status')
      .upsert(updates, { 
        onConflict: 'id',  // Specify the conflict resolution field
        ignoreDuplicates: false // We want to update, not ignore
      });
      
    if (updateError) {
      console.error('Error in reproductive_status upsert:', updateError);
      throw updateError;
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
      // Safely parse medications field with error handling
      let medications = [];

      try {
        if (typeof event.medications === 'string' && event.medications.trim() !== '') {
          // Avoid parsing obvious bad strings
          if (event.medications === '[object Object]') {
            medications = [];
          } else {
            medications = JSON.parse(event.medications);
          }
        } else if (Array.isArray(event.medications)) {
          medications = event.medications;
        }
      } catch (parseError) {
        console.warn('Failed to parse medications for event:', event.id, parseError);
        medications = [];
      }

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

  // Fetch delivery schedule - cows with expected delivery dates (calculated dynamically)
  export const fetchDeliverySchedule = async () => {
    try {
      // Fetch pregnancy confirmations and inseminations
      const { data, error } = await supabase
        .from('breeding_events')
        .select(`
          id,
          cow_id,
          date,
          event_type,
          result,
          cows (
            id,
            tag_number,
            name,
            breed
          )
        `)
        .in('event_type', ['Pregnancy Check', 'Insemination'])
        .in('result', ['Positive', 'Completed', 'Confirmed'])
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate expected delivery dates (280 days from event date)
      const GESTATION_DAYS = 280;
      const expectedDeliveries = (data || []).map(event => {
        const eventDate = new Date(event.date);
        const expectedDate = new Date(eventDate);
        expectedDate.setDate(expectedDate.getDate() + GESTATION_DAYS);

        return {
          ...event,
          expected_delivery_date: expectedDate.toISOString().split('T')[0]
        };
      });

      // Filter out duplicates (keep most recent pregnancy event per cow)
      const uniqueDeliveries = [];
      const seenCows = new Set();

      for (const delivery of expectedDeliveries) {
        if (!seenCows.has(delivery.cow_id)) {
          seenCows.add(delivery.cow_id);
          uniqueDeliveries.push(delivery);
        }
      }

      // Sort by expected delivery date
      uniqueDeliveries.sort((a, b) =>
        new Date(a.expected_delivery_date) - new Date(b.expected_delivery_date)
      );

      // Also fetch cows that already calved (for delivered tracking)
      const { data: calvingData, error: calvingError } = await supabase
        .from('breeding_events')
        .select(`
          id,
          cow_id,
          date,
          event_type,
          result,
          cows (
            id,
            tag_number,
            name,
            breed
          )
        `)
        .eq('event_type', 'Calving')
        .order('date', { ascending: false });

      if (calvingError) throw calvingError;

      return {
        expectedDeliveries: uniqueDeliveries,
        completedDeliveries: calvingData || []
      };
    } catch (error) {
      console.error('Error fetching delivery schedule:', error);
      throw error;
    }
  };

  // Fetch reproductive status for a cow
  export const fetchReproductiveStatus = async (cowId) => {
    try {
      // First, check if multiple records exist
      const { data: allRecords, error: checkError } = await supabase
        .from('reproductive_status')
        .select('*')
        .eq('cow_id', cowId)
        .order('updated_at', { ascending: false });
        
      if (checkError) throw checkError;
      
      // If no records found, create a default one
      if (!allRecords || allRecords.length === 0) {
        console.log('No reproductive status found for cow, creating default');
        const defaultStatus = {
          cow_id: cowId,
          status: REPRODUCTIVE_STATUS.OPEN,
          calving_count: 0,
          breeding_plan: 'Not set',
          updated_at: new Date().toISOString()
        };
        
        const { data: newData, error: newError } = await supabase
          .from('reproductive_status')
          .insert(defaultStatus)
          .select();
          
        if (newError) throw newError;
        return newData[0]; // Return first item from array instead of using .single()
      }
      
      // If multiple records exist, let's fix the database first
      if (allRecords.length > 1) {
        console.warn(`Found ${allRecords.length} reproductive status records for cow ${cowId}. Using most recent and cleaning up duplicates.`);
        
        // Keep the most recent record (first one due to our ordering)
        const mostRecentRecord = allRecords[0];
        
        // Delete all other records
        for (let i = 1; i < allRecords.length; i++) {
          await supabase
            .from('reproductive_status')
            .delete()
            .eq('id', allRecords[i].id);
        }
        
        return mostRecentRecord;
      }
      
      // If only one record exists, simply return it
      return allRecords[0];
      
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

// Fetch growth milestones for a calf/heifer
export const fetchGrowthMilestones = async (cowId) => {
  try {
    // First, get the cow's birth data as the initial milestone
    const { data: cowData, error: cowError } = await supabase
      .from('cows')
      .select('id, tag_number, name, date_of_birth, initial_weight, current_weight, growth_rate, transition_date')
      .eq('id', cowId)
      .single();
    
    if (cowError) throw cowError;

    // Then, fetch all health events that record weight measurements
    const { data: healthEvents, error: healthError } = await supabase
      .from('health_events')
      .select('id, event_date, event_type, description, notes')
      .eq('cow_id', cowId)
      .eq('event_type', EVENT_TYPES.WEIGHT_MEASUREMENT)
      .order('event_date', { ascending: true });
    
    if (healthError) throw healthError;

    // Create the first milestone from birth data
    const milestones = [{
      id: `birth-${cowId}`,
      date: cowData.date_of_birth,
      milestone: GROWTH_MILESTONES.BIRTH,
      weight: parseFloat(cowData.initial_weight) || 0,
      notes: 'Birth weight record',
      ageInDays: 0
    }];

    // Calculate growth milestones from health events
    healthEvents.forEach(event => {
      // Extract weight from the description or notes using regex
      const weightMatch = 
        (event.description && event.description.match(/(\d+(\.\d+)?)\s*kg/i)) ||
        (event.notes && event.notes.match(/(\d+(\.\d+)?)\s*kg/i));
      
      if (weightMatch) {
        const weight = parseFloat(weightMatch[1]);
        const eventDate = new Date(event.event_date);
        const birthDate = new Date(cowData.date_of_birth);
        const ageInDays = Math.floor((eventDate - birthDate) / (24 * 60 * 60 * 1000));
        const milestone = generateMilestoneName(ageInDays);
        
        milestones.push({
          id: event.id,
          date: event.event_date,
          milestone,
          weight,
          notes: event.description || event.notes,
          ageInDays
        });
      }
    });

    // Add transition milestone if available
    if (cowData.transition_date) {
      const transitionDate = new Date(cowData.transition_date);
      const birthDate = new Date(cowData.date_of_birth);
      const ageInDays = Math.floor((transitionDate - birthDate) / (24 * 60 * 60 * 1000));
      
      milestones.push({
        id: `transition-${cowId}`,
        date: cowData.transition_date,
        milestone: GROWTH_MILESTONES.STATUS_TRANSITION,
        weight: parseFloat(cowData.current_weight) || milestones[milestones.length - 1].weight,
        notes: 'Transition to new status',
        ageInDays
      });
    }

    // Sort milestones by date
    milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate growth rate between milestones if we have multiple points
    if (milestones.length > 1) {
      for (let i = 1; i < milestones.length; i++) {
        const daysPassed = milestones[i].ageInDays - milestones[i-1].ageInDays;
        const weightGain = milestones[i].weight - milestones[i-1].weight;
        const growthRate = daysPassed > 0 ? (weightGain / daysPassed * 30).toFixed(2) : 0; // kg per month
        
        milestones[i].growthRate = parseFloat(growthRate);
      }
    }

    return milestones;
  } catch (error) {
    console.error('Error fetching growth milestones:', error);
    throw error;
  }
};

// Generate milestone name based on age
const generateMilestoneName = (ageInDays) => {
  if (ageInDays < CALF_FIRST_WEEK_DAYS) return GROWTH_MILESTONES.FIRST_WEEK;
  if (ageInDays < DAYS_PER_MONTH) return GROWTH_MILESTONES.FIRST_MONTH;

  const months = Math.floor(ageInDays / DAYS_PER_MONTH);
  if (months === 1) return '1 Month';
  if (months < MONTHS_PER_YEAR) return `${months} Months`;

  const years = Math.floor(months / MONTHS_PER_YEAR);
  const remainingMonths = months % MONTHS_PER_YEAR;

  if (remainingMonths === 0) return `${years} Year${years > 1 ? 's' : ''}`;
  return `${years} Year${years > 1 ? 's' : ''}, ${remainingMonths} Month${remainingMonths > 1 ? 's' : ''}`;
};

// Record a new growth milestone
export const recordGrowthMilestone = async (cowId, milestoneData) => {
  try {
    // Create a health event of type "Weight Measurement"
    const healthEvent = {
      cow_id: cowId,
      event_type: EVENT_TYPES.WEIGHT_MEASUREMENT,
      event_date: milestoneData.date,
      description: milestoneData.milestone,
      notes: `Weight: ${milestoneData.weight} kg. ${milestoneData.notes || ''}`,
      performed_by: milestoneData.performedBy || 'Farm Staff',
      status: 'Completed'
    };
    
    const { data, error } = await supabase
      .from('health_events')
      .insert(healthEvent)
      .select();
      
    if (error) throw error;
    
    // Fetch all milestones to calculate growth rate
    const milestones = await fetchGrowthMilestones(cowId);
    let growthRate = null;

    // Calculate growth rate if we have at least 2 milestones
    if (milestones.length > 1) {
      const latestMilestone = milestones[milestones.length - 1];
      growthRate = latestMilestone.growthRate || null;
    }

    // Update the cow's current weight and growth rate
    const updateData = {
      current_weight: milestoneData.weight,
      updated_at: new Date().toISOString()
    };

    // Only add growth rate if we could calculate it
    if (growthRate !== null) {
      updateData.growth_rate = growthRate.toFixed(2);
    }

    const { error: updateError } = await supabase
      .from('cows')
      .update(updateData)
      .eq('id', cowId);

    if (updateError) throw updateError;
    
    return data[0];
  } catch (error) {
    console.error('Error recording growth milestone:', error);
    throw error;
  }
};