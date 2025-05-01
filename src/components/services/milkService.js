import { supabase } from '../../lib/supabase'

// Fetch all milk collections with optional date range filtering
// Update the fetchMilkCollections function
// Update the fetchMilkCollections function

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
          cows (
            id,
            name,
            tag_number,
            breed,
            owner
          )
        `);
      
      // First - format the date for exact matching when using "today" 
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
        quality: collection.quality || 'Good',
        status: 'Completed',
        notes: collection.notes || '',
        createdAt: collection.created_at,
        // Add a placeholder for quality parameters since they aren't in the database yet
        qualityParameters: {
          fat: 3.8 + (Math.random() * 0.4 - 0.2), // Random range around 3.8
          protein: 3.2 + (Math.random() * 0.4 - 0.2), // Random range around 3.2
          lactose: 4.7 + (Math.random() * 0.4 - 0.2), // Random range around 4.7
          somatic: Math.round(180 + (Math.random() * 40 - 20)), // Random range around 180
          bacteria: Math.round(16000 + (Math.random() * 8000 - 4000)) // Random range around 16000
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
          protein: 3.1 + Math.random() * 0.3, // Random between 3.1-3.4
          lactose: 4.6 + Math.random() * 0.3 // Random between 4.6-4.9
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
      // First, let's insert into milk_production
      const { data, error } = await supabase
        .from('milk_production')
        .insert({
          cow_id: collectionData.cowId,
          date: collectionData.date,
          amount: collectionData.totalQuantity,
          shift: collectionData.shift,
          quality: collectionData.quality || 'Good',
          notes: collectionData.notes
        })
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error adding milk collection:', error);
      throw error;
    }
  };

// Update a milk collection record
export const updateMilkCollection = async (id, collectionData) => {
  try {
    console.log(collectionData);
    console.log(id);
    const { data, error } = await supabase
      .from('milk_production')
      .update({
        date: collectionData.date,
        amount: collectionData.amount,
        shift: collectionData.shift,
        quality: collectionData.quality,
        notes: collectionData.notes
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
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
    protein: { min: 3.0, target: 3.3, max: 3.6 },
    lactose: { min: 4.5, target: 4.8, max: 5.0 },
    somatic: { max: 200 },
    bacteria: { max: 20000 }
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
        parameter: 'somatic',
        value: 190,
        message: 'Somatic cell count nearing upper limit',
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