import { supabase } from '../../lib/supabase';

// Fetch all employees with basic details
export const fetchEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Fetch complete employee details by ID including attendance history
export const fetchEmployeeById = async (employeeId) => {
  try {
    // Fetch employee basic info
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    
    if (employeeError) throw employeeError;
    
    // Fetch attendance history for this employee
    const { data: attendanceHistory, error: attendanceError } = await supabase
      .from('employee_attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false });
    
    if (attendanceError) throw attendanceError;
    
    // Return employee with attendance history
    return {
      ...employee,
      attendanceHistory: attendanceHistory || []
    };
  } catch (error) {
    console.error(`Error fetching employee with ID ${employeeId}:`, error);
    throw error;
  }
};

// Add a new employee
export const addEmployee = async (employeeData) => {
    try {
      // Prepare employee record
      const employee = {
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address || null,
        job_title: employeeData.jobTitle,
        department: employeeData.department,
        date_joined: employeeData.dateJoined,
        status: 'Active',
        salary: parseFloat(employeeData.salary),
        schedule: employeeData.schedule,
        attendance_rate: 100, // Default for new employee
        performance_rating: null, // Default for new employee
        skills: [],
        certifications: []
      };
      
      // Handle photo upload if provided
      if (employeeData.photo) {
        // Generate unique filename
        const fileExt = employeeData.photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `employees/${fileName}`;
        
        // Upload photo to storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, employeeData.photo);
        
        if (uploadError) throw uploadError;
        
        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        
        // Add image URL to employee data
        employee.image_url = publicUrl;
      } else {
        // Use default avatar
        employee.image_url = 'https://via.placeholder.com/150';
      }
      
      // Add employee to database
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();
      
      if (error) throw error;
      
      // Try to create default shifts for the new employee
      try {
        // Get the current date's Monday (start of the week)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        
        // Create default shift pattern
        const defaultShift = {
          employee_id: newEmployee.id,
          week_start: monday.toISOString().split('T')[0],
          shifts: [
            { day: 'Monday', start_time: '08:00', end_time: '17:00' },
            { day: 'Tuesday', start_time: '08:00', end_time: '17:00' },
            { day: 'Wednesday', start_time: '08:00', end_time: '17:00' },
            { day: 'Thursday', start_time: '08:00', end_time: '17:00' },
            { day: 'Friday', start_time: '08:00', end_time: '17:00' }
          ]
        };
        
        // Try to insert the shift - if table doesn't exist yet, this will fail silently
        await supabase
          .from('employee_shifts')
          .insert(defaultShift)
          .catch(shiftError => {
            console.log('Could not add default shift, table may not exist yet:', shiftError);
          });
        
      } catch (shiftError) {
        // Log but don't fail if we can't add shifts
        console.warn('Could not add default shifts for new employee:', shiftError);
      }
      
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  };

// Update an employee
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const employee = {
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address || null,
        job_title: employeeData.jobTitle,
        department: employeeData.department,
        date_joined: employeeData.dateJoined,
        status: 'Active',
        salary: parseFloat(employeeData.salary),
        schedule: employeeData.schedule,
        attendance_rate: employeeData.attendanceRate, // Default for new employee
        performance_rating: null, // Default for new employee
        skills: [],
        certifications: []
      };

    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', employeeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating employee with ID ${employeeId}:`, error);
    throw error;
  }
};

// Record attendance for an employee
export const recordAttendance = async (attendanceData) => {
    try {
      const { employeeId, date, status, hours_worked, notes, id } = attendanceData;
      
      // Check if attendance already exists for this employee and date
      const { data: existingRecord, error: checkError } = await supabase
        .from('employee_attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing attendance record:', checkError);
        throw checkError;
      }
      
      let result;
      
      // If record exists and no ID was provided, or if ID was provided but doesn't match existing, use existing ID
      const recordId = id || (existingRecord?.id);
      
      if (recordId) {
        // Update existing record
        const { data, error } = await supabase
          .from('employee_attendance')
          .update({
            status,
            hours_worked,
            notes
          })
          .eq('id', recordId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('employee_attendance')
          .insert({
            employee_id: employeeId,
            date,
            status,
            hours_worked,
            notes
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  };
  
  // Get monthly attendance summary - Updated to match the schema
  export const getMonthlyAttendanceSummary = async (month, year) => {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('employee_attendance')
        .select(`
          id,
          employee_id,
          date,
          status,
          hours_worked,
          notes,
          created_at,
          employees:employee_id (id, name, job_title, image_url)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching monthly attendance summary:', error);
      throw error;
    }
  };

// Get attendance statistics
export const getAttendanceStatistics = async (month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // First, fetch all attendance records for the period
    const { data, error } = await supabase
      .from('employee_attendance')
      .select('status, date')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    // If no data, return default values
    if (!data || data.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        attendanceRateToday: 0
      };
    }
    
    // Count statuses for all dates
    const countByStatus = data.reduce((acc, record) => {
      const status = record.status;
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});
    
    // Count statuses for today only
    const todayRecords = data.filter(record => record.date === today);
    const todayCountByStatus = todayRecords.reduce((acc, record) => {
      const status = record.status;
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});
    
    // Calculate the statistics for the month
    const present = countByStatus['Present'] || 0;
    const absent = countByStatus['Absent'] || 0;
    const late = countByStatus['Late'] || 0;
    const totalDays = data.length;
    
    const attendanceRate = totalDays ? ((present + late) / totalDays * 100).toFixed(1) : 0;
    
    // Calculate today's statistics
    const presentToday = todayCountByStatus['Present'] || 0;
    const absentToday = todayCountByStatus['Absent'] || 0;
    const lateToday = todayCountByStatus['Late'] || 0;
    const totalToday = todayRecords.length;
    
    const attendanceRateToday = totalToday 
      ? ((presentToday + lateToday) / totalToday * 100).toFixed(1) 
      : "0.0";
    
    return {
      total: totalDays,
      present,
      absent,
      late,
      attendanceRate: parseFloat(attendanceRate),
      presentToday,
      absentToday,
      lateToday,
      totalToday,
      attendanceRateToday: parseFloat(attendanceRateToday)
    };
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    throw error;
  }
};

// Get employee shifts
export const getEmployeeShifts = async (weekStart) => {
    try {
      const formattedWeekStart = weekStart.toISOString().split('T')[0];
      
      // Calculate the next week start to check for shifts spanning the week boundary
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const formattedNextWeekStart = nextWeekStart.toISOString().split('T')[0];
      
      // Fetch shifts for the week - include the next week for potential shifts spanning the boundary
      const { data, error } = await supabase
        .from('employee_shifts')
        .select(`
          id,
          employee_id,
          week_start,
          shifts,
          created_at,
          updated_at,
          employees:employee_id (id, name, job_title, image_url)
        `)
        .or(`week_start.eq.${formattedWeekStart},week_start.eq.${formattedNextWeekStart}`);
      
      if (error) throw error;
      
      // Process shifts to include only those with dates relevant to the current view
      const relevantData = data || [];
      
      // First day of the week
      const weekStartDate = new Date(weekStart);
      // Last day of the week (6 days after the start)
      const weekEndDate = new Date(weekStart);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      
      // Filter shifts to include only those in the current week
      relevantData.forEach(record => {
        if (record.shifts && Array.isArray(record.shifts)) {
          record.shifts = record.shifts.filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate >= weekStartDate && shiftDate <= weekEndDate;
          });
        }
      });
      
      return relevantData;
    } catch (error) {
      console.error('Error fetching employee shifts:', error);
      return [];
    }
  };

export const getEmployeePerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employees:employee_id (id, name, job_title, image_url)
        `)
        .order('review_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee performance data:', error);
      return [];
    }
  };
  
  // Get scheduled performance reviews - This function remains mostly the same
  export const getScheduledReviews = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('scheduled_reviews')
        .select(`
          *,
          employees:employee_id (id, name, job_title, image_url),
          reviewer:reviewer_id (id, name)
        `)
        .gte('review_date', today)
        .order('review_date');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled reviews:', error);
      return [];
    }
  };
  
  // Also modify this function if you have it
  export const schedulePerformanceReview = async (reviewData) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reviews')
        .insert({
          employee_id: reviewData.employeeId,
          reviewer_id: reviewData.reviewerId,
          review_type: reviewData.reviewType,
          review_date: reviewData.reviewDate,
          status: 'Scheduled',
          notes: reviewData.notes || null
        })
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error scheduling performance review:', error);
      throw error;
    }
  };

  export const assignShifts = async (employeeId, shiftData, dateRange) => {
    try {
      // Get the start of each week in the date range
      const weeks = getUniqueWeekStarts(dateRange.startDate, dateRange.endDate);
      const results = [];
      
      // For each week, either create a new record or update existing one
      for (const weekStart of weeks) {
        const formattedWeekStart = weekStart.toISOString().split('T')[0];
        
        // Get the days of this week that fall within the date range and are selected working days
        const weekDays = getDaysInWeek(weekStart, dateRange.startDate, dateRange.endDate, dateRange.workingDays);
        
        if (weekDays.length === 0) continue; // Skip if no days in this week
        
        // Create shift objects for each day
        const newShifts = weekDays.map(day => ({
          day: getDayName(day.getDay()),
          date: day.toISOString().split('T')[0],
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          shift_type: shiftData.shift_type || 'Regular'
        }));
        
        // Check if record already exists for this week
        const { data: existing } = await supabase
          .from('employee_shifts')
          .select('id, shifts')
          .eq('employee_id', employeeId)
          .eq('week_start', formattedWeekStart)
          .maybeSingle();
        
        let result;
        
        if (existing) {
          // If record exists, merge new shifts with existing ones, avoiding duplicates
          const existingShifts = existing.shifts || [];
          const mergedShifts = mergeShifts(existingShifts, newShifts);
          
          const { data, error } = await supabase
            .from('employee_shifts')
            .update({
              shifts: mergedShifts,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select();
          
          if (error) throw error;
          result = data;
        } else {
          // If no record exists, create a new one
          const { data, error } = await supabase
            .from('employee_shifts')
            .insert({
              employee_id: employeeId,
              week_start: formattedWeekStart,
              shifts: newShifts
            })
            .select();
          
          if (error) throw error;
          result = data;
        }
        
        results.push(result);
      }
      
      return results.flat();
    } catch (error) {
      console.error('Error assigning shifts:', error);
      throw error;
    }
  };

  const getUniqueWeekStarts = (startDate, endDate) => {
    const result = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start);
    
    // Find the Monday of the first week
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to get Monday
    current = new Date(current.setDate(diff));
    
    // Add week starts until we reach beyond the end date
    while (current <= end) {
      result.push(new Date(current));
      // Move to next Monday
      current.setDate(current.getDate() + 7);
    }
    
    return result;
  };
  
  // Get days in a week that fall within a date range and are selected working days
  const getDaysInWeek = (weekStart, rangeStart, rangeEnd, workingDays) => {
    const result = [];
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    
    // Clone weekStart to avoid modifying the original
    const current = new Date(weekStart);
    
    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayName = getDayName(dayOfWeek);
      
      // Check if this day is within the date range and is a working day
      if (
        current >= start && 
        current <= end && 
        workingDays[getDayAbbreviation(dayOfWeek)]
      ) {
        result.push(new Date(current));
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return result;
  };
  
  // Helper to get day name from day number
  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };
  
  // Helper to get day abbreviation from day number
  const getDayAbbreviation = (dayNumber) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNumber];
  };
  
  // Helper function to merge shifts and avoid duplicates
  const mergeShifts = (existingShifts, newShifts) => {
    const combined = [...existingShifts];
    
    newShifts.forEach(newShift => {
      // Check if this shift already exists for the same date
      const existingIndex = combined.findIndex(shift => shift.date === newShift.date);
      
      if (existingIndex >= 0) {
        // Update existing shift
        combined[existingIndex] = {
          ...combined[existingIndex],
          start_time: newShift.start_time,
          end_time: newShift.end_time,
          shift_type: newShift.shift_type
        };
      } else {
        // Add new shift
        combined.push(newShift);
      }
    });
    
    return combined;
  };

  // Get all performance reviews
export const getPerformanceReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          employees:employee_id(id, name, job_title),
          reviewer:reviewer_id(id, name)
        `)
        .order('scheduled_date', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      throw error;
    }
  };
  
  // Get reviews for a specific employee
  export const getEmployeePerformanceReviews = async (employeeId) => {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          reviewer:reviewer_id(id, name)
        `)
        .eq('employee_id', employeeId)
        .order('scheduled_date', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching performance reviews for employee ${employeeId}:`, error);
      throw error;
    }
  };
  
  // Create a new performance review
  export const createPerformanceReview = async (reviewData) => {
    try {
      // Create a clean copy of the data to avoid modifying the original
      const cleanData = { ...reviewData };
      
      // Handle reviewer_id - remove if empty string
      if (cleanData.reviewer_id === '') {
        delete cleanData.reviewer_id;
      }
      
      // Handle empty dates
      if (cleanData.completion_date === '') {
        delete cleanData.completion_date;
      }
      
      // Convert rating to a number if it exists
      if (cleanData.rating) {
        cleanData.rating = parseFloat(cleanData.rating);
      }
      
      const { data, error } = await supabase
        .from('performance_reviews')
        .insert([cleanData])
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating performance review:', error);
      throw error;
    }
  };
  
  // Update an existing performance review
  export const updatePerformanceReview = async (reviewId, reviewData) => {
    try {
      // Create a clean copy of the data to avoid modifying the original
      const cleanData = { ...reviewData };
      
      // Add updated_at timestamp
      cleanData.updated_at = new Date().toISOString();
      
      // Handle reviewer_id - remove if empty string
      if (cleanData.reviewer_id === '') {
        delete cleanData.reviewer_id;
      }
      
      // Handle empty dates
      if (cleanData.completion_date === '') {
        delete cleanData.completion_date;
      }
      
      // Convert rating to a number if it exists
      if (cleanData.rating) {
        cleanData.rating = parseFloat(cleanData.rating);
      }
      
      // For completed reviews with no rating, set a default
      if (cleanData.status === 'Completed' && !cleanData.rating) {
        cleanData.rating = 3.0;
      }
      
      // Update the review in the database
      const { data, error } = await supabase
        .from('performance_reviews')
        .update(cleanData)
        .eq('id', reviewId)
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error updating performance review ${reviewId}:`, error);
      throw error;
    }
  };
  
  // Delete a performance review
  export const deletePerformanceReview = async (reviewId) => {
    try {
      const { error } = await supabase
        .from('performance_reviews')
        .delete()
        .eq('id', reviewId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting performance review ${reviewId}:`, error);
      throw error;
    }
  };