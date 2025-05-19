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
    
    // Make sure we return the fileData along with the report metadata
    return {
      ...savedReport[0],
      fileData: reportFile.fileData // This ensures fileData is accessible for download
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

// Helper function to convert date ranges to actual start and end dates
function getDateRangeValues(dateRange, startDate, endDate) {
  // If specific dates are provided, use those
  if (startDate && endDate) {
    return { from: startDate, to: endDate };
  }
  
  // Otherwise, determine dates based on the range
  const from = getDateRangeStart(dateRange);
  const to = getDateRangeEnd(dateRange);
  
  return { from, to };
}

// Data fetching functions for different report types
async function fetchIncomeStatementData(dateRange, startDate, endDate) {
  try {
    console.log('Fetching income statement data:', { dateRange, startDate, endDate });
    
    // Convert date range to actual dates if necessary
    const { from, to } = getDateRangeValues(dateRange, startDate, endDate);
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    console.log('Date range converted to:', { fromDate, toDate });
    
    // Fetch revenue data from the database - using month and year fields instead of date
    const revenueQuery = `and(year.eq.${fromDate.getFullYear()},month.gte.${fromDate.getMonth() + 1}),and(year.eq.${toDate.getFullYear()},month.lte.${toDate.getMonth() + 1}),year.gt.${fromDate.getFullYear()},year.lt.${toDate.getFullYear()}`
    console.log('Revenue data query for income statement:', revenueQuery);
    
    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue_data')
      .select('*')
      .or(revenueQuery);
    
    if (revenueError) {
      console.error('Error fetching revenue data for income statement:', revenueError);
      throw revenueError;
    }
    
    console.log(`Retrieved ${revenueData?.length || 0} revenue records for income statement`);
    
    // Fetch expense data from the database
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', from)
      .lte('date', to);
    
    if (expenseError) throw expenseError;
    
    // Calculate revenue by category
    const revenue = {
      milkSales: 0,
      livestockSales: 0,
      otherSales: 0,
      total: 0
    };
    
    // Process revenue data
    revenueData.forEach(item => {
      // Use income field for revenue (based on revenue_data table structure)
      if (item.category === 'Milk Sales') {
        revenue.milkSales += Number(item.income || 0);
      } else if (item.category === 'Livestock Sales') {
        revenue.livestockSales += Number(item.income || 0);
      } else {
        revenue.otherSales += Number(item.income || 0);
      }
    });
    
    revenue.total = revenue.milkSales + revenue.livestockSales + revenue.otherSales;
    
    // Calculate expenses by category
    const expenses = {
      feedCosts: 0,
      labor: 0,
      veterinary: 0,
      utilities: 0,
      maintenance: 0,
      other: 0,
      total: 0
    };
    
    // Process expense data
    expenseData.forEach(item => {
      if (item.category === 'Feed') {
        expenses.feedCosts += Number(item.amount);
      } else if (item.category === 'Labor' || item.category === 'Payroll') {
        expenses.labor += Number(item.amount);
      } else if (item.category === 'Veterinary' || item.category === 'Medical') {
        expenses.veterinary += Number(item.amount);
      } else if (item.category === 'Utilities') {
        expenses.utilities += Number(item.amount);
      } else if (item.category === 'Maintenance' || item.category === 'Repairs') {
        expenses.maintenance += Number(item.amount);
      } else {
        expenses.other += Number(item.amount);
      }
    });
    
    expenses.total = expenses.feedCosts + expenses.labor + expenses.veterinary + 
                     expenses.utilities + expenses.maintenance + expenses.other;
    
    // Calculate net income
    const netIncome = revenue.total - expenses.total;
    
    return { 
      title: 'Income Statement',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      revenue,
      expenses,
      netIncome
    };
  } catch (error) {
    console.error('Error fetching income statement data:', error);
    // Return a default structure with zeros in case of error
    return { 
      title: 'Income Statement',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      revenue: {
        milkSales: 0,
        livestockSales: 0,
        otherSales: 0,
        total: 0
      },
      expenses: {
        feedCosts: 0,
        labor: 0,
        veterinary: 0,
        utilities: 0,
        maintenance: 0,
        other: 0,
        total: 0
      },
      netIncome: 0,
      error: error.message
    };
  }
};

async function fetchBalanceSheetData() {
  try {
    // Fetch asset data from the database
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('*');
    
    if (assetError) throw assetError;
    
    // Fetch liability data from the database
    const { data: liabilityData, error: liabilityError } = await supabase
      .from('liabilities')
      .select('*');
    
    if (liabilityError) throw liabilityError;
    
    // Calculate current assets totals
    const currentAssets = {
      cash: 0,
      accountsReceivable: 0,
      inventory: 0,
      total: 0
    };
    
    // Calculate non-current assets totals
    const nonCurrentAssets = {
      land: 0,
      buildings: 0,
      equipment: 0,
      livestock: 0,
      total: 0
    };
    
    // Process asset data
    assetData.forEach(asset => {
      if (asset.asset_type === 'Cash') {
        currentAssets.cash += Number(asset.value);
      } else if (asset.asset_type === 'Accounts Receivable') {
        currentAssets.accountsReceivable += Number(asset.value);
      } else if (asset.asset_type === 'Inventory') {
        currentAssets.inventory += Number(asset.value);
      } else if (asset.asset_type === 'Land') {
        nonCurrentAssets.land += Number(asset.value);
      } else if (asset.asset_type === 'Buildings') {
        nonCurrentAssets.buildings += Number(asset.value);
      } else if (asset.asset_type === 'Equipment') {
        nonCurrentAssets.equipment += Number(asset.value);
      } else if (asset.asset_type === 'Livestock') {
        nonCurrentAssets.livestock += Number(asset.value);
      }
    });
    
    // Calculate totals
    currentAssets.total = currentAssets.cash + currentAssets.accountsReceivable + currentAssets.inventory;
    nonCurrentAssets.total = nonCurrentAssets.land + nonCurrentAssets.buildings + 
                             nonCurrentAssets.equipment + nonCurrentAssets.livestock;
    
    const totalAssets = currentAssets.total + nonCurrentAssets.total;
    
    // Calculate liability totals
    const currentLiabilities = {
      accountsPayable: 0,
      shortTermDebt: 0,
      total: 0
    };
    
    const longTermLiabilities = {
      loans: 0,
      mortgages: 0,
      total: 0
    };
    
    // Process liability data
    liabilityData.forEach(liability => {
      if (liability.liability_type === 'Accounts Payable') {
        currentLiabilities.accountsPayable += Number(liability.value);
      } else if (liability.liability_type === 'Short Term Debt') {
        currentLiabilities.shortTermDebt += Number(liability.value);
      } else if (liability.liability_type === 'Loans') {
        longTermLiabilities.loans += Number(liability.value);
      } else if (liability.liability_type === 'Mortgages') {
        longTermLiabilities.mortgages += Number(liability.value);
      }
    });
    
    // Calculate totals
    currentLiabilities.total = currentLiabilities.accountsPayable + currentLiabilities.shortTermDebt;
    longTermLiabilities.total = longTermLiabilities.loans + longTermLiabilities.mortgages;
    
    const totalLiabilities = currentLiabilities.total + longTermLiabilities.total;
    
    // Calculate equity
    const ownersEquity = totalAssets - totalLiabilities;
    
    return { 
      title: 'Balance Sheet',
      date: new Date().toISOString(),
      assets: {
        currentAssets,
        nonCurrentAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalLiabilities
      },
      equity: {
        ownersEquity,
        totalEquity: ownersEquity
      }
    };
  } catch (error) {
    console.error('Error fetching balance sheet data:', error);
    // Return default structure with zeros in case of error
    return { 
      title: 'Balance Sheet',
      date: new Date().toISOString(),
      assets: {
        currentAssets: {
          cash: 0,
          accountsReceivable: 0,
          inventory: 0,
          total: 0
        },
        nonCurrentAssets: {
          land: 0,
          buildings: 0,
          equipment: 0,
          livestock: 0,
          total: 0
        },
        totalAssets: 0
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: 0,
          shortTermDebt: 0,
          total: 0
        },
        longTermLiabilities: {
          loans: 0,
          mortgages: 0,
          total: 0
        },
        totalLiabilities: 0
      },
      equity: {
        ownersEquity: 0,
        totalEquity: 0
      },
      error: error.message
    };
  }
}

async function fetchCashFlowData(dateRange, startDate, endDate) {
  try {
    // Convert date range to actual dates if necessary
    const { from, to } = getDateRangeValues(dateRange, startDate, endDate);
    
    // Fetch cash flow data from the database
    const { data: cashFlowData, error: cashFlowError } = await supabase
      .from('cash_flow')
      .select('*')
      .gte('date', from)
      .lte('date', to);
    
    if (cashFlowError) throw cashFlowError;
    
    // Initialize categories
    const operatingActivities = {
      receipts: 0,
      payments: 0,
      netCashFromOperations: 0
    };
    
    const investingActivities = {
      assetSales: 0,
      assetPurchases: 0,
      netCashFromInvesting: 0
    };
    
    const financingActivities = {
      loanProceeds: 0,
      loanPayments: 0,
      netCashFromFinancing: 0
    };
    
    // Process cash flow data
    cashFlowData.forEach(item => {
      if (item.category === 'Operating Receipts') {
        operatingActivities.receipts += Number(item.amount);
      } else if (item.category === 'Operating Payments') {
        operatingActivities.payments += Number(item.amount);
      } else if (item.category === 'Asset Sales') {
        investingActivities.assetSales += Number(item.amount);
      } else if (item.category === 'Asset Purchases') {
        investingActivities.assetPurchases += Number(item.amount);
      } else if (item.category === 'Loan Proceeds') {
        financingActivities.loanProceeds += Number(item.amount);
      } else if (item.category === 'Loan Payments') {
        financingActivities.loanPayments += Number(item.amount);
      }
    });
    
    // Calculate net values
    operatingActivities.netCashFromOperations = operatingActivities.receipts + operatingActivities.payments;
    investingActivities.netCashFromInvesting = investingActivities.assetSales + investingActivities.assetPurchases;
    financingActivities.netCashFromFinancing = financingActivities.loanProceeds + financingActivities.loanPayments;
    
    // Calculate total cash flow
    const netCashFlow = operatingActivities.netCashFromOperations + 
                        investingActivities.netCashFromInvesting + 
                        financingActivities.netCashFromFinancing;
    
    // Get beginning cash
    const { data: beginningCashData, error: beginningCashError } = await supabase
      .from('financial_stats')
      .select('value')
      .eq('key', 'beginning_cash')
      .single();
    
    if (beginningCashError) throw beginningCashError;
    
    const beginningCash = beginningCashData ? Number(beginningCashData.value) : 0;
    const endingCash = beginningCash + netCashFlow;
    
    return { 
      title: 'Cash Flow Statement',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashFlow,
      beginningCash,
      endingCash
    };
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    // Return default structure with zeros in case of error
    return { 
      title: 'Cash Flow Statement',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      operatingActivities: {
        receipts: 0,
        payments: 0,
        netCashFromOperations: 0
      },
      investingActivities: {
        assetSales: 0,
        assetPurchases: 0,
        netCashFromInvesting: 0
      },
      financingActivities: {
        loanProceeds: 0,
        loanPayments: 0,
        netCashFromFinancing: 0
      },
      netCashFlow: 0,
      beginningCash: 0,
      endingCash: 0,
      error: error.message
    };
  }
}

async function fetchExpenseReportData(dateRange, startDate, endDate) {
  try {
    // Convert date range to actual dates if necessary
    const { from, to } = getDateRangeValues(dateRange, startDate, endDate);
    
    // Fetch expense data from the database
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', from)
      .lte('date', to);
    
    if (expenseError) throw expenseError;
    
    // Group expenses by category
    const categories = {};
    let totalExpenses = 0;
    
    // Process expense data
    expenseData.forEach(expense => {
      const category = expense.category || 'Other';
      if (!categories[category]) {
        categories[category] = 0;
      }
      
      const amount = Number(expense.amount);
      categories[category] += amount;
      totalExpenses += amount;
    });
    
    // Calculate category percentages and create array format
    const expenses = Object.keys(categories).map(category => {
      const amount = categories[category];
      const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      
      return {
        category,
        amount,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);
    
    // Calculate monthly averages
    // Get the number of months covered by the date range
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const monthDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                      (toDate.getMonth() - fromDate.getMonth()) + 1;
    
    const averageMonthly = totalExpenses / (monthDiff || 1);
    
    // Find largest category
    const largestCategory = expenses.length > 0 ? expenses[0].category : '';
    const largestAmount = expenses.length > 0 ? expenses[0].amount : 0;
    
    return { 
      title: 'Expense Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      expenses,
      summary: {
        totalExpenses,
        averageMonthly,
        largestCategory,
        largestAmount
      }
    };
  } catch (error) {
    console.error('Error fetching expense report data:', error);
    // Return default structure with zeros in case of error
    return { 
      title: 'Expense Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      expenses: [],
      summary: {
        totalExpenses: 0,
        averageMonthly: 0,
        largestCategory: '',
        largestAmount: 0
      },
      error: error.message
    };
  }
}

async function fetchRevenueReportData(dateRange, startDate, endDate) {
  try {
    console.log('Fetching revenue report data:', { dateRange, startDate, endDate });
    
    // Convert date range to actual dates if necessary
    const { from, to } = getDateRangeValues(dateRange, startDate, endDate);
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    console.log('Date range converted to:', { fromDate, toDate });
    
    // Fetch current period revenue data - using month and year fields instead of date
    const revenueQuery = `and(year.eq.${fromDate.getFullYear()},month.gte.${fromDate.getMonth() + 1}),and(year.eq.${toDate.getFullYear()},month.lte.${toDate.getMonth() + 1}),year.gt.${fromDate.getFullYear()},year.lt.${toDate.getFullYear()}`
    console.log('Revenue data query:', revenueQuery);
    
    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue_data')
      .select('*')
      .or(revenueQuery);
    
    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
      throw revenueError;
    }
    
    console.log(`Retrieved ${revenueData?.length || 0} revenue records`);
    
    // To calculate growth rate, fetch previous period data
    // Calculate previous period dates (same length as current period but before)
    const currentFrom = new Date(from);
    const currentTo = new Date(to);
    const periodLength = currentTo.getTime() - currentFrom.getTime();
    
    const previousTo = new Date(currentFrom.getTime() - 1); // Day before current period starts
    const previousFrom = new Date(previousTo.getTime() - periodLength);
    
    // Use month and year fields instead of date
    let previousData = [];
    const { data: fetchedPreviousData, error: previousError } = await supabase
      .from('revenue_data')
      .select('*')
      .or(`and(year.eq.${previousFrom.getFullYear()},month.gte.${previousFrom.getMonth() + 1}),and(year.eq.${previousTo.getFullYear()},month.lte.${previousTo.getMonth() + 1}),year.gt.${previousFrom.getFullYear()},year.lt.${previousTo.getFullYear()}`);
    
    if (previousError) {
      console.error('Error fetching previous revenue data:', previousError);
      // Continue without previous data instead of throwing
    } else {
      previousData = fetchedPreviousData || [];
    }
    
    // Group revenue by source
    const sources = {};
    let totalRevenue = 0;
    
    // Process revenue data
    revenueData.forEach(item => {
      // Revenue data may have income field instead of amount field
      const source = item.category || 'Other Income';
      if (!sources[source]) {
        sources[source] = 0;
      }
      
      // Use income field for revenue (based on revenueUpdateService.js structure)
      const amount = Number(item.income || 0);
      sources[source] += amount;
      totalRevenue += amount;
    });
    
    // Calculate source percentages and create array format
    const revenue = Object.keys(sources).map(source => {
      const amount = sources[source];
      const percentage = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
      
      return {
        source,
        amount,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);
    
    // Calculate monthly averages
    // Get the number of months covered by the date range
    const monthDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                      (toDate.getMonth() - fromDate.getMonth()) + 1;
    
    const averageMonthly = totalRevenue / (monthDiff || 1);
    
    // Find highest source
    const highestSource = revenue.length > 0 ? revenue[0].source : '';
    const highestAmount = revenue.length > 0 ? revenue[0].amount : 0;
    
    // Calculate growth rate 
    let totalPreviousRevenue = 0;
    previousData.forEach(item => {
      // Use income field for previous revenue data as well
      totalPreviousRevenue += Number(item.income || 0);
    });
    
    let growthRate = 0;
    if (totalPreviousRevenue > 0) {
      growthRate = ((totalRevenue - totalPreviousRevenue) / totalPreviousRevenue) * 100;
    } else if (totalRevenue > 0) {
      growthRate = 100; // If previous is 0 and current is positive, 100% growth
    }
    
    return { 
      title: 'Revenue Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      revenue,
      summary: {
        totalRevenue,
        averageMonthly,
        highestSource,
        highestAmount,
        growthRate: parseFloat(growthRate.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Error fetching revenue report data:', error);
    // Return default structure with zeros in case of error
    return { 
      title: 'Revenue Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      revenue: [],
      summary: {
        totalRevenue: 0,
        averageMonthly: 0,
        highestSource: '',
        highestAmount: 0,
        growthRate: 0
      },
      error: error.message
    };
  }
}

async function fetchTaxReportData(dateRange, startDate, endDate) {
  try {
    console.log('Fetching tax report data:', { dateRange, startDate, endDate });
    
    // Convert date range to actual dates if necessary
    const { from, to } = getDateRangeValues(dateRange, startDate, endDate);
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    console.log('Date range converted to:', { fromDate, toDate });
    
    // Fetch revenue data from the database - using month and year fields instead of date
    const revenueQuery = `and(year.eq.${fromDate.getFullYear()},month.gte.${fromDate.getMonth() + 1}),and(year.eq.${toDate.getFullYear()},month.lte.${toDate.getMonth() + 1}),year.gt.${fromDate.getFullYear()},year.lt.${toDate.getFullYear()}`
    console.log('Revenue data query for tax report:', revenueQuery);
    
    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue_data')
      .select('*')
      .or(revenueQuery);
    
    if (revenueError) {
      console.error('Error fetching revenue data for tax report:', revenueError);
      throw revenueError;
    }
    
    console.log(`Retrieved ${revenueData?.length || 0} revenue records for tax report`);
    
    // Fetch expense data from the database
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', from)
      .lte('date', to);
    
    if (expenseError) throw expenseError;
    
    // Calculate gross revenue
    let grossRevenue = 0;
    revenueData.forEach(item => {
      // Use income field for revenue (based on revenue_data table structure)
      grossRevenue += Number(item.income || 0);
    });
    
    // Group deductions by category
    const deductionsByCategory = {};
    let totalDeductions = 0;
    
    // Process expense data as deductions
    expenseData.forEach(expense => {
      const category = expense.category || 'Other';
      const deductionCategory = category + ' Expenses';
      
      if (!deductionsByCategory[deductionCategory]) {
        deductionsByCategory[deductionCategory] = 0;
      }
      
      const amount = Number(expense.amount);
      deductionsByCategory[deductionCategory] += amount;
      totalDeductions += amount;
    });
    
    // Create deductions array
    const deductions = Object.keys(deductionsByCategory).map(category => ({
      category,
      amount: deductionsByCategory[category]
    })).sort((a, b) => b.amount - a.amount);
    
    // Calculate taxable income
    const netTaxableIncome = grossRevenue - totalDeductions;
    
    // Calculate tax rates (this would typically come from tax tables or settings)
    const federalRate = 0.15; // 15% federal tax rate for example
    const stateRate = 0.05;   // 5% state tax rate for example
    
    // Calculate tax liability
    const federalTax = Math.max(0, netTaxableIncome * federalRate);
    const stateTax = Math.max(0, netTaxableIncome * stateRate);
    const totalTaxDue = federalTax + stateTax;
    
    // Calculate effective tax rate
    const effectiveTaxRate = netTaxableIncome > 0 
                             ? Math.round((totalTaxDue / netTaxableIncome) * 100)
                             : 0;
    
    return { 
      title: 'Tax Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      taxableIncome: {
        grossRevenue,
        allowableDeductions: totalDeductions,
        netTaxableIncome
      },
      deductions,
      taxLiability: {
        federalTax,
        stateTax,
        totalTaxDue,
        effectiveTaxRate
      }
    };
  } catch (error) {
    console.error('Error fetching tax report data:', error);
    // Return default structure with zeros in case of error
    return { 
      title: 'Tax Report',
      period: formatDateRangeForTitle(dateRange, startDate, endDate),
      taxableIncome: {
        grossRevenue: 0,
        allowableDeductions: 0,
        netTaxableIncome: 0
      },
      deductions: [],
      taxLiability: {
        federalTax: 0,
        stateTax: 0,
        totalTaxDue: 0,
        effectiveTaxRate: 0
      },
      error: error.message
    };
  }
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent += `Generated,${new Date().toLocaleDateString()}\n\n`;
      
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
      csvContent = `${reportType} Report\nGenerated,${new Date().toLocaleDateString()}\n\nSample milk production data for ${reportType}`;
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
