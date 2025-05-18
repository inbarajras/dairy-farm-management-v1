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
    
    // Check if this is a financial report
    const financialReports = ['incomeStatement', 'balanceSheet', 'cashFlow', 'expenseReport', 'revenueReport', 'taxReport'];
    const isFinancialReport = financialReports.includes(reportType);
    
    switch (format.toLowerCase()) {
      case 'pdf':
        if (isFinancialReport) {
          fileData = createFinancialPdfReport(reportType, data);
        } else {
          fileData = createPdfReport(reportType, data);
        }
        fileSize = `${Math.round(fileData.length / 1024)} KB`;
        filePath = `/reports/${filename}.pdf`;
        break;
        
      case 'excel':
      case 'xlsx':
        if (isFinancialReport) {
          fileData = createFinancialExcelReport(reportType, data);
        } else {
          fileData = createExcelReport(reportType, data);
        }
        fileSize = `${Math.round(fileData.length / 1024)} KB`;
        filePath = `/reports/${filename}.xlsx`;
        break;
        
      case 'csv':
        if (isFinancialReport) {
          fileData = createFinancialCsvReport(reportType, data);
        } else {
          fileData = createCsvReport(reportType, data);
        }
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

// Generate financial reports for the finance management section
export const generateFinancialReport = async (reportType, format, dateRange, startDate = null, endDate = null) => {
  try {
    // Generate a unique ID for the report
    const reportId = Math.random().toString(36).substring(2, 10);
    
    // Fetch data based on report type
    let data;
    switch (reportType) {
      case 'incomeStatement':
        data = await fetchIncomeStatementData(dateRange, startDate, endDate);
        break;
      case 'balanceSheet':
        data = await fetchBalanceSheetData();
        break;
      case 'cashFlow':
        data = await fetchCashFlowData(dateRange, startDate, endDate);
        break;
      case 'expenseReport':
        data = await fetchExpenseReportData(dateRange, startDate, endDate);
        break;
      case 'revenueReport':
        data = await fetchRevenueReportData(dateRange, startDate, endDate);
        break;
      case 'taxReport':
        data = await fetchTaxReportData(dateRange, startDate, endDate);
        break;
      default:
        throw new Error('Unsupported report type');
    }
    
    // Create the actual report file
    const reportFile = await createReportFile(reportType, format, data, reportId);
    
    // Save report metadata to database
    const reportMetadata = {
      title: `${formatReportTitle(reportType)} - ${formatDateRangeForTitle(dateRange, startDate, endDate)}`,
      report_type: reportType,
      date_range_start: startDate || getDateRangeStart(dateRange),
      date_range_end: endDate || getDateRangeEnd(dateRange),
      format: format.toLowerCase(),
      file_size: reportFile.fileSize,
      file_path: reportFile.filePath,
      created_at: new Date().toISOString(),
      status: 'completed'
    };
    
    // Save report metadata to the database
    const { data: savedReport, error } = await supabase
      .from('reports')
      .insert([reportMetadata])
      .select();
      
    if (error) throw error;
    
    return {
      ...savedReport[0],
      fileData: reportFile.fileData
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
};

// Helper function to format report title
const formatReportTitle = (reportType) => {
  switch (reportType) {
    case 'incomeStatement': return 'Income Statement';
    case 'balanceSheet': return 'Balance Sheet';
    case 'cashFlow': return 'Cash Flow Statement';
    case 'expenseReport': return 'Expense Report';
    case 'revenueReport': return 'Revenue Report';
    case 'taxReport': return 'Tax Report';
    default: return reportType;
  }
};

// Helper function to format date range for title
const formatDateRangeForTitle = (dateRange, startDate, endDate) => {
  if (startDate && endDate) {
    return `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
  }
  
  switch (dateRange) {
    case 'thisMonth': return `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`;
    case 'lastMonth': {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    case 'thisQuarter': return `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;
    case 'lastQuarter': {
      const date = new Date();
      date.setMonth(date.getMonth() - 3);
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    }
    case 'thisYear': return `${new Date().getFullYear()}`;
    case 'lastYear': return `${new Date().getFullYear() - 1}`;
    default: return dateRange;
  }
};

// Helper function to get date range start
const getDateRangeStart = (dateRange) => {
  const now = new Date();
  switch (dateRange) {
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'lastMonth':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    case 'thisQuarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1).toISOString();
    case 'lastQuarter':
      const lastQuarterStartMonth = Math.floor((now.getMonth() - 3) / 3) * 3;
      return new Date(now.getFullYear(), lastQuarterStartMonth, 1).toISOString();
    case 'thisYear':
      return new Date(now.getFullYear(), 0, 1).toISOString();
    case 'lastYear':
      return new Date(now.getFullYear() - 1, 0, 1).toISOString();
    default:
      return new Date(now.getFullYear(), now.getMonth() - 12, 1).toISOString();
  }
};

// Helper function to get date range end
const getDateRangeEnd = (dateRange) => {
  const now = new Date();
  switch (dateRange) {
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    case 'lastMonth':
      return new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    case 'thisQuarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString();
    case 'lastQuarter':
      const lastQuarterStartMonth = Math.floor((now.getMonth() - 3) / 3) * 3;
      return new Date(now.getFullYear(), lastQuarterStartMonth + 3, 0).toISOString();
    case 'thisYear':
      return new Date(now.getFullYear(), 11, 31).toISOString();
    case 'lastYear':
      return new Date(now.getFullYear() - 1, 11, 31).toISOString();
    default:
      return new Date().toISOString();
  }
};

// Data fetching functions for different report types
async function fetchIncomeStatementData(dateRange, startDate, endDate) {
  // Implement data fetching logic for income statement
  // This would typically query your database for revenue and expense data
  return { 
    title: 'Income Statement',
    period: formatDateRangeForTitle(dateRange, startDate, endDate),
    revenue: {
      milkSales: 15000,
      livestockSales: 8500,
      otherSales: 2500,
      total: 26000
    },
    expenses: {
      feedCosts: 7500,
      labor: 6000,
      veterinary: 2200,
      utilities: 1800,
      maintenance: 2500,
      other: 1500,
      total: 21500
    },
    netIncome: 4500
  };
}

async function fetchBalanceSheetData() {
  // Implement data fetching logic for balance sheet
  return { 
    title: 'Balance Sheet',
    date: new Date().toISOString(),
    assets: {
      currentAssets: {
        cash: 12500,
        accountsReceivable: 7800,
        inventory: 15600,
        total: 35900
      },
      nonCurrentAssets: {
        land: 150000,
        buildings: 120000,
        equipment: 85000,
        livestock: 95000,
        total: 450000
      },
      totalAssets: 485900
    },
    liabilities: {
      currentLiabilities: {
        accountsPayable: 8500,
        shortTermDebt: 12000,
        total: 20500
      },
      longTermLiabilities: {
        loans: 85000,
        mortgages: 120000,
        total: 205000
      },
      totalLiabilities: 225500
    },
    equity: {
      ownersEquity: 260400,
      totalEquity: 260400
    }
  };
}

async function fetchCashFlowData(dateRange, startDate, endDate) {
  // Implement data fetching logic for cash flow statement
  return { 
    title: 'Cash Flow Statement',
    period: formatDateRangeForTitle(dateRange, startDate, endDate),
    operatingActivities: {
      receipts: 28500,
      payments: -22000,
      netCashFromOperations: 6500
    },
    investingActivities: {
      assetSales: 5000,
      assetPurchases: -12000,
      netCashFromInvesting: -7000
    },
    financingActivities: {
      loanProceeds: 15000,
      loanPayments: -8500,
      netCashFromFinancing: 6500
    },
    netCashFlow: 6000,
    beginningCash: 6500,
    endingCash: 12500
  };
}

async function fetchExpenseReportData(dateRange, startDate, endDate) {
  // Implement data fetching logic for expense report
  return { 
    title: 'Expense Report',
    period: formatDateRangeForTitle(dateRange, startDate, endDate),
    expenses: [
      { category: 'Feed', amount: 7500, percentage: 35 },
      { category: 'Labor', amount: 6000, percentage: 28 },
      { category: 'Veterinary', amount: 2200, percentage: 10 },
      { category: 'Utilities', amount: 1800, percentage: 8 },
      { category: 'Maintenance', amount: 2500, percentage: 12 },
      { category: 'Other', amount: 1500, percentage: 7 }
    ],
    summary: {
      totalExpenses: 21500,
      averageMonthly: 7167,
      largestCategory: 'Feed',
      largestAmount: 7500
    }
  };
}

async function fetchRevenueReportData(dateRange, startDate, endDate) {
  // Implement data fetching logic for revenue report
  return { 
    title: 'Revenue Report',
    period: formatDateRangeForTitle(dateRange, startDate, endDate),
    revenue: [
      { source: 'Milk Sales', amount: 15000, percentage: 58 },
      { source: 'Livestock Sales', amount: 8500, percentage: 33 },
      { source: 'Other Income', amount: 2500, percentage: 9 }
    ],
    summary: {
      totalRevenue: 26000,
      averageMonthly: 8667,
      highestSource: 'Milk Sales',
      highestAmount: 15000,
      growthRate: 5.2
    }
  };
}

async function fetchTaxReportData(dateRange, startDate, endDate) {
  // Implement data fetching logic for tax report
  return { 
    title: 'Tax Report',
    period: formatDateRangeForTitle(dateRange, startDate, endDate),
    taxableIncome: {
      grossRevenue: 26000,
      allowableDeductions: 21500,
      netTaxableIncome: 4500
    },
    deductions: [
      { category: 'Feed Expenses', amount: 7500 },
      { category: 'Labor Costs', amount: 6000 },
      { category: 'Veterinary Services', amount: 2200 },
      { category: 'Utilities', amount: 1800 },
      { category: 'Maintenance', amount: 2500 },
      { category: 'Depreciation', amount: 1500 }
    ],
    taxLiability: {
      federalTax: 675,
      stateTax: 225,
      totalTaxDue: 900,
      effectiveTaxRate: 20
    }
  };
}

// Generate PDF report for financial data
function createFinancialPdfReport(reportType, data) {
  // Create PDF document
  const doc = new jsPDF();
  
  // Add title and info
  doc.setFontSize(20);
  doc.text(data.title, 20, 20);
  doc.setFontSize(12);
  doc.text('Period: ' + data.period, 20, 30);
  doc.text('Generated: ' + new Date().toLocaleDateString(), 20, 40);
  doc.line(20, 45, 190, 45);
  
  // Add content based on report type
  let y = 55; // Start position for content
  
  switch (reportType) {
    case 'incomeStatement':
      // Revenue section
      doc.setFontSize(16);
      doc.text('Revenue', 20, y);
      y += 10;
      
      const revenueData = [
        ['Milk Sales', `$${data.revenue.milkSales.toLocaleString()}`],
        ['Livestock Sales', `$${data.revenue.livestockSales.toLocaleString()}`],
        ['Other Sales', `$${data.revenue.otherSales.toLocaleString()}`],
        ['Total Revenue', `$${data.revenue.total.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        head: [['Source', 'Amount']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Expenses section
      doc.setFontSize(16);
      doc.text('Expenses', 20, y);
      y += 10;
      
      const expensesData = [
        ['Feed Costs', `$${data.expenses.feedCosts.toLocaleString()}`],
        ['Labor', `$${data.expenses.labor.toLocaleString()}`],
        ['Veterinary', `$${data.expenses.veterinary.toLocaleString()}`],
        ['Utilities', `$${data.expenses.utilities.toLocaleString()}`],
        ['Maintenance', `$${data.expenses.maintenance.toLocaleString()}`],
        ['Other', `$${data.expenses.other.toLocaleString()}`],
        ['Total Expenses', `$${data.expenses.total.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Amount']],
        body: expensesData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Net Income
      doc.setFontSize(16);
      doc.text('Net Income', 20, y);
      y += 10;
      
      const netIncomeData = [
        ['Net Income', `$${data.netIncome.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: netIncomeData,
        theme: 'grid',
        styles: { fontSize: 12, fontStyle: 'bold' }
      });
      break;
      
    case 'balanceSheet':
      // Assets section
      doc.setFontSize(16);
      doc.text('Assets', 20, y);
      y += 10;
      
      const currentAssetsData = [
        ['Current Assets', ''],
        ['Cash', `$${data.assets.currentAssets.cash.toLocaleString()}`],
        ['Accounts Receivable', `$${data.assets.currentAssets.accountsReceivable.toLocaleString()}`],
        ['Inventory', `$${data.assets.currentAssets.inventory.toLocaleString()}`],
        ['Total Current Assets', `$${data.assets.currentAssets.total.toLocaleString()}`]
      ];
      
      const nonCurrentAssetsData = [
        ['Non-Current Assets', ''],
        ['Land', `$${data.assets.nonCurrentAssets.land.toLocaleString()}`],
        ['Buildings', `$${data.assets.nonCurrentAssets.buildings.toLocaleString()}`],
        ['Equipment', `$${data.assets.nonCurrentAssets.equipment.toLocaleString()}`],
        ['Livestock', `$${data.assets.nonCurrentAssets.livestock.toLocaleString()}`],
        ['Total Non-Current Assets', `$${data.assets.nonCurrentAssets.total.toLocaleString()}`]
      ];
      
      const totalAssetsData = [
        ['Total Assets', `$${data.assets.totalAssets.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: currentAssetsData.concat(nonCurrentAssetsData).concat(totalAssetsData),
        theme: 'striped'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Liabilities section
      doc.setFontSize(16);
      doc.text('Liabilities', 20, y);
      y += 10;
      
      const liabilitiesData = [
        ['Current Liabilities', ''],
        ['Accounts Payable', `$${data.liabilities.currentLiabilities.accountsPayable.toLocaleString()}`],
        ['Short Term Debt', `$${data.liabilities.currentLiabilities.shortTermDebt.toLocaleString()}`],
        ['Total Current Liabilities', `$${data.liabilities.currentLiabilities.total.toLocaleString()}`],
        ['Long Term Liabilities', ''],
        ['Loans', `$${data.liabilities.longTermLiabilities.loans.toLocaleString()}`],
        ['Mortgages', `$${data.liabilities.longTermLiabilities.mortgages.toLocaleString()}`],
        ['Total Long Term Liabilities', `$${data.liabilities.longTermLiabilities.total.toLocaleString()}`],
        ['Total Liabilities', `$${data.liabilities.totalLiabilities.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: liabilitiesData,
        theme: 'striped'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Equity section
      doc.setFontSize(16);
      doc.text('Equity', 20, y);
      y += 10;
      
      const equityData = [
        ['Owners Equity', `$${data.equity.ownersEquity.toLocaleString()}`],
        ['Total Equity', `$${data.equity.totalEquity.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: equityData,
        theme: 'striped'
      });
      break;
      
    case 'expenseReport':
      // Expense Summary
      doc.setFontSize(16);
      doc.text('Expense Summary', 20, y);
      y += 10;
      
      const summaryData = [
        ['Total Expenses', `$${data.summary.totalExpenses.toLocaleString()}`],
        ['Average Monthly', `$${data.summary.averageMonthly.toLocaleString()}`],
        ['Largest Category', data.summary.largestCategory],
        ['Largest Amount', `$${data.summary.largestAmount.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: summaryData,
        theme: 'grid'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Expense Breakdown
      doc.setFontSize(16);
      doc.text('Expense Breakdown', 20, y);
      y += 10;
      
      const expenseBreakdown = data.expenses.map(exp => [
        exp.category,
        `$${exp.amount.toLocaleString()}`,
        `${exp.percentage}%`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Amount', 'Percentage']],
        body: expenseBreakdown,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
      
    case 'revenueReport':
      // Revenue Summary
      doc.setFontSize(16);
      doc.text('Revenue Summary', 20, y);
      y += 10;
      
      const revSummaryData = [
        ['Total Revenue', `$${data.summary.totalRevenue.toLocaleString()}`],
        ['Average Monthly', `$${data.summary.averageMonthly.toLocaleString()}`],
        ['Highest Source', data.summary.highestSource],
        ['Highest Amount', `$${data.summary.highestAmount.toLocaleString()}`],
        ['Growth Rate', `${data.summary.growthRate}%`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: revSummaryData,
        theme: 'grid'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Revenue Breakdown
      doc.setFontSize(16);
      doc.text('Revenue Breakdown', 20, y);
      y += 10;
      
      const revenueBreakdown = data.revenue.map(rev => [
        rev.source,
        `$${rev.amount.toLocaleString()}`,
        `${rev.percentage}%`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Source', 'Amount', 'Percentage']],
        body: revenueBreakdown,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
      
    case 'taxReport':
      // Taxable Income
      doc.setFontSize(16);
      doc.text('Taxable Income', 20, y);
      y += 10;
      
      const taxableIncomeData = [
        ['Gross Revenue', `$${data.taxableIncome.grossRevenue.toLocaleString()}`],
        ['Allowable Deductions', `$${data.taxableIncome.allowableDeductions.toLocaleString()}`],
        ['Net Taxable Income', `$${data.taxableIncome.netTaxableIncome.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: taxableIncomeData,
        theme: 'grid'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Deductions
      doc.setFontSize(16);
      doc.text('Deductions', 20, y);
      y += 10;
      
      const deductionsData = data.deductions.map(ded => [
        ded.category,
        `$${ded.amount.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Amount']],
        body: deductionsData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Tax Liability
      doc.setFontSize(16);
      doc.text('Tax Liability', 20, y);
      y += 10;
      
      const taxLiabilityData = [
        ['Federal Tax', `$${data.taxLiability.federalTax.toLocaleString()}`],
        ['State Tax', `$${data.taxLiability.stateTax.toLocaleString()}`],
        ['Total Tax Due', `$${data.taxLiability.totalTaxDue.toLocaleString()}`],
        ['Effective Tax Rate', `${data.taxLiability.effectiveTaxRate}%`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: taxLiabilityData,
        theme: 'grid'
      });
      break;
      
    case 'cashFlow':
      // Operating Activities
      doc.setFontSize(16);
      doc.text('Operating Activities', 20, y);
      y += 10;
      
      const operatingData = [
        ['Receipts', `$${data.operatingActivities.receipts.toLocaleString()}`],
        ['Payments', `$${data.operatingActivities.payments.toLocaleString()}`],
        ['Net Cash from Operations', `$${data.operatingActivities.netCashFromOperations.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: operatingData,
        theme: 'striped'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Investing Activities
      doc.setFontSize(16);
      doc.text('Investing Activities', 20, y);
      y += 10;
      
      const investingData = [
        ['Asset Sales', `$${data.investingActivities.assetSales.toLocaleString()}`],
        ['Asset Purchases', `$${data.investingActivities.assetPurchases.toLocaleString()}`],
        ['Net Cash from Investing', `$${data.investingActivities.netCashFromInvesting.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: investingData,
        theme: 'striped'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Financing Activities
      doc.setFontSize(16);
      doc.text('Financing Activities', 20, y);
      y += 10;
      
      const financingData = [
        ['Loan Proceeds', `$${data.financingActivities.loanProceeds.toLocaleString()}`],
        ['Loan Payments', `$${data.financingActivities.loanPayments.toLocaleString()}`],
        ['Net Cash from Financing', `$${data.financingActivities.netCashFromFinancing.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: financingData,
        theme: 'striped'
      });
      
      y = doc.lastAutoTable.finalY + 15;
      
      // Cash Summary
      doc.setFontSize(16);
      doc.text('Cash Summary', 20, y);
      y += 10;
      
      const cashSummaryData = [
        ['Net Cash Flow', `$${data.netCashFlow.toLocaleString()}`],
        ['Beginning Cash', `$${data.beginningCash.toLocaleString()}`],
        ['Ending Cash', `$${data.endingCash.toLocaleString()}`]
      ];
      
      autoTable(doc, {
        startY: y,
        body: cashSummaryData,
        theme: 'grid',
        styles: { fontStyle: 'bold' }
      });
      break;
      
    default:
      doc.setFontSize(16);
      doc.text('Report Data', 20, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`This is a ${reportType} report.`, 20, y);
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

// Generate Excel report for financial data
function createFinancialExcelReport(reportType, data) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  switch (reportType) {
    case 'incomeStatement': {
      // Summary sheet
      const summaryData = [
        ['Income Statement'],
        ['Period', data.period],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Revenue'],
        ['Milk Sales', data.revenue.milkSales],
        ['Livestock Sales', data.revenue.livestockSales],
        ['Other Sales', data.revenue.otherSales],
        ['Total Revenue', data.revenue.total],
        [''],
        ['Expenses'],
        ['Feed Costs', data.expenses.feedCosts],
        ['Labor', data.expenses.labor],
        ['Veterinary', data.expenses.veterinary],
        ['Utilities', data.expenses.utilities],
        ['Maintenance', data.expenses.maintenance],
        ['Other', data.expenses.other],
        ['Total Expenses', data.expenses.total],
        [''],
        ['Net Income', data.netIncome]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Income Statement');
      break;
    }
    
    case 'balanceSheet': {
      // Assets sheet
      const assetsData = [
        ['Balance Sheet'],
        ['Date', new Date(data.date).toLocaleDateString()],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Assets'],
        ['Current Assets'],
        ['Cash', data.assets.currentAssets.cash],
        ['Accounts Receivable', data.assets.currentAssets.accountsReceivable],
        ['Inventory', data.assets.currentAssets.inventory],
        ['Total Current Assets', data.assets.currentAssets.total],
        [''],
        ['Non-Current Assets'],
        ['Land', data.assets.nonCurrentAssets.land],
        ['Buildings', data.assets.nonCurrentAssets.buildings],
        ['Equipment', data.assets.nonCurrentAssets.equipment],
        ['Livestock', data.assets.nonCurrentAssets.livestock],
        ['Total Non-Current Assets', data.assets.nonCurrentAssets.total],
        [''],
        ['Total Assets', data.assets.totalAssets]
      ];
      
      const assetsSheet = XLSX.utils.aoa_to_sheet(assetsData);
      XLSX.utils.book_append_sheet(wb, assetsSheet, 'Assets');
      
      // Liabilities & Equity sheet
      const liabilitiesData = [
        ['Liabilities and Equity'],
        ['Date', new Date(data.date).toLocaleDateString()],
        [''],
        ['Current Liabilities'],
        ['Accounts Payable', data.liabilities.currentLiabilities.accountsPayable],
        ['Short Term Debt', data.liabilities.currentLiabilities.shortTermDebt],
        ['Total Current Liabilities', data.liabilities.currentLiabilities.total],
        [''],
        ['Long Term Liabilities'],
        ['Loans', data.liabilities.longTermLiabilities.loans],
        ['Mortgages', data.liabilities.longTermLiabilities.mortgages],
        ['Total Long Term Liabilities', data.liabilities.longTermLiabilities.total],
        [''],
        ['Total Liabilities', data.liabilities.totalLiabilities],
        [''],
        ['Equity'],
        ['Owners Equity', data.equity.ownersEquity],
        ['Total Equity', data.equity.totalEquity]
      ];
      
      const liabilitiesSheet = XLSX.utils.aoa_to_sheet(liabilitiesData);
      XLSX.utils.book_append_sheet(wb, liabilitiesSheet, 'Liabilities & Equity');
      break;
    }
    
    case 'cashFlow': {
      // Cash Flow Statement sheet
      const cashFlowData = [
        ['Cash Flow Statement'],
        ['Period', data.period],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Operating Activities'],
        ['Receipts', data.operatingActivities.receipts],
        ['Payments', data.operatingActivities.payments],
        ['Net Cash from Operations', data.operatingActivities.netCashFromOperations],
        [''],
        ['Investing Activities'],
        ['Asset Sales', data.investingActivities.assetSales],
        ['Asset Purchases', data.investingActivities.assetPurchases],
        ['Net Cash from Investing', data.investingActivities.netCashFromInvesting],
        [''],
        ['Financing Activities'],
        ['Loan Proceeds', data.financingActivities.loanProceeds],
        ['Loan Payments', data.financingActivities.loanPayments],
        ['Net Cash from Financing', data.financingActivities.netCashFromFinancing],
        [''],
        ['Cash Summary'],
        ['Net Cash Flow', data.netCashFlow],
        ['Beginning Cash', data.beginningCash],
        ['Ending Cash', data.endingCash]
      ];
      
      const cashFlowSheet = XLSX.utils.aoa_to_sheet(cashFlowData);
      XLSX.utils.book_append_sheet(wb, cashFlowSheet, 'Cash Flow');
      break;
    }
    
    case 'expenseReport': {
      // Summary sheet
      const summaryData = [
        ['Expense Report'],
        ['Period', data.period],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Summary'],
        ['Total Expenses', data.summary.totalExpenses],
        ['Average Monthly', data.summary.averageMonthly],
        ['Largest Category', data.summary.largestCategory],
        ['Largest Amount', data.summary.largestAmount]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Expense Breakdown sheet
      const expenseHeaders = [['Category', 'Amount', 'Percentage']];
      const expenseRows = data.expenses.map(exp => [
        exp.category,
        exp.amount,
        exp.percentage
      ]);
      
      const expenseSheet = XLSX.utils.aoa_to_sheet([...expenseHeaders, ...expenseRows]);
      XLSX.utils.book_append_sheet(wb, expenseSheet, 'Expense Breakdown');
      break;
    }
    
    case 'revenueReport': {
      // Summary sheet
      const summaryData = [
        ['Revenue Report'],
        ['Period', data.period],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Summary'],
        ['Total Revenue', data.summary.totalRevenue],
        ['Average Monthly', data.summary.averageMonthly],
        ['Highest Source', data.summary.highestSource],
        ['Highest Amount', data.summary.highestAmount],
        ['Growth Rate', data.summary.growthRate + '%']
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Revenue Breakdown sheet
      const revenueHeaders = [['Source', 'Amount', 'Percentage']];
      const revenueRows = data.revenue.map(rev => [
        rev.source,
        rev.amount,
        rev.percentage
      ]);
      
      const revenueSheet = XLSX.utils.aoa_to_sheet([...revenueHeaders, ...revenueRows]);
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue Breakdown');
      break;
    }
    
    case 'taxReport': {
      // Tax Report sheet
      const taxableIncomeData = [
        ['Tax Report'],
        ['Period', data.period],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Taxable Income'],
        ['Gross Revenue', data.taxableIncome.grossRevenue],
        ['Allowable Deductions', data.taxableIncome.allowableDeductions],
        ['Net Taxable Income', data.taxableIncome.netTaxableIncome],
        [''],
        ['Tax Liability'],
        ['Federal Tax', data.taxLiability.federalTax],
        ['State Tax', data.taxLiability.stateTax],
        ['Total Tax Due', data.taxLiability.totalTaxDue],
        ['Effective Tax Rate', data.taxLiability.effectiveTaxRate + '%']
      ];
      
      const taxSheet = XLSX.utils.aoa_to_sheet(taxableIncomeData);
      XLSX.utils.book_append_sheet(wb, taxSheet, 'Tax Summary');
      
      // Deductions sheet
      const deductionHeaders = [['Category', 'Amount']];
      const deductionRows = data.deductions.map(ded => [
        ded.category,
        ded.amount
      ]);
      
      const deductionsSheet = XLSX.utils.aoa_to_sheet([...deductionHeaders, ...deductionRows]);
      XLSX.utils.book_append_sheet(wb, deductionsSheet, 'Deductions');
      break;
    }
    
    default: {
      const demoSheet = XLSX.utils.aoa_to_sheet([
        [`${reportType} Report`],
        ['Generated', new Date().toLocaleDateString()],
        ['Sample Data', 'This would contain real data in a full implementation']
      ]);
      XLSX.utils.book_append_sheet(wb, demoSheet, 'Report Data');
    }
  }
  
  // Convert to binary
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

// Generate CSV report for financial data
function createFinancialCsvReport(reportType, data) {
  let csvContent = '';
  
  switch (reportType) {
    case 'incomeStatement':
      // Income Statement CSV
      csvContent = 'Income Statement\n';
      csvContent += `Period,${data.period}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Revenue\n';
      csvContent += `Milk Sales,${data.revenue.milkSales}\n`;
      csvContent += `Livestock Sales,${data.revenue.livestockSales}\n`;
      csvContent += `Other Sales,${data.revenue.otherSales}\n`;
      csvContent += `Total Revenue,${data.revenue.total}\n\n`;
      
      csvContent += 'Expenses\n';
      csvContent += `Feed Costs,${data.expenses.feedCosts}\n`;
      csvContent += `Labor,${data.expenses.labor}\n`;
      csvContent += `Veterinary,${data.expenses.veterinary}\n`;
      csvContent += `Utilities,${data.expenses.utilities}\n`;
      csvContent += `Maintenance,${data.expenses.maintenance}\n`;
      csvContent += `Other,${data.expenses.other}\n`;
      csvContent += `Total Expenses,${data.expenses.total}\n\n`;
      
      csvContent += `Net Income,${data.netIncome}\n`;
      break;
      
    case 'balanceSheet':
      // Balance Sheet CSV
      csvContent = 'Balance Sheet\n';
      csvContent += `Date,${new Date(data.date).toLocaleDateString()}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Assets\n';
      csvContent += 'Current Assets\n';
      csvContent += `Cash,${data.assets.currentAssets.cash}\n`;
      csvContent += `Accounts Receivable,${data.assets.currentAssets.accountsReceivable}\n`;
      csvContent += `Inventory,${data.assets.currentAssets.inventory}\n`;
      csvContent += `Total Current Assets,${data.assets.currentAssets.total}\n\n`;
      
      csvContent += 'Non-Current Assets\n';
      csvContent += `Land,${data.assets.nonCurrentAssets.land}\n`;
      csvContent += `Buildings,${data.assets.nonCurrentAssets.buildings}\n`;
      csvContent += `Equipment,${data.assets.nonCurrentAssets.equipment}\n`;
      csvContent += `Livestock,${data.assets.nonCurrentAssets.livestock}\n`;
      csvContent += `Total Non-Current Assets,${data.assets.nonCurrentAssets.total}\n\n`;
      
      csvContent += `Total Assets,${data.assets.totalAssets}\n\n`;
      
      csvContent += 'Liabilities\n';
      csvContent += 'Current Liabilities\n';
      csvContent += `Accounts Payable,${data.liabilities.currentLiabilities.accountsPayable}\n`;
      csvContent += `Short Term Debt,${data.liabilities.currentLiabilities.shortTermDebt}\n`;
      csvContent += `Total Current Liabilities,${data.liabilities.currentLiabilities.total}\n\n`;
      
      csvContent += 'Long Term Liabilities\n';
      csvContent += `Loans,${data.liabilities.longTermLiabilities.loans}\n`;
      csvContent += `Mortgages,${data.liabilities.longTermLiabilities.mortgages}\n`;
      csvContent += `Total Long Term Liabilities,${data.liabilities.longTermLiabilities.total}\n\n`;
      
      csvContent += `Total Liabilities,${data.liabilities.totalLiabilities}\n\n`;
      
      csvContent += 'Equity\n';
      csvContent += `Owners Equity,${data.equity.ownersEquity}\n`;
      csvContent += `Total Equity,${data.equity.totalEquity}\n`;
      break;
      
    case 'cashFlow':
      // Cash Flow Statement CSV
      csvContent = 'Cash Flow Statement\n';
      csvContent += `Period,${data.period}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Operating Activities\n';
      csvContent += `Receipts,${data.operatingActivities.receipts}\n`;
      csvContent += `Payments,${data.operatingActivities.payments}\n`;
      csvContent += `Net Cash from Operations,${data.operatingActivities.netCashFromOperations}\n\n`;
      
      csvContent += 'Investing Activities\n';
      csvContent += `Asset Sales,${data.investingActivities.assetSales}\n`;
      csvContent += `Asset Purchases,${data.investingActivities.assetPurchases}\n`;
      csvContent += `Net Cash from Investing,${data.investingActivities.netCashFromInvesting}\n\n`;
      
      csvContent += 'Financing Activities\n';
      csvContent += `Loan Proceeds,${data.financingActivities.loanProceeds}\n`;
      csvContent += `Loan Payments,${data.financingActivities.loanPayments}\n`;
      csvContent += `Net Cash from Financing,${data.financingActivities.netCashFromFinancing}\n\n`;
      
      csvContent += 'Cash Summary\n';
      csvContent += `Net Cash Flow,${data.netCashFlow}\n`;
      csvContent += `Beginning Cash,${data.beginningCash}\n`;
      csvContent += `Ending Cash,${data.endingCash}\n`;
      break;
      
    case 'expenseReport':
      // Expense Report CSV
      csvContent = 'Expense Report\n';
      csvContent += `Period,${data.period}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Expenses,${data.summary.totalExpenses}\n`;
      csvContent += `Average Monthly,${data.summary.averageMonthly}\n`;
      csvContent += `Largest Category,${data.summary.largestCategory}\n`;
      csvContent += `Largest Amount,${data.summary.largestAmount}\n\n`;
      
      csvContent += 'Expense Breakdown\n';
      csvContent += 'Category,Amount,Percentage\n';
      
      data.expenses.forEach(exp => {
        csvContent += `${exp.category},${exp.amount},${exp.percentage}\n`;
      });
      break;
      
    case 'revenueReport':
      // Revenue Report CSV
      csvContent = 'Revenue Report\n';
      csvContent += `Period,${data.period}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Revenue,${data.summary.totalRevenue}\n`;
      csvContent += `Average Monthly,${data.summary.averageMonthly}\n`;
      csvContent += `Highest Source,${data.summary.highestSource}\n`;
      csvContent += `Highest Amount,${data.summary.highestAmount}\n`;
      csvContent += `Growth Rate,${data.summary.growthRate}%\n\n`;
      
      csvContent += 'Revenue Breakdown\n';
      csvContent += 'Source,Amount,Percentage\n';
      
      data.revenue.forEach(rev => {
        csvContent += `${rev.source},${rev.amount},${rev.percentage}\n`;
      });
      break;
      
    case 'taxReport':
      // Tax Report CSV
      csvContent = 'Tax Report\n';
      csvContent += `Period,${data.period}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Taxable Income\n';
      csvContent += `Gross Revenue,${data.taxableIncome.grossRevenue}\n`;
      csvContent += `Allowable Deductions,${data.taxableIncome.allowableDeductions}\n`;
      csvContent += `Net Taxable Income,${data.taxableIncome.netTaxableIncome}\n\n`;
      
      csvContent += 'Tax Liability\n';
      csvContent += `Federal Tax,${data.taxLiability.federalTax}\n`;
      csvContent += `State Tax,${data.taxLiability.stateTax}\n`;
      csvContent += `Total Tax Due,${data.taxLiability.totalTaxDue}\n`;
      csvContent += `Effective Tax Rate,${data.taxLiability.effectiveTaxRate}%\n\n`;
      
      csvContent += 'Deductions\n';
      csvContent += 'Category,Amount\n';
      
      data.deductions.forEach(ded => {
        csvContent += `${ded.category},${ded.amount}\n`;
      });
      break;
      
    default:
      csvContent = `${reportType} Report\nGenerated,${new Date().toISOString()}\n\nSample financial data for ${reportType}`;
  }
  
  return new TextEncoder().encode(csvContent);
}

// Generate PDF report for milk production data
function createPdfReport(reportType, data) {
  // Create PDF document
  const doc = new jsPDF();
  
  // Add title
  let title = '';
  switch (reportType) {
    case 'daily':
      title = `Daily Production Report - ${formatDateStr(data.date)}`;
      break;
    case 'weekly':
      title = `Weekly Production Report - ${formatDateStr(data.weekStart)} to ${formatDateStr(data.weekEnd)}`;
      break;
    case 'monthly':
      title = `Monthly Production Report - ${formatDateStr(data.monthStart)} to ${formatDateStr(data.monthEnd)}`;
      break;
    case 'quality':
      title = `Milk Quality Report - ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`;
      break;
    case 'compliance':
      title = `Compliance Report - ${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`;
      break;
    default:
      title = `Milk Production Report - ${new Date().toLocaleDateString()}`;
  }
  
  // Add title and info
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
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
      
      // Collections
      doc.setFontSize(16);
      doc.text('Collection Records', 20, y);
      y += 10;
      
      const collectionsData = data.collections.map(c => [
        formatDateStr(c.date),
        c.shift,
        c.cowName,
        c.cowTag,
        `${c.amount.toFixed(1)} L`,
        c.quality
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Shift', 'Cow', 'Tag', 'Amount', 'Quality']],
        body: collectionsData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] }
      });
      break;
    
    case 'weekly':
      // Weekly summary
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
        formatDateStr(day.date),
        `${day.morningAmount.toFixed(1)} L`,
        `${day.eveningAmount.toFixed(1)} L`,
        `${day.totalAmount.toFixed(1)} L`
      ]);
      
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Morning', 'Evening', 'Total']],
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
      // Monthly report
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
      // Quality report
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
      // Compliance report
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

// Create Excel report for milk production data
function createExcelReport(reportType, data) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  switch (reportType) {
    case 'daily': {
      // Summary sheet
      const summaryData = [
        ['Daily Production Report'],
        ['Date', formatDateStr(data.date)],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Total Milk Production', data.totalMilk],
        ['Morning Production', data.morningMilk],
        ['Evening Production', data.eveningMilk],
        ['Number of Cows', data.numberOfCows]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Top producers sheet
      const topHeaders = [['Cow Name', 'Tag Number', 'Total Production (L)']];
      const topRows = data.topProducers.map(cow => [
        cow.name,
        cow.tagNumber,
        cow.totalAmount
      ]);
      
      const topSheet = XLSX.utils.aoa_to_sheet([...topHeaders, ...topRows]);
      XLSX.utils.book_append_sheet(wb, topSheet, 'Top Producers');
      
      // Collections sheet
      const collectionHeaders = [['Date', 'Shift', 'Cow', 'Tag', 'Amount (L)', 'Quality']];
      const collectionRows = data.collections.map(c => [
        formatDateStr(c.date),
        c.shift,
        c.cowName,
        c.cowTag,
        c.amount,
        c.quality
      ]);
      
      const collectionsSheet = XLSX.utils.aoa_to_sheet([...collectionHeaders, ...collectionRows]);
      XLSX.utils.book_append_sheet(wb, collectionsSheet, 'Collections');
      break;
    }
    
    case 'weekly': {
      // Summary sheet
      const summaryData = [
        ['Weekly Production Report'],
        ['Period', `${formatDateStr(data.weekStart)} to ${formatDateStr(data.weekEnd)}`],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Total Weekly Production', data.totalMilk],
        ['Average Daily Production', data.averageDailyMilk]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Daily breakdown
      const dailyHeaders = [['Date', 'Morning (L)', 'Evening (L)', 'Total (L)']];
      const dailyRows = data.dailyBreakdown.map(day => [
        formatDateStr(day.date),
        day.morningAmount,
        day.eveningAmount,
        day.totalAmount
      ]);
      
      const dailySheet = XLSX.utils.aoa_to_sheet([...dailyHeaders, ...dailyRows]);
      XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Breakdown');
      
      // Top producers
      const topHeaders = [['Cow Name', 'Tag Number', 'Total Production (L)']];
      const topRows = data.topProducers.map(cow => [
        cow.name,
        cow.tagNumber,
        cow.totalAmount
      ]);
      
      const topSheet = XLSX.utils.aoa_to_sheet([...topHeaders, ...topRows]);
      XLSX.utils.book_append_sheet(wb, topSheet, 'Top Producers');
      break;
    }
    
    case 'monthly': {
      // Summary sheet
      const summaryData = [
        ['Monthly Production Report'],
        ['Period', `${formatDateStr(data.monthStart)} to ${formatDateStr(data.monthEnd)}`],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Total Monthly Production', data.totalMilk],
        ['Average Daily Production', data.averageDailyMilk]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Weekly breakdown
      const weeklyHeaders = [['Week', 'Start Date', 'End Date', 'Total Production (L)']];
      const weeklyRows = data.weeklyBreakdown.map(week => [
        `Week ${week.week} (${week.year})`,
        formatDateStr(week.startDate),
        formatDateStr(week.endDate),
        week.totalAmount
      ]);
      
      const weeklySheet = XLSX.utils.aoa_to_sheet([...weeklyHeaders, ...weeklyRows]);
      XLSX.utils.book_append_sheet(wb, weeklySheet, 'Weekly Breakdown');
      
      // Cow performance
      const cowHeaders = [['Cow Name', 'Tag Number', 'Total (L)', 'Avg Per Day (L)', 'Days Collected']];
      const cowRows = data.cowPerformance.map(cow => [
        cow.name,
        cow.tagNumber,
        cow.totalAmount,
        cow.avgPerDay,
        cow.collectionDays
      ]);
      
      const cowSheet = XLSX.utils.aoa_to_sheet([...cowHeaders, ...cowRows]);
      XLSX.utils.book_append_sheet(wb, cowSheet, 'Cow Performance');
      break;
    }
    
    case 'quality': {
      // Summary sheet
      const summaryData = [
        ['Milk Quality Report'],
        ['Period', `${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Total Samples', data.sampleCount],
        ['Overall Compliance', `${data.compliance.overall.toFixed(1)}%`]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Quality parameters
      const qualityHeaders = [['Parameter', 'Average', 'Standard Min', 'Standard Max', 'Compliance Rate']];
      const qualityRows = [
        ['Fat Content', data.qualityAverages.fat, data.standards.fat.min, data.standards.fat.max, data.compliance.fat],
        ['Protein Content', data.qualityAverages.protein, data.standards.protein.min, data.standards.protein.max, data.compliance.protein],
        ['Lactose Content', data.qualityAverages.lactose, data.standards.lactose.min, data.standards.lactose.max, data.compliance.lactose],
        ['Somatic Cell Count', data.qualityAverages.somatic, 0, data.standards.somatic.max, data.compliance.somatic],
        ['Bacteria Count', data.qualityAverages.bacteria, 0, data.standards.bacteria.max, data.compliance.bacteria]
      ];
      
      const qualitySheet = XLSX.utils.aoa_to_sheet([...qualityHeaders, ...qualityRows]);
      XLSX.utils.book_append_sheet(wb, qualitySheet, 'Quality Parameters');
      
      // Daily trends
      const trendsHeaders = [['Date', 'Fat %', 'Protein %', 'Lactose %', 'SCC', 'Bacteria']];
      const trendsRows = data.dailyTrends.map(day => [
        formatDateStr(day.date),
        day.fatAvg,
        day.proteinAvg,
        day.lactoseAvg,
        day.somaticAvg,
        day.bacteriaAvg
      ]);
      
      const trendsSheet = XLSX.utils.aoa_to_sheet([...trendsHeaders, ...trendsRows]);
      XLSX.utils.book_append_sheet(wb, trendsSheet, 'Daily Trends');
      break;
    }
    
    case 'compliance': {
      // Summary sheet
      const summaryData = [
        ['Compliance Report'],
        ['Period', `${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}`],
        ['Generated', new Date().toLocaleDateString()],
        [''],
        ['Total Samples', data.compliance.totalSamples],
        ['Compliant Samples', data.compliance.compliantSamples],
        ['Compliance Rate', `${data.compliance.complianceRate.toFixed(1)}%`],
        ['Non-Compliant Samples', data.compliance.violationCount]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Compliance by parameter
      const complianceHeaders = [['Parameter', 'Compliance Rate']];
      const complianceRows = [
        ['Fat Content', `${data.compliance.fat.toFixed(1)}%`],
        ['Protein Content', `${data.compliance.protein.toFixed(1)}%`],
        ['Lactose Content', `${data.compliance.lactose.toFixed(1)}%`],
        ['Somatic Cell Count', `${data.compliance.somatic.toFixed(1)}%`],
        ['Bacteria Count', `${data.compliance.bacteria.toFixed(1)}%`],
        ['Overall', `${data.compliance.overall.toFixed(1)}%`]
      ];
      
      const complianceSheet = XLSX.utils.aoa_to_sheet([...complianceHeaders, ...complianceRows]);
      XLSX.utils.book_append_sheet(wb, complianceSheet, 'Compliance Rates');
      
      // Violations
      if (data.compliance.violations && data.compliance.violations.length > 0) {
        const violationsHeaders = [['Date', 'Number of Violations', 'Details']];
        const violationsRows = data.compliance.violations.map(v => [
          formatDateStr(v.date),
          v.violationCount,
          v.violations.join("; ")
        ]);
        
        const violationsSheet = XLSX.utils.aoa_to_sheet([...violationsHeaders, ...violationsRows]);
        XLSX.utils.book_append_sheet(wb, violationsSheet, 'Violations');
      }
      break;
    }
    
    default: {
      const demoSheet = XLSX.utils.aoa_to_sheet([
        [`${reportType} Report`],
        ['Generated', new Date().toLocaleDateString()],
        ['Sample Data', 'This would contain real data in a full implementation']
      ]);
      XLSX.utils.book_append_sheet(wb, demoSheet, 'Report Data');
    }
  }
  
  // Convert to binary
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

// Generate CSV report for milk production data
function createCsvReport(reportType, data) {
  let csvContent = '';
  
  switch (reportType) {
    case 'daily':
      // Daily Report CSV
      csvContent = 'Daily Production Report\n';
      csvContent += `Date,${formatDateStr(data.date)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Milk Production,${data.totalMilk}\n`;
      csvContent += `Morning Production,${data.morningMilk}\n`;
      csvContent += `Evening Production,${data.eveningMilk}\n`;
      csvContent += `Number of Cows,${data.numberOfCows}\n\n`;
      
      csvContent += 'Top Producers\n';
      csvContent += 'Cow Name,Tag Number,Total Production (L)\n';
      
      data.topProducers.forEach(cow => {
        csvContent += `${cow.name},${cow.tagNumber},${cow.totalAmount}\n`;
      });
      
      csvContent += '\nCollection Records\n';
      csvContent += 'Date,Shift,Cow,Tag,Amount (L),Quality\n';
      
      data.collections.forEach(c => {
        csvContent += `${formatDateStr(c.date)},${c.shift},${c.cowName},${c.cowTag},${c.amount},${c.quality}\n`;
      });
      break;
      
    case 'weekly':
      // Weekly Report CSV
      csvContent = 'Weekly Production Report\n';
      csvContent += `Period,${formatDateStr(data.weekStart)} to ${formatDateStr(data.weekEnd)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Weekly Production,${data.totalMilk}\n`;
      csvContent += `Average Daily Production,${data.averageDailyMilk}\n\n`;
      
      csvContent += 'Daily Breakdown\n';
      csvContent += 'Date,Morning (L),Evening (L),Total (L)\n';
      
      data.dailyBreakdown.forEach(day => {
        csvContent += `${formatDateStr(day.date)},${day.morningAmount},${day.eveningAmount},${day.totalAmount}\n`;
      });
      
      csvContent += '\nTop Producers\n';
      csvContent += 'Cow Name,Tag Number,Total Production (L)\n';
      
      data.topProducers.forEach(cow => {
        csvContent += `${cow.name},${cow.tagNumber},${cow.totalAmount}\n`;
      });
      break;
      
    case 'monthly':
      // Monthly Report CSV
      csvContent = 'Monthly Production Report\n';
      csvContent += `Period,${formatDateStr(data.monthStart)} to ${formatDateStr(data.monthEnd)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Monthly Production,${data.totalMilk}\n`;
      csvContent += `Average Daily Production,${data.averageDailyMilk}\n\n`;
      
      csvContent += 'Weekly Breakdown\n';
      csvContent += 'Week,Start Date,End Date,Total Production (L)\n';
      
      data.weeklyBreakdown.forEach(week => {
        csvContent += `Week ${week.week} (${week.year}),${formatDateStr(week.startDate)},${formatDateStr(week.endDate)},${week.totalAmount}\n`;
      });
      
      csvContent += '\nCow Performance\n';
      csvContent += 'Cow Name,Tag Number,Total (L),Avg Per Day (L),Days Collected\n';
      
      data.cowPerformance.forEach(cow => {
        csvContent += `${cow.name},${cow.tagNumber},${cow.totalAmount},${cow.avgPerDay},${cow.collectionDays}\n`;
      });
      break;
      
    case 'quality':
      // Quality Report CSV
      csvContent = 'Milk Quality Report\n';
      csvContent += `Period,${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Samples,${data.sampleCount}\n`;
      csvContent += `Overall Compliance,${data.compliance.overall.toFixed(1)}%\n\n`;
      
      csvContent += 'Quality Parameters\n';
      csvContent += 'Parameter,Average,Standard Min,Standard Max,Compliance Rate\n';
      csvContent += `Fat Content,${data.qualityAverages.fat},${data.standards.fat.min},${data.standards.fat.max},${data.compliance.fat}\n`;
      csvContent += `Protein Content,${data.qualityAverages.protein},${data.standards.protein.min},${data.standards.protein.max},${data.compliance.protein}\n`;
      csvContent += `Lactose Content,${data.qualityAverages.lactose},${data.standards.lactose.min},${data.standards.lactose.max},${data.compliance.lactose}\n`;
      csvContent += `Somatic Cell Count,${data.qualityAverages.somatic},0,${data.standards.somatic.max},${data.compliance.somatic}\n`;
      csvContent += `Bacteria Count,${data.qualityAverages.bacteria},0,${data.standards.bacteria.max},${data.compliance.bacteria}\n\n`;
      
      csvContent += 'Daily Trends\n';
      csvContent += 'Date,Fat %,Protein %,Lactose %,SCC,Bacteria\n';
      
      data.dailyTrends.forEach(day => {
        csvContent += `${formatDateStr(day.date)},${day.fatAvg.toFixed(2)},${day.proteinAvg.toFixed(2)},${day.lactoseAvg.toFixed(2)},${day.somaticAvg},${day.bacteriaAvg}\n`;
      });
      break;
      
    case 'compliance':
      // Compliance Report CSV
      csvContent = 'Compliance Report\n';
      csvContent += `Period,${formatDateStr(data.periodStart)} to ${formatDateStr(data.periodEnd)}\n`;
      csvContent += `Generated,${new Date().toISOString()}\n\n`;
      
      csvContent += 'Summary\n';
      csvContent += `Total Samples,${data.compliance.totalSamples}\n`;
      csvContent += `Compliant Samples,${data.compliance.compliantSamples}\n`;
      csvContent += `Compliance Rate,${data.compliance.complianceRate.toFixed(1)}%\n`;
      csvContent += `Non-Compliant Samples,${data.compliance.violationCount}\n\n`;
      
      csvContent += 'Compliance by Parameter\n';
      csvContent += 'Parameter,Compliance Rate\n';
      csvContent += `Fat Content,${data.compliance.fat.toFixed(1)}%\n`;
      csvContent += `Protein Content,${data.compliance.protein.toFixed(1)}%\n`;
      csvContent += `Lactose Content,${data.compliance.lactose.toFixed(1)}%\n`;
      csvContent += `Somatic Cell Count,${data.compliance.somatic.toFixed(1)}%\n`;
      csvContent += `Bacteria Count,${data.compliance.bacteria.toFixed(1)}%\n`;
      csvContent += `Overall,${data.compliance.overall.toFixed(1)}%\n\n`;
      
      if (data.compliance.violations && data.compliance.violations.length > 0) {
        csvContent += 'Violations\n';
        csvContent += 'Date,Number of Violations,Details\n';
        
        data.compliance.violations.forEach(v => {
          csvContent += `${formatDateStr(v.date)},${v.violationCount},"${v.violations.join('; ')}"\n`;
        });
      }
      break;
      
    default:
      csvContent = `${reportType} Report\nGenerated,${new Date().toISOString()}\n\nSample milk production data for ${reportType}`;
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

// Helper function to format date string consistently
function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}
