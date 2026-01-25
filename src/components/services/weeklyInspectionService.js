import { supabase } from '../../lib/supabase';

// Create a new weekly inspection
export const createWeeklyInspection = async (inspectionData) => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .insert([
        {
          cow_id: inspectionData.cowId,
          week_start_date: inspectionData.weekStartDate,
          body_condition_score: inspectionData.bodyConditionScore,
          feed_intake: inspectionData.feedIntake,
          water_intake: inspectionData.waterIntake,
          udder_health: inspectionData.udderHealth,
          hoof_leg_condition: inspectionData.hoofLegCondition,
          heat_observed: inspectionData.heatObserved,
          health_issues: inspectionData.healthIssues,
          treatment_given: inspectionData.treatmentGiven,
          deworming_due_date: inspectionData.dewormingDueDate || null,
          vaccination_due: inspectionData.vaccinationDue,
          remarks: inspectionData.remarks,
          inspector_name: inspectionData.inspectorName
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating weekly inspection:', error);
    throw error;
  }
};

// Fetch all weekly inspections
export const fetchWeeklyInspections = async () => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .select(`
        *,
        cows:cow_id (id, name, tag_number, breed, date_of_birth)
      `)
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    // Transform data to match component expectations
    return data.map(inspection => ({
      id: inspection.id,
      cowId: inspection.cow_id,
      weekStartDate: inspection.week_start_date,
      bodyConditionScore: inspection.body_condition_score,
      feedIntake: inspection.feed_intake,
      waterIntake: inspection.water_intake,
      udderHealth: inspection.udder_health,
      hoofLegCondition: inspection.hoof_leg_condition,
      heatObserved: inspection.heat_observed,
      healthIssues: inspection.health_issues,
      treatmentGiven: inspection.treatment_given,
      dewormingDueDate: inspection.deworming_due_date,
      vaccinationDue: inspection.vaccination_due,
      remarks: inspection.remarks,
      inspectorName: inspection.inspector_name,
      createdAt: inspection.created_at
    }));
  } catch (error) {
    console.error('Error fetching weekly inspections:', error);
    throw error;
  }
};

// Fetch weekly inspections for a specific cow
export const fetchCowWeeklyInspections = async (cowId) => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .select('*')
      .eq('cow_id', cowId)
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    return data.map(inspection => ({
      id: inspection.id,
      cowId: inspection.cow_id,
      weekStartDate: inspection.week_start_date,
      bodyConditionScore: inspection.body_condition_score,
      feedIntake: inspection.feed_intake,
      waterIntake: inspection.water_intake,
      udderHealth: inspection.udder_health,
      hoofLegCondition: inspection.hoof_leg_condition,
      heatObserved: inspection.heat_observed,
      healthIssues: inspection.health_issues,
      treatmentGiven: inspection.treatment_given,
      dewormingDueDate: inspection.deworming_due_date,
      vaccinationDue: inspection.vaccination_due,
      remarks: inspection.remarks,
      inspectorName: inspection.inspector_name,
      createdAt: inspection.created_at
    }));
  } catch (error) {
    console.error(`Error fetching weekly inspections for cow ${cowId}:`, error);
    throw error;
  }
};

// Fetch a single weekly inspection by ID
export const fetchWeeklyInspectionById = async (inspectionId) => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .select(`
        *,
        cows:cow_id (id, name, tag_number, breed, date_of_birth)
      `)
      .eq('id', inspectionId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cowId: data.cow_id,
      weekStartDate: data.week_start_date,
      bodyConditionScore: data.body_condition_score,
      feedIntake: data.feed_intake,
      waterIntake: data.water_intake,
      udderHealth: data.udder_health,
      hoofLegCondition: data.hoof_leg_condition,
      heatObserved: data.heat_observed,
      healthIssues: data.health_issues,
      treatmentGiven: data.treatment_given,
      dewormingDueDate: data.deworming_due_date,
      vaccinationDue: data.vaccination_due,
      remarks: data.remarks,
      inspectorName: data.inspector_name,
      createdAt: data.created_at
    };
  } catch (error) {
    console.error(`Error fetching weekly inspection ${inspectionId}:`, error);
    throw error;
  }
};

// Update a weekly inspection
export const updateWeeklyInspection = async (inspectionId, inspectionData) => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .update({
        cow_id: inspectionData.cowId,
        week_start_date: inspectionData.weekStartDate,
        body_condition_score: inspectionData.bodyConditionScore,
        feed_intake: inspectionData.feedIntake,
        water_intake: inspectionData.waterIntake,
        udder_health: inspectionData.udderHealth,
        hoof_leg_condition: inspectionData.hoofLegCondition,
        heat_observed: inspectionData.heatObserved,
        health_issues: inspectionData.healthIssues,
        treatment_given: inspectionData.treatmentGiven,
        deworming_due_date: inspectionData.dewormingDueDate || null,
        vaccination_due: inspectionData.vaccinationDue,
        remarks: inspectionData.remarks,
        inspector_name: inspectionData.inspectorName
      })
      .eq('id', inspectionId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Error updating weekly inspection ${inspectionId}:`, error);
    throw error;
  }
};

// Delete a weekly inspection
export const deleteWeeklyInspection = async (inspectionId) => {
  try {
    const { error } = await supabase
      .from('weekly_inspections')
      .delete()
      .eq('id', inspectionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Error deleting weekly inspection ${inspectionId}:`, error);
    throw error;
  }
};

// Fetch weekly inspections within a date range
export const fetchWeeklyInspectionsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .select(`
        *,
        cows:cow_id (id, name, tag_number, breed)
      `)
      .gte('week_start_date', startDate)
      .lte('week_start_date', endDate)
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    return data.map(inspection => ({
      id: inspection.id,
      cowId: inspection.cow_id,
      weekStartDate: inspection.week_start_date,
      bodyConditionScore: inspection.body_condition_score,
      feedIntake: inspection.feed_intake,
      waterIntake: inspection.water_intake,
      udderHealth: inspection.udder_health,
      hoofLegCondition: inspection.hoof_leg_condition,
      heatObserved: inspection.heat_observed,
      healthIssues: inspection.health_issues,
      treatmentGiven: inspection.treatment_given,
      dewormingDueDate: inspection.deworming_due_date,
      vaccinationDue: inspection.vaccination_due,
      remarks: inspection.remarks,
      inspectorName: inspection.inspector_name,
      createdAt: inspection.created_at
    }));
  } catch (error) {
    console.error('Error fetching weekly inspections by date range:', error);
    throw error;
  }
};

// Generate statistics from weekly inspections
export const generateWeeklyInspectionStats = async () => {
  try {
    const { data, error } = await supabase
      .from('weekly_inspections')
      .select('*')
      .order('week_start_date', { ascending: false });

    if (error) throw error;

    const stats = {
      totalInspections: data.length,
      cowsWithHealthIssues: 0,
      averageBodyConditionScore: 0,
      mastitisCases: 0,
      heatObservedCount: 0,
      upcomingDewormings: 0,
      recentInspections: []
    };

    let totalBodyScore = 0;
    let bodyScoreCount = 0;
    const today = new Date();

    data.forEach(inspection => {
      // Count health issues
      if (inspection.health_issues && inspection.health_issues.trim() !== '') {
        stats.cowsWithHealthIssues++;
      }

      // Calculate average body condition score
      if (inspection.body_condition_score) {
        totalBodyScore += parseInt(inspection.body_condition_score);
        bodyScoreCount++;
      }

      // Count mastitis cases
      if (inspection.udder_health === 'Mastitis') {
        stats.mastitisCases++;
      }

      // Count heat observations
      if (inspection.heat_observed === 'Yes') {
        stats.heatObservedCount++;
      }

      // Count upcoming dewormings (within next 30 days)
      if (inspection.deworming_due_date) {
        const dueDate = new Date(inspection.deworming_due_date);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntil > 0 && daysUntil <= 30) {
          stats.upcomingDewormings++;
        }
      }
    });

    stats.averageBodyConditionScore = bodyScoreCount > 0
      ? (totalBodyScore / bodyScoreCount).toFixed(1)
      : 'N/A';

    stats.recentInspections = data.slice(0, 5).map(inspection => ({
      id: inspection.id,
      cowId: inspection.cow_id,
      weekStartDate: inspection.week_start_date,
      healthIssues: inspection.health_issues,
      inspectorName: inspection.inspector_name
    }));

    return stats;
  } catch (error) {
    console.error('Error generating weekly inspection stats:', error);
    throw error;
  }
};
