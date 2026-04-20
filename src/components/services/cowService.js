import { supabase } from '../../lib/supabase';
import { sortMilkProductionRecords, compareMilkProductionRecords } from '../utils/cowSorting';
import { getCreateUserTracking, getUpdateUserTracking } from '../../utils/userTracking';
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
      isCalf: cow.is_calf,
      // Pregnancy fields
      isPregnant: cow.is_pregnant || false,
      pregnancyDate: cow.pregnancy_date || null,
      expectedDeliveryDate: cow.expected_delivery_date || null,
      createdAt: cow.created_at,
      updatedAt: cow.updated_at,
      createdBy: cow.created_by,
      updatedBy: cow.updated_by
    }));
  } catch (error) {
    console.error('Error fetching cows:', error);
    throw error;
  }
}

// Add a new cow
export const addCow = async (cowData) => {
  try {
    const userTracking = await getCreateUserTracking();

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
      // Add pregnancy fields
      is_pregnant: cowData.isPregnant || false,
      pregnancy_date: cowData.isPregnant && cowData.pregnancyDate ? cowData.pregnancyDate : null,
      expected_delivery_date: cowData.isPregnant && cowData.expectedDeliveryDate ? cowData.expectedDeliveryDate : null,
      father: cowData.father || null,
      birth_type: cowData.birthType || 'Single',
      is_calf: cowData.status === 'Calf',
      ...userTracking
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
      isCalf: cow.is_calf,
      // Pregnancy fields
      isPregnant: cow.is_pregnant || false,
      pregnancyDate: cow.pregnancy_date || null,
      expectedDeliveryDate: cow.expected_delivery_date || null
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
    const userTracking = await getUpdateUserTracking();

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
      is_calf: cowData.status === 'Calf',
      // Pregnancy fields
      is_pregnant: cowData.isPregnant || false,
      pregnancy_date: cowData.isPregnant && cowData.pregnancyDate ? cowData.pregnancyDate : null,
      expected_delivery_date: cowData.isPregnant && cowData.expectedDeliveryDate ? cowData.expectedDeliveryDate : null,
      ...userTracking
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
      // Pregnancy fields
      isPregnant: cow.is_pregnant || false,
      pregnancyDate: cow.pregnancy_date || null,
      expectedDeliveryDate: cow.expected_delivery_date || null,
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

// Validate breeding event before recording
export const validateBreedingEvent = async (cowId, formData) => {
  const errors = [];
  const warnings = [];

  try {
    // Fetch current cow data and breeding events
    const { data: cowData, error: cowError } = await supabase
      .from('cows')
      .select('is_pregnant, expected_delivery_date, status')
      .eq('id', cowId)
      .single();

    if (cowError) throw cowError;

    const { data: events, error: eventsError } = await supabase
      .from('breeding_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (eventsError) throw eventsError;

    const lastEvent = events && events.length > 0 ? events[0] : null;

    // Rule 1: Can't inseminate a pregnant cow
    if (formData.eventType === EVENT_TYPES.INSEMINATION && cowData.is_pregnant) {
      errors.push('Cannot inseminate a pregnant cow. Please confirm pregnancy status first.');
    }

    // Rule 2: Pregnancy check timing validation
    if (formData.eventType === EVENT_TYPES.PREGNANCY_CHECK) {
      const lastInsemination = events?.find(e =>
        e.event_type === EVENT_TYPES.INSEMINATION &&
        e.result === BREEDING_RESULTS.COMPLETED
      );

      if (lastInsemination) {
        const daysSince = Math.floor((new Date(formData.date) - new Date(lastInsemination.date)) / (1000 * 60 * 60 * 24));
        if (daysSince < 25) {
          warnings.push(`Pregnancy check is ${daysSince} days after insemination. Recommended: 25-45 days for accuracy.`);
        } else if (daysSince > 60) {
          warnings.push(`Pregnancy check is ${daysSince} days after insemination. This is quite late - results should be obvious by now.`);
        }
      } else {
        warnings.push('No recent insemination record found. Pregnancy check may be premature.');
      }
    }

    // Rule 3: Can't record calving if not pregnant
    if (formData.eventType === EVENT_TYPES.CALVING && !cowData.is_pregnant) {
      errors.push('Cannot record calving for a cow that is not marked as pregnant.');
    }

    // Rule 4: Calving date validation
    if (formData.eventType === EVENT_TYPES.CALVING && cowData.expected_delivery_date) {
      const daysFromExpected = Math.floor((new Date(formData.date) - new Date(cowData.expected_delivery_date)) / (1000 * 60 * 60 * 24));
      if (Math.abs(daysFromExpected) > 21) {
        warnings.push(`Calving date is ${Math.abs(daysFromExpected)} days ${daysFromExpected > 0 ? 'after' : 'before'} expected delivery date. Please verify the date is correct.`);
      }
    }

    // Rule 5: Event date cannot be in the future
    if (new Date(formData.date) > new Date()) {
      errors.push('Event date cannot be in the future.');
    }

    // Rule 6: Heat detection after recent insemination
    if (formData.eventType === EVENT_TYPES.HEAT_DETECTION && lastEvent?.event_type === EVENT_TYPES.INSEMINATION) {
      const daysSince = Math.floor((new Date(formData.date) - new Date(lastEvent.date)) / (1000 * 60 * 60 * 24));
      if (daysSince < 18) {
        warnings.push(`Heat detected only ${daysSince} days after insemination. This may indicate failed conception.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (error) {
    console.error('Error validating breeding event:', error);
    return { valid: false, errors: ['Validation failed: ' + error.message], warnings: [] };
  }
};

// Record breeding event
export const recordBreedingEvent = async (cowId, formData) => {
  try {
    // Validate before recording
    const validation = await validateBreedingEvent(cowId, formData);

    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

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

    // Sync pregnancy status to cow table if needed
    await syncPregnancyStatus(cowId);

    return { event: respData[0], warnings: validation.warnings };
  } catch (error) {
    console.error('Error recording breeding event:', error);
    throw error;
  }
};

// Update reproductive status based on breeding events
export const updateReproductiveStatus = async (cowId) => {
  try {
    // Get all breeding events for this cow, sorted by created_at timestamp (newest first)
    // This ensures correct ordering even if multiple events occur on the same date
    const { data: allEvents, error: eventsError } = await supabase
      .from('breeding_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('created_at', { ascending: false });
      
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
    
    // ===================================================================
    // SIMPLIFIED LOGIC: Use the MOST RECENT event to determine status
    // ===================================================================

    const mostRecentEvent = allEvents[0]; // Already sorted by created_at DESC

    console.log('[updateReproductiveStatus] Most recent event:', {
      date: mostRecentEvent.date,
      created_at: mostRecentEvent.created_at,
      type: mostRecentEvent.event_type,
      result: mostRecentEvent.result
    });

    // Track dates for calculations (scan all events for historical data)
    let lastHeatDate = null;
    let lastInseminationDate = null;
    let lastCalvingDate = null;
    let calvingCount = 0;

    // Scan all events to get important dates
    allEvents.forEach(event => {
      if ((event.event_type === 'Heat Detection' || event.event_type === 'HEAT_DETECTION') &&
          event.result === BREEDING_RESULTS.CONFIRMED && !lastHeatDate) {
        lastHeatDate = event.date;
      }
      if ((event.event_type === 'Insemination' || event.event_type === 'Artificial Insemination' || event.event_type === 'Natural Breeding') &&
          event.result === BREEDING_RESULTS.COMPLETED && !lastInseminationDate) {
        lastInseminationDate = event.date;
      }
      if (event.event_type === 'Calving' &&
          (event.result === BREEDING_RESULTS.HEALTHY || event.result === BREEDING_RESULTS.COMPLICATIONS)) {
        if (!lastCalvingDate) lastCalvingDate = event.date;
        calvingCount++;
      }
    });

    // Prepare cow table updates
    let cowTableUpdates = null;

    // ===================================================================
    // SET STATUS BASED ON MOST RECENT EVENT ONLY
    // ===================================================================

    const eventType = mostRecentEvent.event_type;
    const eventResult = mostRecentEvent.result;

    console.log('[updateReproductiveStatus] Checking event type:', {
      eventType,
      eventResult,
      isHeatDetection: eventType === 'Heat Detection' || eventType === 'HEAT_DETECTION',
      isInsemination: eventType === 'Insemination' || eventType === 'Artificial Insemination' || eventType === 'Natural Breeding',
      isPregnancyCheck: eventType === 'Pregnancy Check' || eventType === 'PREGNANCY_CHECK',
      isCalving: eventType === 'Calving' || eventType === 'CALVING'
    });

    // Heat Detection
    if (eventType === 'Heat Detection' || eventType === 'HEAT_DETECTION') {
      if (eventResult === BREEDING_RESULTS.CONFIRMED) {
        updates.status = REPRODUCTIVE_STATUS.IN_HEAT;
        updates.breeding_plan = 'Ready for breeding';
        console.log('[updateReproductiveStatus] Status: IN HEAT (most recent event)');
      }
    }

    // Insemination (any type)
    else if (eventType === 'Insemination' || eventType === 'Artificial Insemination' || eventType === 'Natural Breeding') {
      console.log('[updateReproductiveStatus] Insemination event detected, result:', eventResult, 'Expected:', BREEDING_RESULTS.COMPLETED);
      if (eventResult === BREEDING_RESULTS.COMPLETED) {
        updates.status = REPRODUCTIVE_STATUS.INSEMINATED;
        updates.breeding_plan = 'Waiting for pregnancy check';
        console.log('[updateReproductiveStatus] Status: INSEMINATED (most recent event)');
      } else {
        console.log('[updateReproductiveStatus] Result does not match COMPLETED, not setting to INSEMINATED');
      }
    }

    // Pregnancy Check
    else if (eventType === 'Pregnancy Check' || eventType === 'PREGNANCY_CHECK') {
      if (eventResult === BREEDING_RESULTS.POSITIVE) {
        updates.status = REPRODUCTIVE_STATUS.PREGNANT;

        // Calculate expected calving date
        if (lastInseminationDate) {
          const dueDate = new Date(lastInseminationDate);
          dueDate.setDate(dueDate.getDate() + COW_GESTATION_DAYS);
          const expectedCalvingDate = dueDate.toISOString().split('T')[0];
          updates.breeding_plan = `Due: ${expectedCalvingDate}`;

          cowTableUpdates = {
            is_pregnant: true,
            pregnancy_date: lastInseminationDate,
            expected_delivery_date: expectedCalvingDate
          };
        }
        console.log('[updateReproductiveStatus] Status: PREGNANT (most recent event)');
      }
      else if (eventResult === BREEDING_RESULTS.NEGATIVE) {
        updates.status = REPRODUCTIVE_STATUS.OPEN;
        updates.breeding_plan = 'Rebreeding needed';

        cowTableUpdates = {
          is_pregnant: false,
          pregnancy_date: null,
          expected_delivery_date: null
        };
        console.log('[updateReproductiveStatus] Status: OPEN (negative pregnancy check)');
      }
    }

    // Calving
    else if (eventType === 'Calving' || eventType === 'CALVING') {
      if (eventResult === BREEDING_RESULTS.HEALTHY || eventResult === BREEDING_RESULTS.COMPLICATIONS) {
        updates.status = REPRODUCTIVE_STATUS.FRESH;
        updates.last_calving_date = mostRecentEvent.date;
        updates.calving_count = calvingCount;
        updates.breeding_plan = 'Post-calving rest';

        cowTableUpdates = {
          is_pregnant: false,
          pregnancy_date: null,
          expected_delivery_date: null
        };
        console.log('[updateReproductiveStatus] Status: FRESH (most recent event)');
      }
    }

    console.log(`[updateReproductiveStatus] FINAL STATUS: ${updates.status}`);

    // Apply cow table updates if needed (after processing all events)
    if (cowTableUpdates) {
      await supabase
        .from('cows')
        .update(cowTableUpdates)
        .eq('id', cowId);
    }

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
        .order('created_at', { ascending: false }); // Sort by timestamp, not just date

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
      // 1. Fetch pregnant cows from cow table (direct pregnancy data)
      const { data: pregnantCows, error: pregnantError } = await supabase
        .from('cows')
        .select('id, tag_number, name, breed, is_pregnant, pregnancy_date, expected_delivery_date')
        .eq('is_pregnant', true);

      if (pregnantError) throw pregnantError;

      // 2. Fetch pregnancy confirmations from breeding events
      // ONLY fetch Pregnancy Check events with Positive result (confirmed pregnant cows)
      const { data: breedingEvents, error: breedingError } = await supabase
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
        .eq('event_type', 'Pregnancy Check')
        .eq('result', 'Positive')
        .order('created_at', { ascending: false });

      if (breedingError) throw breedingError;

      // For pregnancy check events, we need to find the insemination date to calculate due date
      // Calculate expected delivery dates from breeding events (280 days from INSEMINATION date)
      const GESTATION_DAYS = 280;
      const breedingDeliveries = [];

      for (const event of breedingEvents || []) {
        // Find the most recent insemination before this pregnancy check
        const { data: inseminationEvents } = await supabase
          .from('breeding_events')
          .select('date')
          .eq('cow_id', event.cow_id)
          .in('event_type', ['Insemination', 'Artificial Insemination', 'Natural Breeding'])
          .eq('result', 'Completed')
          .lte('date', event.date) // Before or on pregnancy check date
          .order('created_at', { ascending: false })
          .limit(1);

        if (inseminationEvents && inseminationEvents.length > 0) {
          const inseminationDate = new Date(inseminationEvents[0].date);
          const expectedDate = new Date(inseminationDate);
          expectedDate.setDate(expectedDate.getDate() + GESTATION_DAYS);

          breedingDeliveries.push({
            ...event,
            expected_delivery_date: expectedDate.toISOString().split('T')[0]
          });
        }
      }

      // 3. Merge cow table pregnancies with breeding events
      const expectedDeliveries = [];
      const seenCows = new Set();

      // Add cow table pregnancies first (priority)
      (pregnantCows || []).forEach(cow => {
        if (cow.expected_delivery_date) {
          seenCows.add(cow.id);
          expectedDeliveries.push({
            cow_id: cow.id,
            expected_delivery_date: cow.expected_delivery_date,
            date: cow.pregnancy_date,
            event_type: 'Pregnancy',
            result: 'Confirmed',
            cows: {
              id: cow.id,
              tag_number: cow.tag_number,
              name: cow.name,
              breed: cow.breed
            }
          });
        }
      });

      // Add breeding event pregnancies (skip if already added from cow table)
      breedingDeliveries.forEach(delivery => {
        if (!seenCows.has(delivery.cow_id)) {
          seenCows.add(delivery.cow_id);
          expectedDeliveries.push(delivery);
        }
      });

      // Sort by expected delivery date
      expectedDeliveries.sort((a, b) =>
        new Date(a.expected_delivery_date) - new Date(b.expected_delivery_date)
      );

      // 4. Fetch cows that already calved (for delivered tracking)
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
        .order('created_at', { ascending: false });

      if (calvingError) throw calvingError;

      return {
        expectedDeliveries,
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
        .order('created_at', { ascending: false })
        .limit(5);

      if (milkError) throw milkError;

      const { data: breedingEvents, error: breedingError } = await supabase
        .from('breeding_events')
        .select('id, date, event_type, details')
        .eq('cow_id', cowId)
        .order('created_at', { ascending: false })
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

// Sync pregnancy status from breeding events to cow table
export const syncPregnancyStatus = async (cowId) => {
  try {
    const status = await fetchReproductiveStatus(cowId);

    // This function is called after updateReproductiveStatus,
    // which already updates the cow table in the pregnancy check case
    // So we only need to handle edge cases here

    // Get the most recent breeding event to check current state
    const { data: recentEvent } = await supabase
      .from('breeding_events')
      .select('*')
      .eq('cow_id', cowId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Verify sync is correct
    const { data: cowData } = await supabase
      .from('cows')
      .select('is_pregnant')
      .eq('id', cowId)
      .single();

    const shouldBePregnant = status?.status === REPRODUCTIVE_STATUS.PREGNANT;

    // Only update if out of sync
    if (cowData && cowData.is_pregnant !== shouldBePregnant) {
      console.log(`Syncing pregnancy status for cow ${cowId}: ${shouldBePregnant}`);
      await supabase
        .from('cows')
        .update({ is_pregnant: shouldBePregnant })
        .eq('id', cowId);
    }

    return true;
  } catch (error) {
    console.error('Error syncing pregnancy status:', error);
    // Don't throw - this is a secondary operation
    return false;
  }
};

// Get breeding metrics for a cow
export const getBreedingMetrics = async (cowId) => {
  try {
    const events = await fetchBreedingEvents(cowId);
    const reproStatus = await fetchReproductiveStatus(cowId);

    const { data: cowData } = await supabase
      .from('cows')
      .select('is_pregnant')
      .eq('id', cowId)
      .single();

    // Calculate services per conception
    const inseminations = events.filter(e =>
      e.event_type === EVENT_TYPES.INSEMINATION &&
      e.result === BREEDING_RESULTS.COMPLETED
    );

    const pregnancies = events.filter(e =>
      e.event_type === EVENT_TYPES.PREGNANCY_CHECK &&
      e.result === BREEDING_RESULTS.POSITIVE
    );

    const servicesPerConception = pregnancies.length > 0
      ? inseminations.length / pregnancies.length
      : inseminations.length > 0 ? inseminations.length : 0;

    // Calculate days open (for non-pregnant cows)
    let daysOpen = 0;
    if (!cowData?.is_pregnant && reproStatus?.last_calving_date) {
      daysOpen = Math.floor((new Date() - new Date(reproStatus.last_calving_date)) / (1000 * 60 * 60 * 24));
    }

    // Calculate calving interval
    const calvingEvents = events
      .filter(e => e.event_type === EVENT_TYPES.CALVING)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let calvingInterval = null;
    if (calvingEvents.length >= 2) {
      calvingInterval = Math.floor(
        (new Date(calvingEvents[0].date) - new Date(calvingEvents[1].date)) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate conception rate
    const conceptionRate = servicesPerConception > 0
      ? ((1 / servicesPerConception) * 100).toFixed(1)
      : pregnancies.length > 0 ? '100.0' : '0.0';

    return {
      servicesPerConception: servicesPerConception.toFixed(1),
      daysOpen,
      calvingInterval,
      calvingCount: reproStatus?.calving_count || 0,
      conceptionRate: parseFloat(conceptionRate),
      totalInseminations: inseminations.length,
      totalPregnancies: pregnancies.length,
      totalCalvings: calvingEvents.length
    };
  } catch (error) {
    console.error('Error calculating breeding metrics:', error);
    return {
      servicesPerConception: '0.0',
      daysOpen: 0,
      calvingInterval: null,
      calvingCount: 0,
      conceptionRate: 0,
      totalInseminations: 0,
      totalPregnancies: 0,
      totalCalvings: 0
    };
  }
};

// Bulk record breeding event for multiple cows
export const recordBulkBreedingEvent = async (cowIds, eventData) => {
  try {
    const events = cowIds.map(cowId => ({
      cow_id: cowId,
      date: eventData.date,
      event_type: eventData.eventType,
      details: eventData.details,
      result: eventData.result,
      notes: eventData.notes || null,
      performed_by: eventData.performedBy || null
    }));

    const { data, error } = await supabase
      .from('breeding_events')
      .insert(events)
      .select();

    if (error) throw error;

    // Update reproductive status for all cows in parallel
    await Promise.all(cowIds.map(id => updateReproductiveStatus(id)));
    await Promise.all(cowIds.map(id => syncPregnancyStatus(id)));

    return data;
  } catch (error) {
    console.error('Error recording bulk breeding event:', error);
    throw error;
  }
};

// Calculate accurate pregnancy months
export const calculatePregnancyMonths = (pregnancyDate) => {
  if (!pregnancyDate) return null;

  const start = new Date(pregnancyDate);
  const now = new Date();

  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months += now.getMonth() - start.getMonth();

  // Adjust if day hasn't been reached yet this month
  if (now.getDate() < start.getDate()) {
    months--;
  }

  return Math.max(0, months);
};

// Get gestation progress information
export const getGestationProgress = (pregnancyDate) => {
  if (!pregnancyDate) return null;

  const daysSince = Math.floor((new Date() - new Date(pregnancyDate)) / (1000 * 60 * 60 * 24));
  const percentage = Math.min((daysSince / COW_GESTATION_DAYS) * 100, 100);
  const months = Math.floor(daysSince / 30);

  return {
    months,
    days: daysSince,
    percentage: parseFloat(percentage.toFixed(1)),
    remainingDays: Math.max(0, COW_GESTATION_DAYS - daysSince)
  };
};

// Update stale reproductive statuses (Fresh -> Open after 45 days)
export const updateStaleStatuses = async (cows, reproductiveStatuses) => {
  try {
    const staleCows = cows.filter(cow => {
      const status = reproductiveStatuses[cow.id];
      if (!status || status.status !== REPRODUCTIVE_STATUS.FRESH) return false;

      const daysSinceCalving = Math.floor(
        (new Date() - new Date(status.last_calving_date)) / (1000 * 60 * 60 * 24)
      );

      return daysSinceCalving > FRESH_COW_PERIOD_DAYS;
    });

    if (staleCows.length > 0) {
      console.log(`Updating ${staleCows.length} stale Fresh statuses to Open`);
      await Promise.all(staleCows.map(cow => updateReproductiveStatus(cow.id)));
    }

    return staleCows.length;
  } catch (error) {
    console.error('Error updating stale statuses:', error);
    return 0;
  }
};