import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Create reports table if it doesn't exist yet
export const initReportsTable = async () => {
  try {
    // Check if the reports table exists
    const { error: checkError } = await supabase
      .from('reports')
      .select('id')
      .limit(1);
    
    // If there's a 'relation "reports" does not exist' error, create the table
    if (checkError && checkError.message.includes('relation "reports" does not exist')) {
      // Create the reports table using SQL
      const { error: createError } = await supabase.rpc('create_reports_table');
      
      if (createError) throw createError;
      
      console.log('Reports table created successfully');
      
      // Create initial seed data
      await seedInitialReports();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing reports table:', error);
    return false;
  }
};

// Seed initial reports data
const seedInitialReports = async () => {
  try {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const reports = [
      {
        title: `Monthly Analysis Report - ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        report_type: 'monthly_analysis',
        date_range_start: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString(),
        date_range_end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString(),
        created_at: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 2).toISOString(),
        format: 'pdf',
        file_size: '1.2 MB',
        // created_by: '1',
        file_path: '/reports/monthly-analysis-april-2023.pdf',
        status: 'completed'
      },
      {
        title: `Weekly Summary Report - Week ${getWeekNumber(now)}, ${now.getFullYear()}`,
        report_type: 'weekly_summary',
        date_range_start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).toISOString(),
        date_range_end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(),
        created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(),
        format: 'xlsx',
        file_size: '856 KB',
        // created_by: '1',
        file_path: '/reports/weekly-summary-week16-2023.xlsx',
        status: 'completed'
      },
      {
        title: `Quality Metrics Report - ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        report_type: 'quality_metrics',
        date_range_start: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString(),
        date_range_end: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString(),
        created_at: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
        format: 'pdf',
        file_size: '1.5 MB',
        // created_by: '1',
        file_path: '/reports/quality-metrics-march-2023.pdf',
        status: 'completed'
      }
    ];
    
    const { error } = await supabase.from('reports').insert(reports);
    if (error) throw error;
    
    console.log('Initial reports data seeded successfully');
    return true;
  } catch (error) {
    console.error('Error seeding initial reports data:', error);
    return false;
  }
};

// Helper function to get week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Fetch all reports
export const fetchReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

// Generate and save a new report
export const generateReport = async (reportOptions) => {
  try {
    const { 
      reportType,
      dateRangeStart,
      dateRangeEnd,
      format,
      userId = '1' // Default user ID if not provided
    } = reportOptions;
    
    // Start by creating a record in the database
    const reportData = {
      title: generateReportTitle(reportType, dateRangeStart, dateRangeEnd),
      report_type: reportType,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      created_at: new Date().toISOString(),
      format: format,
      file_size: '0 KB', // Will be updated later
    //   created_by: '6fa208dd-4af8-44ef-9b64-1f9beb837503',
      file_path: '', // Will be updated later
      status: 'generating'
    };
    
    // Insert the report record
    const { data: reportRecord, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch data for the report based on type and date range
    const reportData1 = await fetchDataForReport(reportType, dateRangeStart, dateRangeEnd);
    
    // Generate the report file
    const { fileData, fileSize, filePath } = await createReportFile(
      reportType, 
      format, 
      reportData1, 
      reportRecord.id
    );
    
    // Update the report record with file info
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        file_size: fileSize,
        file_path: filePath,
        status: 'completed'
      })
      .eq('id', reportRecord.id);
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      reportId: reportRecord.id,
      fileData,
      fileName: filePath.split('/').pop()
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Generate a report title based on report type and date range
function generateReportTitle(reportType, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  switch (reportType) {
    case 'daily':
      return `Daily Production Report - ${start.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
    
    case 'weekly':
      return `Weekly Summary Report - Week ${getWeekNumber(start)}, ${start.getFullYear()}`;
    
    case 'monthly':
      return `Monthly Analysis Report - ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    case 'quality':
      return `Quality Metrics Report - ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    case 'compliance':
      return `Compliance Report - ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to ${end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    default:
      return `Milk Production Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
  }
}

// Fetch data needed for the report from Supabase
// Replace the current fetchDataForReport function with this improved version
async function fetchDataForReport(reportType, startDate, endDate) {
  try {
    let milkData = [];
    let qualityData = [];
    
    // Fetch milk production data with proper cow data joining
    const { data: milkProduction, error: milkError } = await supabase
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
        cows:cow_id (id, name, tag_number, breed, owner)
      `)
      .gte('date', startDate.split('T')[0])
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: true });
    
    if (milkError) throw milkError;
    
    // Properly structure the milk data with cow information
    milkData = milkProduction ? milkProduction.map(record => ({
      id: record.id,
      date: record.date,
      amount: record.amount,
      totalQuantity: record.amount, // Add this for UI consistency
      shift: record.shift,
      quality: record.quality,
      notes: record.notes,
      created_at: record.created_at,
      cow_id: record.cow_id,
      collectedBy: "Farm Staff", // Default value if not available
      cowName: record.cows?.name || 'Unknown',
      cowTag: record.cows?.tag_number || 'Unknown',
      cowBreed: record.cows?.breed || 'Unknown',
      cowOwner: record.cows?.owner || 'Unknown'
    })) : [];
    
    console.log("Fetched milk data:", milkData);
    console.log("Number of records:", milkData.length);
    console.log("Sample cow data:", milkData.length > 0 ? {
      cow_id: milkData[0].cow_id,
      name: milkData[0].cowName,
      tag: milkData[0].cowTag
    } : "No records");
    
    // For quality and compliance reports, fetch additional data
    if (reportType === 'quality' || reportType === 'compliance') {
      // In a real app, you'd have a quality_measurements table
      // Here we'll calculate quality stats from the milk data with simulated values
      qualityData = milkData.map(record => ({
        date: record.date,
        fat: 3.8 + (Math.random() * 0.4 - 0.2),
        protein: 3.2 + (Math.random() * 0.4 - 0.2),
        lactose: 4.7 + (Math.random() * 0.4 - 0.2),
        somatic: Math.round(180 + (Math.random() * 40 - 20)),
        bacteria: Math.round(16000 + (Math.random() * 8000 - 4000))
      }));
    }
    
    // Process data based on report type
    switch (reportType) {
      case 'daily':
        return processDailyReportData(milkData);
      
      case 'weekly':
        return processWeeklyReportData(milkData);
      
      case 'monthly':
        return processMonthlyReportData(milkData);
      
      case 'quality':
        return processQualityReportData(milkData, qualityData);
      
      case 'compliance':
        return processComplianceReportData(milkData, qualityData);
      
      default:
        return { milkData, qualityData };
    }
  } catch (error) {
    console.error('Error fetching data for report:', error);
    throw error;
  }
}

// Update processDailyReportData function to correctly handle cow data
function processDailyReportData(milkData) {
  console.log("Processing daily report data with", milkData.length, "records");
  
  // Group by shift
  const shiftData = {
    Morning: milkData.filter(record => record.shift === 'Morning'),
    Evening: milkData.filter(record => record.shift === 'Evening')
  };
  
  // Calculate totals
  const totalMorning = shiftData.Morning.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const totalEvening = shiftData.Evening.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
  const totalDay = totalMorning + totalEvening;
  
  // Calculate per cow data - ensure we're handling the cow data correctly
  const cowData = {};
  milkData.forEach(record => {
    const cowId = record.cow_id;
    
    // Skip records with no cow_id
    if (!cowId) {
      console.log("Found record with no cow_id:", record.id);
      return;
    }
    
    if (!cowData[cowId]) {
      cowData[cowId] = {
        id: cowId,
        name: record.cowName || 'Unknown',
        tagNumber: record.cowTag || 'Unknown',
        totalAmount: 0,
        collections: []
      };
    }
    
    cowData[cowId].totalAmount += parseFloat(record.amount || 0);
    cowData[cowId].collections.push({
      shift: record.shift,
      amount: parseFloat(record.amount || 0),
      quality: record.quality
    });
  });
  
  const cowsList = Object.values(cowData);
  console.log("Total cows processed:", cowsList.length);
  
  if (cowsList.length > 0) {
    console.log("Sample cow data:", cowsList[0]);
  }
  
  return {
    date: milkData.length > 0 ? milkData[0].date : new Date().toISOString().split('T')[0],
    totalMilk: totalDay,
    morningMilk: totalMorning,
    eveningMilk: totalEvening,
    numberOfCows: Object.keys(cowData).length,
    topProducers: cowsList
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5),
    collections: milkData.map(record => ({
      id: record.id,
      date: record.date,
      shift: record.shift,
      amount: parseFloat(record.amount || 0),
      cowName: record.cowName || 'Unknown',
      cowTag: record.cowTag || 'Unknown',
      quality: record.quality
    }))
  };
}

function processWeeklyReportData(milkData) {
  console.log("Processing weekly report with", milkData.length, "records");
  
  // Group by date
  const dailyData = {};
  milkData.forEach(record => {
    const date = record.date;
    
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        totalAmount: 0,
        morningAmount: 0,
        eveningAmount: 0,
        collections: []
      };
    }
    
    const amount = parseFloat(record.amount || 0);
    dailyData[date].totalAmount += amount;
    
    if (record.shift === 'Morning') {
      dailyData[date].morningAmount += amount;
    } else {
      dailyData[date].eveningAmount += amount;
    }
    
    dailyData[date].collections.push({
      id: record.id,
      shift: record.shift,
      amount,
      cowName: record.cowName || 'Unknown', // Use already extracted cow name
      quality: record.quality
    });
  });
  
  // Calculate weekly totals
  const totalWeek = Object.values(dailyData).reduce((sum, day) => sum + day.totalAmount, 0);
  const avgDaily = totalWeek / Object.keys(dailyData).length || 0;
  
  // Find top producing cows across the week
  const cowTotals = {};
  milkData.forEach(record => {
    const cowId = record.cow_id;
    if (!cowId) return; // Skip if no cow ID
    
    if (!cowTotals[cowId]) {
      cowTotals[cowId] = {
        id: cowId,
        name: record.cowName || 'Unknown', // Use already extracted cow name
        tagNumber: record.cowTag || 'Unknown', // Use already extracted cow tag
        totalAmount: 0
      };
    }
    
    cowTotals[cowId].totalAmount += parseFloat(record.amount || 0);
  });
  
  console.log("Total unique cows found:", Object.keys(cowTotals).length);
  if (Object.keys(cowTotals).length > 0) {
    console.log("Sample cow data:", Object.values(cowTotals)[0]);
  }
  
  return {
    weekStart: Object.keys(dailyData).sort()[0],
    weekEnd: Object.keys(dailyData).sort().pop(),
    totalMilk: totalWeek,
    averageDailyMilk: avgDaily,
    dailyBreakdown: Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    topProducers: Object.values(cowTotals)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
  };
}

function processMonthlyReportData(milkData) {
  console.log("Processing monthly report with", milkData.length, "records");
  
  // Group by week
  const weeks = {};
  milkData.forEach(record => {
    const date = new Date(record.date);
    const weekNum = getWeekNumber(date);
    const weekKey = `${date.getFullYear()}-W${weekNum}`;
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        week: weekNum,
        year: date.getFullYear(),
        startDate: null,
        endDate: null,
        totalAmount: 0,
        collections: []
      };
    }
    
    if (!weeks[weekKey].startDate || date < new Date(weeks[weekKey].startDate)) {
      weeks[weekKey].startDate = record.date;
    }
    
    if (!weeks[weekKey].endDate || date > new Date(weeks[weekKey].endDate)) {
      weeks[weekKey].endDate = record.date;
    }
    
    weeks[weekKey].totalAmount += parseFloat(record.amount || 0);
    weeks[weekKey].collections.push({
      id: record.id,
      date: record.date,
      shift: record.shift,
      amount: parseFloat(record.amount || 0),
      cowName: record.cowName || 'Unknown'  // Use already extracted cow name
    });
  });
  
  // Calculate monthly averages
  const totalMonth = Object.values(weeks).reduce((sum, week) => sum + week.totalAmount, 0);
  const dailyAvg = totalMonth / (new Set(milkData.map(record => record.date)).size || 1);
  
  // Calculate cow statistics
  const cowStats = {};
  milkData.forEach(record => {
    const cowId = record.cow_id;
    if (!cowId) return; // Skip if no cow ID
    
    if (!cowStats[cowId]) {
      cowStats[cowId] = {
        id: cowId,
        name: record.cowName || 'Unknown', // Use already extracted cow name
        tagNumber: record.cowTag || 'Unknown', // Use already extracted cow tag
        totalAmount: 0,
        collectionDays: new Set(),
        collectionCount: 0
      };
    }
    
    cowStats[cowId].totalAmount += parseFloat(record.amount || 0);
    cowStats[cowId].collectionDays.add(record.date);
    cowStats[cowId].collectionCount++;
  });
  
  console.log("Total unique cows found:", Object.keys(cowStats).length);
  if (Object.keys(cowStats).length > 0) {
    console.log("Sample cow data:", Object.values(cowStats)[0]);
  }
  
  Object.values(cowStats).forEach(cow => {
    cow.avgPerCollection = cow.totalAmount / cow.collectionCount;
    cow.avgPerDay = cow.totalAmount / cow.collectionDays.size;
    cow.collectionDays = cow.collectionDays.size; // Convert Set to count
  });
  
  return {
    monthStart: milkData.length > 0 ? milkData.sort((a, b) => new Date(a.date) - new Date(b.date))[0].date : null,
    monthEnd: milkData.length > 0 ? milkData.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
    totalMilk: totalMonth,
    averageDailyMilk: dailyAvg,
    weeklyBreakdown: Object.values(weeks)
      .sort((a, b) => a.year === b.year ? a.week - b.week : a.year - b.year),
    cowPerformance: Object.values(cowStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
  };
}

function processQualityReportData(milkData, qualityData) {
  // Calculate quality averages
  const totalFat = qualityData.reduce((sum, record) => sum + record.fat, 0);
  const totalProtein = qualityData.reduce((sum, record) => sum + record.protein, 0);
  const totalLactose = qualityData.reduce((sum, record) => sum + record.lactose, 0);
  const totalSomatic = qualityData.reduce((sum, record) => sum + record.somatic, 0);
  const totalBacteria = qualityData.reduce((sum, record) => sum + record.bacteria, 0);
  
  const count = qualityData.length || 1;
  
  const qualityAverages = {
    fat: totalFat / count,
    protein: totalProtein / count,
    lactose: totalLactose / count,
    somatic: totalSomatic / count,
    bacteria: totalBacteria / count
  };
  
  // Group quality data by day to see trends
  const dailyQuality = {};
  qualityData.forEach(record => {
    const date = record.date;
    
    if (!dailyQuality[date]) {
      dailyQuality[date] = {
        date,
        samples: 0,
        fatTotal: 0,
        proteinTotal: 0,
        lactoseTotal: 0,
        somaticTotal: 0,
        bacteriaTotal: 0
      };
    }
    
    dailyQuality[date].samples++;
    dailyQuality[date].fatTotal += record.fat;
    dailyQuality[date].proteinTotal += record.protein;
    dailyQuality[date].lactoseTotal += record.lactose;
    dailyQuality[date].somaticTotal += record.somatic;
    dailyQuality[date].bacteriaTotal += record.bacteria;
  });
  
  // Calculate daily averages
  Object.values(dailyQuality).forEach(day => {
    day.fatAvg = day.fatTotal / day.samples;
    day.proteinAvg = day.proteinTotal / day.samples;
    day.lactoseAvg = day.lactoseTotal / day.samples;
    day.somaticAvg = day.somaticTotal / day.samples;
    day.bacteriaAvg = day.bacteriaTotal / day.samples;
    
    // Remove the totals to clean up the data
    delete day.fatTotal;
    delete day.proteinTotal;
    delete day.lactoseTotal;
    delete day.somaticTotal;
    delete day.bacteriaTotal;
  });
  
  // Quality standards (for comparison)
  const standards = {
    fat: { min: 3.5, target: 3.8, max: 4.2 },
    protein: { min: 3.0, target: 3.3, max: 3.6 },
    lactose: { min: 4.5, target: 4.8, max: 5.0 },
    somatic: { max: 200 },
    bacteria: { max: 20000 }
  };
  
  // Calculate compliance percentages
  const complianceCount = {
    fat: qualityData.filter(r => r.fat >= standards.fat.min && r.fat <= standards.fat.max).length,
    protein: qualityData.filter(r => r.protein >= standards.protein.min && r.protein <= standards.protein.max).length,
    lactose: qualityData.filter(r => r.lactose >= standards.lactose.min && r.lactose <= standards.lactose.max).length,
    somatic: qualityData.filter(r => r.somatic <= standards.somatic.max).length,
    bacteria: qualityData.filter(r => r.bacteria <= standards.bacteria.max).length
  };
  
  const compliance = {
    fat: (complianceCount.fat / count) * 100,
    protein: (complianceCount.protein / count) * 100,
    lactose: (complianceCount.lactose / count) * 100,
    somatic: (complianceCount.somatic / count) * 100,
    bacteria: (complianceCount.bacteria / count) * 100,
    overall: 
      (complianceCount.fat + complianceCount.protein + complianceCount.lactose +
       complianceCount.somatic + complianceCount.bacteria) / (count * 5) * 100
  };
  
  return {
    periodStart: qualityData.length > 0 ? qualityData.sort((a, b) => new Date(a.date) - new Date(b.date))[0].date : null,
    periodEnd: qualityData.length > 0 ? qualityData.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null,
    sampleCount: count,
    qualityAverages,
    dailyTrends: Object.values(dailyQuality)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    compliance,
    standards
  };
}

function processComplianceReportData(milkData, qualityData) {
  // Start with the quality report data
  const qualityReport = processQualityReportData(milkData, qualityData);
  
  // Add additional compliance-specific data
  const qualityStandards = {
    fat: { min: 3.5, target: 3.8, max: 4.2 },
    protein: { min: 3.0, target: 3.3, max: 3.6 },
    lactose: { min: 4.5, target: 4.8, max: 5.0 },
    somatic: { max: 200 },
    bacteria: { max: 20000 }
  };
  
  // Identify quality violations
  const violations = qualityData.filter(record => {
    return (
      record.fat < qualityStandards.fat.min || 
      record.fat > qualityStandards.fat.max ||
      record.protein < qualityStandards.protein.min || 
      record.protein > qualityStandards.protein.max ||
      record.lactose < qualityStandards.lactose.min || 
      record.lactose > qualityStandards.lactose.max ||
      record.somatic > qualityStandards.somatic.max ||
      record.bacteria > qualityStandards.bacteria.max
    );
  }).map(record => {
    const violations = [];
    
    if (record.fat < qualityStandards.fat.min) {
      violations.push(`Fat content too low: ${record.fat.toFixed(1)}% (min: ${qualityStandards.fat.min}%)`);
    } else if (record.fat > qualityStandards.fat.max) {
      violations.push(`Fat content too high: ${record.fat.toFixed(1)}% (max: ${qualityStandards.fat.max}%)`);
    }
    
    if (record.protein < qualityStandards.protein.min) {
      violations.push(`Protein content too low: ${record.protein.toFixed(1)}% (min: ${qualityStandards.protein.min}%)`);
    } else if (record.protein > qualityStandards.protein.max) {
      violations.push(`Protein content too high: ${record.protein.toFixed(1)}% (max: ${qualityStandards.protein.max}%)`);
    }
    
    if (record.lactose < qualityStandards.lactose.min) {
      violations.push(`Lactose content too low: ${record.lactose.toFixed(1)}% (min: ${qualityStandards.lactose.min}%)`);
    } else if (record.lactose > qualityStandards.lactose.max) {
      violations.push(`Lactose content too high: ${record.lactose.toFixed(1)}% (max: ${qualityStandards.lactose.max}%)`);
    }
    
    if (record.somatic > qualityStandards.somatic.max) {
      violations.push(`Somatic cell count too high: ${record.somatic} (max: ${qualityStandards.somatic.max})`);
    }
    
    if (record.bacteria > qualityStandards.bacteria.max) {
      violations.push(`Bacteria count too high: ${record.bacteria} (max: ${qualityStandards.bacteria.max})`);
    }
    
    return {
      date: record.date,
      violationCount: violations.length,
      violations
    };
  });
  
  // Calculate compliance metrics
  const complianceData = {
    totalSamples: qualityData.length,
    compliantSamples: qualityData.length - violations.length,
    complianceRate: ((qualityData.length - violations.length) / qualityData.length) * 100,
    violationCount: violations.length,
    violations: violations.sort((a, b) => b.violationCount - a.violationCount),
    averageViolationsPerSample: violations.reduce((sum, v) => sum + v.violationCount, 0) / violations.length || 0
  };
  
  return {
    ...qualityReport,
    compliance: {
      ...qualityReport.compliance,
      ...complianceData
    }
  };
}

// Create the actual report file (PDF, XLSX, CSV)
async function createReportFile(reportType, format, data, reportId) {
  try {
    let fileData, fileSize, filePath;
    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}-${reportId}`;
    
    switch (format.toLowerCase()) {
      case 'pdf':
        fileData = createPdfReport(reportType, data);
        fileSize = `${Math.round(fileData.length / 1024)} KB`;
        filePath = `/reports/${filename}.pdf`;
        break;
        
      case 'excel':
      case 'xlsx':
        fileData = createExcelReport(reportType, data);
        fileSize = `${Math.round(fileData.length / 1024)} KB`;
        filePath = `/reports/${filename}.xlsx`;
        break;
        
      case 'csv':
        fileData = createCsvReport(reportType, data);
        fileSize = `${Math.round(fileData.length / 1024)} KB`;
        filePath = `/reports/${filename}.csv`;
        break;
        
      default:
        throw new Error('Unsupported report format');
    }
    
    return { fileData, fileSize, filePath };
  } catch (error) {
    console.error('Error creating report file:', error);
    throw error;
  }
}

// Generate PDF report
function createPdfReport(reportType, data) {
  // Create PDF document
  const doc = new jsPDF();
  
  // Format date strings consistently for display
  const formatDateStr = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Add title and info
  let title;
  switch (reportType) {
    case 'daily':
      title = `Daily Production Report - ${formatDateStr(data.date)}`;
      break;
    case 'weekly':
      title = `Weekly Summary Report - ${formatDateStr(data.weekStart)} to ${formatDateStr(data.weekEnd)}`;
      break;
    case 'monthly':
      title = `Monthly Analysis Report - ${formatDateStr(data.monthStart)} to ${formatDateStr(data.monthEnd)}`;
      break;
    case 'quality':
      title = `Quality Metrics Report - ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`;
      break;
    case 'compliance':
      title = `Compliance Report - ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`;
      break;
    default:
      title = `Milk Production Report`;
  }
  
  // Set title
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  doc.text('Generated: ' + new Date().toLocaleDateString(), 20, 30);
  doc.line(20, 35, 190, 35);
  
  // Add content based on report type
  let y = 45; // Start position for content
  
  switch (reportType) {
    case 'daily':
      // Daily summary
      doc.setFontSize(16);
      doc.text('Summary', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Date: ${formatDateStr(data.date)}`, 20, y); y += 8;
      doc.text(`Total Milk Production: ${data.totalMilk.toFixed(1)} L`, 20, y); y += 8;
      doc.text(`Morning Production: ${data.morningMilk.toFixed(1)} L`, 20, y); y += 8;
      doc.text(`Evening Production: ${data.eveningMilk.toFixed(1)} L`, 20, y); y += 8;
      doc.text(`Number of Cows: ${data.numberOfCows}`, 20, y); y += 15;
      
      // Top producers
      doc.setFontSize(16);
      doc.text('Top Producers', 20, y);
      y += 10;
      
      const topProducersData = data.topProducers.map(cow => [
        cow.name,
        cow.tagNumber,
        `${cow.totalAmount.toFixed(1)} L`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Cow Name', 'Tag Number', 'Total Production']],
        body: topProducersData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Collections - ENSURE DATE COLUMN IS INCLUDED
      doc.setFontSize(16);
      doc.text('Collection Records', 20, y);
      y += 10;
      
      const collectionsData = data.collections.map(c => [
        formatDateStr(c.date), // Include formatted date
        c.shift,
        c.cowName,
        c.cowTag,
        `${c.amount.toFixed(1)} L`,
        c.quality
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Shift', 'Cow', 'Tag', 'Amount', 'Quality']],  // Include Date in header
        body: collectionsData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
    
    case 'weekly':
      // Add week summary content
      doc.setFontSize(16);
      doc.text('Weekly Summary', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Period: ${formatDateStr(data.weekStart)} to ${formatDateStr(data.weekEnd)}`, 20, y); y += 8;
      doc.text(`Total Weekly Production: ${data.totalMilk.toFixed(1)} L`, 20, y); y += 8;
      doc.text(`Average Daily Production: ${data.averageDailyMilk.toFixed(1)} L`, 20, y); y += 15;
      
      // Daily breakdown
      doc.setFontSize(16);
      doc.text('Daily Breakdown', 20, y);
      y += 10;
      
      const dailyData = data.dailyBreakdown.map(day => [
        formatDateStr(day.date), // Ensure date is formatted properly
        `${day.morningAmount.toFixed(1)} L`,
        `${day.eveningAmount.toFixed(1)} L`,
        `${day.totalAmount.toFixed(1)} L`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Morning', 'Evening', 'Total']],  // Include Date in header
        body: dailyData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Top producers
      doc.setFontSize(16);
      doc.text('Top Producers', 20, y);
      y += 10;
      
      const weeklyTopProducers = data.topProducers.map(cow => [
        cow.name,
        cow.tagNumber,
        `${cow.totalAmount.toFixed(1)} L`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Cow Name', 'Tag Number', 'Total Production']],
        body: weeklyTopProducers,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
      
    case 'monthly':
      // Monthly report implementation
      doc.setFontSize(16);
      doc.text('Monthly Production Analysis', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Period: ${formatDateStr(data.monthStart)} to ${formatDateStr(data.monthEnd)}`, 20, y); y += 8;
      doc.text(`Total Monthly Production: ${data.totalMilk.toFixed(1)} L`, 20, y); y += 8;
      doc.text(`Average Daily Production: ${data.averageDailyMilk.toFixed(1)} L`, 20, y); y += 15;
      
      // Weekly breakdown
      doc.setFontSize(16);
      doc.text('Weekly Breakdown', 20, y);
      y += 10;
      
      const weeklyData = data.weeklyBreakdown.map(week => [
        `Week ${week.week} (${week.year})`,
        formatDateStr(week.startDate),
        formatDateStr(week.endDate),
        `${week.totalAmount.toFixed(1)} L`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Week', 'Start Date', 'End Date', 'Total Production']],
        body: weeklyData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Top performing cows
      doc.setFontSize(16);
      doc.text('Top Performing Cows', 20, y);
      y += 10;
      
      const topCows = data.cowPerformance.slice(0, 10).map(cow => [
        cow.name,
        cow.tagNumber,
        `${cow.totalAmount.toFixed(1)} L`,
        `${cow.avgPerDay.toFixed(1)} L`,
        cow.collectionDays
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Cow Name', 'Tag Number', 'Total Production', 'Avg Per Day', 'Days Collected']],
        body: topCows,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
    
    case 'quality':
      // Quality report implementation
      doc.setFontSize(16);
      doc.text('Milk Quality Analysis', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Period: ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`, 20, y); y += 8;
      doc.text(`Total Samples: ${data.sampleCount}`, 20, y); y += 15;
      
      // Quality averages
      doc.setFontSize(16);
      doc.text('Quality Parameter Averages', 20, y);
      y += 10;
      
      const qualityData = [
        ['Fat Content', `${data.qualityAverages.fat.toFixed(2)}%`, `${data.standards.fat.min}% - ${data.standards.fat.max}%`, `${data.compliance.fat.toFixed(1)}%`],
        ['Protein Content', `${data.qualityAverages.protein.toFixed(2)}%`, `${data.standards.protein.min}% - ${data.standards.protein.max}%`, `${data.compliance.protein.toFixed(1)}%`],
        ['Lactose Content', `${data.qualityAverages.lactose.toFixed(2)}%`, `${data.standards.lactose.min}% - ${data.standards.lactose.max}%`, `${data.compliance.lactose.toFixed(1)}%`],
        ['Somatic Cell Count', `${data.qualityAverages.somatic.toFixed(0)}`, `< ${data.standards.somatic.max}`, `${data.compliance.somatic.toFixed(1)}%`],
        ['Bacteria Count', `${data.qualityAverages.bacteria.toFixed(0)}`, `< ${data.standards.bacteria.max}`, `${data.compliance.bacteria.toFixed(1)}%`],
        ['Overall Compliance', '', '', `${data.compliance.overall.toFixed(1)}%`]
      ];
      
      autoTable(doc, {
        startY: y,
        head: [['Parameter', 'Average', 'Standard Range', 'Compliance Rate']],
        body: qualityData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Daily trends
      doc.setFontSize(16);
      doc.text('Daily Quality Trends', 20, y);
      y += 10;
      
      // Show only first 10 days to avoid overcrowding
      const trendsData = data.dailyTrends.slice(0, 10).map(day => [
        formatDateStr(day.date),
        `${day.fatAvg.toFixed(2)}%`,
        `${day.proteinAvg.toFixed(2)}%`,
        `${day.lactoseAvg.toFixed(2)}%`,
        day.somaticAvg.toFixed(0),
        day.bacteriaAvg.toFixed(0)
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Fat %', 'Protein %', 'Lactose %', 'SCC', 'Bacteria']],
        body: trendsData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
      
    case 'compliance':
      // Compliance report implementation
      doc.setFontSize(16);
      doc.text('Milk Quality Compliance Report', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Period: ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`, 20, y); y += 8;
      doc.text(`Total Samples: ${data.compliance.totalSamples}`, 20, y); y += 8;
      doc.text(`Compliant Samples: ${data.compliance.compliantSamples} (${data.compliance.complianceRate.toFixed(1)}%)`, 20, y); y += 8;
      doc.text(`Non-Compliant Samples: ${data.compliance.violationCount}`, 20, y); y += 15;
      
      // Compliance summary
      doc.setFontSize(16);
      doc.text('Compliance by Parameter', 20, y);
      y += 10;
      
      const complianceData = [
        ['Fat Content', `${data.compliance.fat.toFixed(1)}%`],
        ['Protein Content', `${data.compliance.protein.toFixed(1)}%`],
        ['Lactose Content', `${data.compliance.lactose.toFixed(1)}%`],
        ['Somatic Cell Count', `${data.compliance.somatic.toFixed(1)}%`],
        ['Bacteria Count', `${data.compliance.bacteria.toFixed(1)}%`],
        ['Overall', `${data.compliance.overall.toFixed(1)}%`]
      ];
      
      autoTable(doc, {
        startY: y,
        head: [['Parameter', 'Compliance Rate']],
        body: complianceData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Top violations
      if (data.compliance.violations && data.compliance.violations.length > 0) {
        doc.setFontSize(16);
        doc.text('Compliance Violations', 20, y);
        y += 10;
        
        const violationsData = data.compliance.violations.slice(0, 10).map(v => [
          formatDateStr(v.date),
          v.violationCount,
          v.violations.join("; ")
        ]);
        
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Violations', 'Details']],
          body: violationsData,
          theme: 'striped',
          headStyles: { fillColor: [76, 175, 80] }
        });
      }
      break;

    default:
      doc.setFontSize(16);
      doc.text('Report Data', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`This is a ${reportType} report.`, 20, y);
      break;
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} - Generated by Dairy Farm Management System`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc.output('arraybuffer');
}

// Generate Excel report
function createExcelReport(reportType, data) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add data based on report type
  switch (reportType) {
    case 'daily': {
      // Summary sheet
      const summaryData = [
        ['Date', new Date(data.date).toLocaleDateString()],
        ['Total Milk Production', data.totalMilk],
        ['Morning Production', data.morningMilk],
        ['Evening Production', data.eveningMilk],
        ['Number of Cows', data.numberOfCows]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Top Producers sheet
      const topProducersData = [
        ['Cow Name', 'Tag Number', 'Total Production (L)']
      ];
      
      data.topProducers.forEach(cow => {
        topProducersData.push([cow.name, cow.tagNumber, cow.totalAmount]);
      });
      
      const topProducersSheet = XLSX.utils.aoa_to_sheet(topProducersData);
      XLSX.utils.book_append_sheet(wb, topProducersSheet, 'Top Producers');
      
      // Collections sheet
      const collectionsData = [
        ['Shift', 'Cow Name', 'Tag Number', 'Amount (L)', 'Quality']
      ];
      
      data.collections.forEach(c => {
        collectionsData.push([c.shift, c.cowName, c.cowTag, c.amount, c.quality]);
      });
      
      const collectionsSheet = XLSX.utils.aoa_to_sheet(collectionsData);
      XLSX.utils.book_append_sheet(wb, collectionsSheet, 'Collections');
      break;
    }
    
    case 'weekly': {
      // Summary sheet
      const summaryData = [
        ['Week Period', `${new Date(data.weekStart).toLocaleDateString()} to ${new Date(data.weekEnd).toLocaleDateString()}`],
        ['Total Weekly Production', data.totalMilk],
        ['Average Daily Production', data.averageDailyMilk]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Daily breakdown sheet
      const dailyData = [
        ['Date', 'Morning (L)', 'Evening (L)', 'Total (L)']
      ];
      
      data.dailyBreakdown.forEach(day => {
        dailyData.push([
          new Date(day.date).toLocaleDateString(),
          day.morningAmount,
          day.eveningAmount,
          day.totalAmount
        ]);
      });
      
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown');
      
      // Top producers sheet
      const producersData = [
        ['Cow Name', 'Tag Number', 'Total Production (L)']
      ];
      
      data.topProducers.forEach(cow => {
        producersData.push([cow.name, cow.tagNumber, cow.totalAmount]);
      });
      
      const producersSheet = XLSX.utils.aoa_to_sheet(producersData);
      XLSX.utils.book_append_sheet(wb, producersSheet, 'Top Producers');
      break;
    }
    
    // Implement other report types similarly
    case 'monthly':
    case 'quality':
    case 'compliance':
      // For brevity, these are not fully implemented
      const demoSheet = XLSX.utils.aoa_to_sheet([
        [`${reportType} Report`],
        ['Generated', new Date().toLocaleDateString()],
        ['Sample Data', 'This would contain real data in a full implementation']
      ]);
      XLSX.utils.book_append_sheet(wb, demoSheet, 'Report Data');
      break;
  }
  
  // Convert to binary
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

// Generate CSV report
function createCsvReport(reportType, data) {
  let csvContent = '';
  
  switch (reportType) {
    case 'daily':
      // Create a simple CSV with collections data
      csvContent = 'Date,Shift,Cow Name,Cow Tag,Amount (L),Quality\n';
      
      data.collections.forEach(c => {
        csvContent += `${c.date},${c.shift},"${c.cowName}",${c.cowTag},${c.amount},${c.quality}\n`;
      });
      break;
      
    case 'weekly':
      // Daily breakdown
      csvContent = 'Date,Morning (L),Evening (L),Total (L)\n';
      
      data.dailyBreakdown.forEach(day => {
        csvContent += `${day.date},${day.morningAmount},${day.eveningAmount},${day.totalAmount}\n`;
      });
      break;
      
    // Other report types similarly
    default:
      csvContent = `${reportType} Report\nGenerated,${new Date().toISOString()}\n\nThis is a sample CSV export.\nIn a full implementation, this would contain properly formatted data.`;
  }
  
  return new TextEncoder().encode(csvContent);
}

// Delete a report
export const deleteReport = async (reportId) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// Get a report by ID
export const getReportById = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const downloadReport = (fileData, fileName, fileType) => {
  try {
    let mimeType;
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'excel':
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
    
    const blob = new Blob([fileData], { type: mimeType });
    saveAs(blob, fileName);
    
    return true;
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};