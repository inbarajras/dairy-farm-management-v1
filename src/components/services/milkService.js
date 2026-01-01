import { supabase } from '../../lib/supabase'

// Fetch all milk collections with optional date range filtering
export const fetchMilkCollections = async (startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('milk_production')
      .select(`
        id,
        date,
        amount,
        shift,
        quality,
        notes,
        created_at,
        cow_id,
        fat,
        snf,
        quality_grade,
        cows (
          id,
          name,
          tag_number,
          breed,
          owner
        )
      `);
    
    // Filter by date range
    if (startDate && endDate && startDate.split('T')[0] === endDate.split('T')[0]) {
      // When it's "today", use direct equality for the specific date
      const targetDate = startDate.split('T')[0];
      query = query.eq('date', targetDate);
    } else {
      // When it's a range, use between
      if (startDate) {
        query = query.gte('date', startDate.split('T')[0]);
      }
      
      if (endDate) {
        query = query.lte('date', endDate.split('T')[0]);
      }
    }
    
    // Then add ordering
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Check for empty data
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Transform data to match the component's expected format
    return data.map(collection => ({
      id: collection.id,
      date: collection.date,
      shift: collection.shift || 'Morning',
      totalQuantity: parseFloat(collection.amount || 0),
      cowId: collection.cow_id,
      cowName: collection.cows?.name || 'Unknown',
      cowTagNumber: collection.cows?.tag_number || 'Unknown',
      cowBreed: collection.cows?.breed || 'Unknown',
      collectedBy: collection.cows?.owner || 'Farm Staff',
      quality: collection.quality_grade || collection.quality || 'Good',
      status: 'Completed',
      notes: collection.notes || '',
      createdAt: collection.created_at,
      // Use actual quality parameters from the database if available
      qualityParameters: {
        fat: collection.fat !== null ? parseFloat(collection.fat) : (3.8 + (Math.random() * 0.4 - 0.2)),
        snf: collection.snf !== null ? parseFloat(collection.snf) : (8.5 + (Math.random() * 0.4 - 0.2))
      }
    }));
  } catch (error) {
    console.error('Error fetching milk collections:', error);
    throw error;
  }
};

// Calculate monthly totals
export const fetchMonthlyTotals = async (year = new Date().getFullYear()) => {
  try {
    // Set up date bounds for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await supabase
      .from('milk_production')
      .select('date, amount')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    // Group by month and sum amounts
    const monthTotals = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    data.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth(); // 0-11
      const monthName = monthNames[month];
      
      if (!monthTotals[monthName]) {
        monthTotals[monthName] = 0;
      }
      
      monthTotals[monthName] += parseFloat(record.amount);
    });
    
    // Transform to array format expected by component
    return monthNames.map(month => ({
      month,
      quantity: monthTotals[month] || 0
    }));
  } catch (error) {
    console.error('Error calculating monthly totals:', error);
    throw error;
  }
};

// Calculate milk quality trends
export const fetchQualityTrends = async (days = 7) => {
  try {
    // Calculate the date from 'days' ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // We need to create a more sophisticated query here since we don't have explicit quality parameters
    // Instead, we'll use the cow_quality_parameters table you might want to create
    const { data, error } = await supabase
      .from('milk_production')
      .select('date, amount')
      .gte('date', startDateStr)
      .order('date');
    
    if (error) throw error;
    
    // Group by date and calculate average values
    const groupedByDate = {};
    
    data.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = {
          date: record.date,
          count: 0,
          totalAmount: 0,
          // We'll use static quality parameters for this example
          fat: 3.7 + Math.random() * 0.3, // Random between 3.7-4.0
          snf: 8.3 + Math.random() * 0.4 // Random between 8.3-8.7
        };
      }
      
      groupedByDate[record.date].count++;
      groupedByDate[record.date].totalAmount += parseFloat(record.amount);
    });
    
    // Transform to array and sort by date
    return Object.values(groupedByDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching quality trends:', error);
    throw error;
  }
};

// Add a new milk collection record
export const addMilkCollection = async (collectionData) => {
    try {
      // Check for existing record with same cow_id, date, and shift
      const { data: existingRecords, error: checkError } = await supabase
        .from('milk_production')
        .select('id')
        .eq('cow_id', collectionData.cowId)
        .eq('date', collectionData.date)
        .eq('shift', collectionData.shift || 'Morning');
      
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
          message: `Milk collection record already exists for this cow on ${collectionData.date} for ${collectionData.shift || 'Morning'} shift. Duplicate records are not allowed.`
        };
      }
      
      // First, let's insert into milk_production
      const { data, error } = await supabase
        .from('milk_production')
        .insert({
          cow_id: collectionData.cowId,
          date: collectionData.date,
          amount: collectionData.totalQuantity,
          shift: collectionData.shift,
          quality: collectionData.quality || 'Good',
          notes: collectionData.notes,
          fat: collectionData.fat || null,
          snf: collectionData.snf || null,
          quality_grade: determineQualityGrade({
            fat: collectionData.fat,
            snf: collectionData.snf
          })
        })
        .select();
      
      if (error) {
        console.error('Error inserting milk collection record:', error);
        return {
          success: false,
          message: 'Failed to add milk collection. Please try again.'
        };
      }
      
      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      console.error('Error adding milk collection:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      };
    }
  };

  const determineQualityGrade = (params) => {
    // Default to "Good" if parameters are missing
    if (!params.fat && !params.snf) {
      return "Good";
    }

    // Get quality standards
    const standards = {
      fat: { min: 3.5, target: 3.8, max: 4.2 },
      snf: { min: 8.0, target: 8.5, max: 9.0 }
    };

    // Score each parameter (0-5 scale)
    let scores = [];

    if (params.fat) {
      if (params.fat >= standards.fat.target - 0.1 && params.fat <= standards.fat.target + 0.1) {
        scores.push(5); // Excellent
      } else if (params.fat >= standards.fat.min && params.fat <= standards.fat.max) {
        scores.push(4); // Good
      } else if (params.fat >= standards.fat.min - 0.3 || params.fat <= standards.fat.max + 0.3) {
        scores.push(3); // Average
      } else {
        scores.push(2); // Poor
      }
    }

    if (params.snf) {
      if (params.snf >= standards.snf.target - 0.1 && params.snf <= standards.snf.target + 0.1) {
        scores.push(5); // Excellent
      } else if (params.snf >= standards.snf.min && params.snf <= standards.snf.max) {
        scores.push(4); // Good
      } else if (params.snf >= standards.snf.min - 0.3 || params.snf <= standards.snf.max + 0.3) {
        scores.push(3); // Average
      } else {
        scores.push(2); // Poor
      }
    }

    // Calculate average score
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Determine grade based on average score
    if (avgScore >= 4.5) return "Excellent";
    if (avgScore >= 3.5) return "Good";
    if (avgScore >= 2.5) return "Average";
    return "Poor";
  };

// Update a milk collection record
export const updateMilkCollection = async (id, collectionData) => {
  try {
    console.log('Updating milk collection with ID:', id, collectionData);
    
    // Ensure we have valid data
    if (!id || !collectionData || !collectionData.date || !collectionData.amount) {
      throw new Error('Missing required fields for updating milk collection');
    }
    
    // Format data for database
    const dbData = {
      date: collectionData.date,
      amount: parseFloat(collectionData.amount),
      shift: collectionData.shift,
      quality: collectionData.quality || 'Good',
      notes: collectionData.notes || null
    };
    
    // Add quality parameters if they exist
    if (collectionData.fat !== undefined && collectionData.fat !== null) {
      dbData.fat = parseFloat(collectionData.fat);
    }

    if (collectionData.snf !== undefined && collectionData.snf !== null) {
      dbData.snf = parseFloat(collectionData.snf);
    }

    // Calculate quality grade
    dbData.quality_grade = determineQualityGrade({
      fat: dbData.fat,
      snf: dbData.snf
    });
    
    // Update the database
    const { data, error } = await supabase
      .from('milk_production')
      .update(dbData)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
    console.log('Updated milk collection:', data);
    return data[0];
  } catch (error) {
    console.error('Error updating milk collection:', error);
    throw error;
  }
};

// Delete a milk collection
export const deleteMilkCollection = async (id) => {
  try {
    const { error } = await supabase
      .from('milk_production')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting milk collection:', error);
    throw error;
  }
};

// Get the quality standards
export const getQualityStandards = async () => {
  // Since we don't have a specific table for standards, return hardcoded values
  // In a real system you might store these in a settings table
  return {
    fat: { min: 3.5, target: 3.8, max: 4.2 },
    snf: { min: 8.0, target: 8.5, max: 9.0 }
  };
};

// Get alerts based on recent milk quality
export const getMilkAlerts = async () => {
  try {
    // This would normally query a dedicated alerts table
    // but for now we'll return a static alert
    return [
      {
        id: 'A001',
        date: new Date().toISOString().split('T')[0],
        type: 'quality',
        parameter: 'fat',
        value: 3.4,
        message: 'Fat content nearing lower limit',
        severity: 'warning'
      }
    ];
  } catch (error) {
    console.error('Error fetching milk alerts:', error);
    throw error;
  }
};

// Connect the cow milk production to the CowManagement component
export const getMilkProductionByCowId = async (cowId) => {
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
      shift: record.shift,
      quality: record.quality,
      notes: record.notes
    }));
  } catch (error) {
    console.error('Error fetching cow milk production:', error);
    throw error;
  }
};