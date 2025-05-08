import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Droplet, Filter, Search, ChevronLeft, ChevronRight, BarChart2, Download, Plus, ThermometerSun, X, RefreshCw,FileSpreadsheet,FileText,File,FileType } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Area, ReferenceLine
} from 'recharts';
import { 
  fetchMilkCollections, 
  fetchMonthlyTotals, 
  fetchQualityTrends, 
  addMilkCollection, 
  updateMilkCollection, 
  deleteMilkCollection, 
  getQualityStandards, 
  getMilkAlerts 
} from './services/milkService';
import { supabase } from '../lib/supabase';
import {
  initReportsTable, fetchReports, generateReport, deleteReport,
  getReportById, downloadReport
} from './services/reportService';



// Default quality standards in case the API doesn't return them
  const defaultStandards = {
    fat: { min: 3.5, target: 3.8, max: 4.2 },
    protein: { min: 3.0, target: 3.3, max: 3.6 },
    lactose: { min: 4.5, target: 4.8, max: 5.0 },
    somatic: { max: 200 },
    bacteria: { max: 20000 }
  };

// Utility functions
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const formatShortDate = (dateString) => {
  const options = { month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const handleDownload = (data, filename, fileType) => {
  let content = '';
  let mimeType = '';
  
  // Format based on file type
  if (fileType === 'csv') {
    mimeType = 'text/csv;charset=utf-8;';
    
    // For CSV, create headers and data rows
    if (Array.isArray(data)) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      content = [headers, ...rows].join('\n');
    }
  } else if (fileType === 'json') {
    mimeType = 'application/json;charset=utf-8;';
    content = JSON.stringify(data, null, 2);
  } else if (fileType === 'txt') {
    mimeType = 'text/plain;charset=utf-8;';
    content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  }
  
  // Create a blob and download link
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Main milk production component
const MilkProduction = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState('week');
  const [milkData, setMilkData] = useState({
    dailyCollections: [],
    monthlyTotals: [],
    qualityTrends: [],
    qualityStandards: {},
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch(dateRange) {
      case 'today':
        // Move one day forward or backward
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        // Move one week forward or backward
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        // Move one month forward or backward
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      default:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    // Don't allow navigating to future dates beyond today
    const today = new Date();
    if (newDate > today) {
      newDate.setTime(today.getTime());
    }
    
    setCurrentDate(newDate);
  }, [currentDate, dateRange]);

  const loadMilkData = async () => {
    try {
      setIsLoading(true);
      
      // Create clean date strings (no time component) for exact date matching
      const currentDateStr = currentDate.toISOString().split('T')[0];
      let startDateStr;
      let endDateStr;
      
      switch(dateRange) {
        case 'today':
          // For today, use the same date for start and end
          startDateStr = currentDateStr;
          endDateStr = currentDateStr;
          break;
        case 'week':
          // For week, go back 6 days
          const weekStartDate = new Date(currentDate);
          weekStartDate.setDate(weekStartDate.getDate() - 6);
          startDateStr = weekStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
          break;
        case 'month':
          // For month, go back 29 days
          const monthStartDate = new Date(currentDate);
          monthStartDate.setDate(monthStartDate.getDate() - 29);
          startDateStr = monthStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
          break;
        default:
          // Default to week
          const defaultStartDate = new Date(currentDate);
          defaultStartDate.setDate(defaultStartDate.getDate() - 6);
          startDateStr = defaultStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
      }
      
      // Fetch all data in parallel using clean date strings
      const [
        collections,
        monthlyTotals,
        qualityTrends,
        qualityStandards,
        alerts
      ] = await Promise.all([
        fetchMilkCollections(startDateStr, endDateStr),
        fetchMonthlyTotals(currentDate.getFullYear()),
        fetchQualityTrends(dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30),
        getQualityStandards(),
        getMilkAlerts()
      ]);
      
      setMilkData({
        dailyCollections: collections,
        monthlyTotals,
        qualityTrends,
        qualityStandards,
        alerts
      });
    } catch (error) {
      console.error('Error loading milk data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data based on the selected date range
  // Inside the useEffect for data loading:
useEffect(() => {
  const loadMilkData = async () => {
    try {
      setIsLoading(true);
      
      // Create clean date strings (no time component) for exact date matching
      const currentDateStr = currentDate.toISOString().split('T')[0];
      let startDateStr;
      let endDateStr;
      
      switch(dateRange) {
        case 'today':
          // For today, use the same date for start and end
          startDateStr = currentDateStr;
          endDateStr = currentDateStr;
          break;
        case 'week':
          // For week, go back 6 days
          const weekStartDate = new Date(currentDate);
          weekStartDate.setDate(weekStartDate.getDate() - 6);
          startDateStr = weekStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
          break;
        case 'month':
          // For month, go back 29 days
          const monthStartDate = new Date(currentDate);
          monthStartDate.setDate(monthStartDate.getDate() - 29);
          startDateStr = monthStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
          break;
        default:
          // Default to week
          const defaultStartDate = new Date(currentDate);
          defaultStartDate.setDate(defaultStartDate.getDate() - 6);
          startDateStr = defaultStartDate.toISOString().split('T')[0];
          endDateStr = currentDateStr;
      }
      
      // Fetch all data in parallel using clean date strings
      const [
        collections,
        monthlyTotals,
        qualityTrends,
        qualityStandards,
        alerts
      ] = await Promise.all([
        fetchMilkCollections(startDateStr, endDateStr),
        fetchMonthlyTotals(currentDate.getFullYear()),
        fetchQualityTrends(dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : 30),
        getQualityStandards(),
        getMilkAlerts()
      ]);
      
      setMilkData({
        dailyCollections: collections,
        monthlyTotals,
        qualityTrends,
        qualityStandards,
        alerts
      });
    } catch (error) {
      console.error('Error loading milk data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadMilkData();
}, [dateRange, currentDate]);
  
  // Calculate statistics safely
  const getTotal = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    
    // Use reduce to sum up totalQuantity values, ensuring they're treated as numbers
    return data.reduce((sum, record) => {
      const quantity = parseFloat(record.totalQuantity || 0);
      return sum + (isNaN(quantity) ? 0 : quantity);
    }, 0);
  };

  const filteredData = milkData.dailyCollections || [];
  const totalMilk = getTotal(filteredData);

  // Since we don't have direct access to quality parameters yet,
  // let's calculate averages from the trends data with safeguards
  const avgFat = milkData.qualityTrends && milkData.qualityTrends.length > 0 
    ? milkData.qualityTrends.reduce((sum, item) => sum + (item.fat || 0), 0) / milkData.qualityTrends.length
    : 3.8;
    
  const avgProtein = milkData.qualityTrends && milkData.qualityTrends.length > 0
    ? milkData.qualityTrends.reduce((sum, item) => sum + (item.protein || 0), 0) / milkData.qualityTrends.length
    : 3.2;

  // Prepare chart data with null checks
  const prepareChartData = () => {
    // Return empty array if no data
    if (!Array.isArray(filteredData) || filteredData.length === 0) {
      return [];
    }
    
    console.log("Raw filtered data:", filteredData);
  
    // Group by date and calculate totals for each day
    const groupedByDate = {};
    
    // Track totals by day for debugging
    const dailyTotals = {};
    
    filteredData.forEach(record => {
      if (!record.date) return; // Skip records with no date
      
      // Format date for consistent comparison
      const dateKey = typeof record.date === 'string' ? record.date.split('T')[0] : record.date;
      
      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = 0;
      }
      
      // Get the correct amount field - some records use totalQuantity, others use amount
      const amount = record.amount !== undefined ? record.amount : record.totalQuantity;
      
      // Parse it as a number to ensure proper addition
      const quantity = parseFloat(amount || 0);
      
      // Add to running total for debugging
      if (!isNaN(quantity)) {
        dailyTotals[dateKey] += quantity;
      }
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          displayDate: formatShortDate(new Date(dateKey)),
          totalQuantity: 0,
          morningQuantity: 0,
          eveningQuantity: 0,
          collections: []
        };
      }
      
      // Only add if it's a valid number
      if (!isNaN(quantity)) {
        // Add to running total
        groupedByDate[dateKey].totalQuantity += quantity;
        
        // Track morning/evening split
        if (record.shift === 'Morning') {
          groupedByDate[dateKey].morningQuantity += quantity;
        } else if (record.shift === 'Evening') {
          groupedByDate[dateKey].eveningQuantity += quantity;
        }
        
        // Keep track of individual collections for detailed view
        groupedByDate[dateKey].collections.push({
          id: record.id || `${dateKey}-${groupedByDate[dateKey].collections.length}`,
          shift: record.shift || 'Unknown',
          quantity: quantity
        });
      }
    });
    
    console.log("Daily totals:", dailyTotals);
    console.log("Grouped data:", groupedByDate);
    
    // Convert object to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };
  
  const chartData = prepareChartData();
  
  // Toggle add modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  // After a successful add, update the data
  const handleAddCollection = async (newCollection) => {
    try {
      // Extract quality parameters to pass them to the milk service
      const { qualityParameters, ...collectionData } = newCollection;
      
      // Call the service function to add the collection
      const result = await addMilkCollection(collectionData);
      
      // Reload data to reflect the changes
      const startDateStr = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const endDateStr = new Date().toISOString().split('T')[0];
      
      const updatedCollections = await fetchMilkCollections(startDateStr, endDateStr);
      
      setMilkData({
        ...milkData,
        dailyCollections: updatedCollections
      });
      
      return result;
    } catch (error) {
      console.error('Error adding collection:', error);
      throw error;
    }
  };
  
  if (isLoading && filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error && filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 text-xl mb-4">Error loading data</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  const calculateAverageFat = (collections) => {
    if (!Array.isArray(collections) || collections.length === 0) {
      return '0.0';
    }
    
    let validEntries = 0;
    const totalFat = collections.reduce((sum, record) => {
      // Get fat value from qualityParameters or direct property
      let fatValue = null;
      
      if (record.fat !== undefined && record.fat !== null) {
        fatValue = parseFloat(record.fat);
      } else if (record.qualityParameters?.fat !== undefined && record.qualityParameters?.fat !== null) {
        fatValue = parseFloat(record.qualityParameters.fat);
      }
      
      if (!isNaN(fatValue)) {
        validEntries++;
        return sum + fatValue;
      }
      
      return sum;
    }, 0);
    
    return validEntries > 0 ? (totalFat / validEntries).toFixed(1) : '0.0';
  };
  
  // Calculate average protein percentage from actual collection data
  const calculateAverageProtein = (collections) => {
    if (!Array.isArray(collections) || collections.length === 0) {
      return '0.0';
    }
    
    let validEntries = 0;
    const totalProtein = collections.reduce((sum, record) => {
      // Get protein value from qualityParameters or direct property
      let proteinValue = null;
      
      if (record.protein !== undefined && record.protein !== null) {
        proteinValue = parseFloat(record.protein);
      } else if (record.qualityParameters?.protein !== undefined && record.qualityParameters?.protein !== null) {
        proteinValue = parseFloat(record.qualityParameters.protein);
      }
      
      if (!isNaN(proteinValue)) {
        validEntries++;
        return sum + proteinValue;
      }
      
      return sum;
    }, 0);
    
    return validEntries > 0 ? (totalProtein / validEntries).toFixed(1) : '0.0';
  };
  
  // Calculate average lactose percentage from actual collection data
  const calculateAverageLactose = (collections) => {
    if (!Array.isArray(collections) || collections.length === 0) {
      return '0.0';
    }
    
    let validEntries = 0;
    const totalLactose = collections.reduce((sum, record) => {
      // Get lactose value from qualityParameters or direct property
      let lactoseValue = null;
      
      if (record.lactose !== undefined && record.lactose !== null) {
        lactoseValue = parseFloat(record.lactose);
      } else if (record.qualityParameters?.lactose !== undefined && record.qualityParameters?.lactose !== null) {
        lactoseValue = parseFloat(record.qualityParameters.lactose);
      }
      
      if (!isNaN(lactoseValue)) {
        validEntries++;
        return sum + lactoseValue;
      }
      
      return sum;
    }, 0);
    
    return validEntries > 0 ? (totalLactose / validEntries).toFixed(1) : '0.0';
  };
  
  // Calculate percentage change in production compared to previous period
  const calculateProductionChange = (collections) => {
    if (!Array.isArray(collections) || collections.length === 0) {
      return '0.0';
    }
    
    // Group data by date
    const groupedByDate = {};
    
    collections.forEach(record => {
      const dateKey = typeof record.date === 'string' ? record.date.split('T')[0] : record.date;
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = 0;
      }
      
      // Get quantity
      const quantity = parseFloat(record.totalQuantity || record.amount || 0);
      if (!isNaN(quantity)) {
        groupedByDate[dateKey] += quantity;
      }
    });
    
    // Convert to array and sort by date
    const sortedDates = Object.keys(groupedByDate).sort();
    
    if (sortedDates.length <= 1) {
      return '0.0';
    }
    
    // Compare most recent with previous
    const currentPeriod = sortedDates.slice(-Math.ceil(sortedDates.length / 2));
    const previousPeriod = sortedDates.slice(0, Math.floor(sortedDates.length / 2));
    
    const currentTotal = currentPeriod.reduce((sum, date) => sum + groupedByDate[date], 0);
    const previousTotal = previousPeriod.reduce((sum, date) => sum + groupedByDate[date], 0);
    
    if (previousTotal === 0) {
      return '0.0';
    }
    
    const percentChange = ((currentTotal - previousTotal) / previousTotal) * 100;
    return percentChange.toFixed(1);
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50/40 via-gray-50 to-green-50/30">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">Milk Production</h1>
          <button 
            onClick={toggleAddModal}
            className="flex items-center px-4 py-2 text-white rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
          >
            <Plus size={20} className="mr-2" />
            Record Collection
          </button>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'collections'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'quality'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Quality Analysis
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px transition-all duration-300 ${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
        
        {/* Date Range Filter */}
        <div className="mb-6 flex items-center space-x-4">
          <span className="text-sm text-gray-600">Date Range:</span>
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              // Reset to today when changing date range
              setCurrentDate(new Date());
            }}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          
          <div className="flex items-center ml-4 bg-white rounded-lg shadow-sm border border-gray-200 px-2 hover:shadow-md transition-shadow duration-200">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-1.5 text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="mx-2 text-sm font-medium text-gray-700">
              {dateRange === 'today' 
                ? formatShortDate(currentDate) 
                : dateRange === 'week'
                ? `${formatShortDate(new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000))} - ${formatShortDate(currentDate)}`
                : `${formatShortDate(new Date(currentDate.getTime() - 29 * 24 * 60 * 60 * 1000))} - ${formatShortDate(currentDate)}`
              }
            </span>
            <button 
              onClick={() => navigateDate('next')}
              className={`p-1.5 ${
                isCurrentDateToday() ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-700'
              }`}
              disabled={isCurrentDateToday()}
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>
          
          <button 
            className="p-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex items-center"
            onClick={() => {
              setCurrentDate(new Date());
              // Reload data
              loadMilkData();
            }}
          >
            <RefreshCw size={14} className="mr-2 text-green-600" />
            Today
          </button>
        </div>
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards - updated to use actual quality parameters from database */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Milk Production</p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 mt-1 mb-3">{totalMilk.toFixed(1)} L</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400">
                      <Droplet size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    {/* Calculate percentage change if we have historical data */}
                    <span>
                      {calculateProductionChange(milkData.dailyCollections)}% from previous period
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-yellow-500 to-amber-400"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Fat Content</p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-400 mt-1 mb-3">
                        {calculateAverageFat(milkData.dailyCollections)}%
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400">
                      <ThermometerSun size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex items-center">
                    <span>Target: {milkData.qualityStandards.fat?.target || '3.8'}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-400"></div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Protein Content</p>
                      <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-400 mt-1 mb-3">
                        {calculateAverageProtein(milkData.dailyCollections)}%
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-400">
                      <BarChart2 size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex items-center">
                    <span>Target: {milkData.qualityStandards.protein?.target || '3.3'}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Production Chart */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Daily Milk Production</h2>
                  <button 
                    onClick={() => handleDownload(chartData, `milk-collections-${new Date().toISOString().slice(0, 10)}.csv`, 'csv')}
                    className="text-sm text-white flex items-center px-3 py-2 rounded-md bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Download size={16} className="mr-2" />
                    Export
                  </button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="displayDate" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} L`, 'Milk Production']}
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #EEE', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="totalQuantity" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Production summary below chart */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200">
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-lg font-bold text-blue-600">
                      {chartData.length > 0 ? 
                        (chartData.reduce((sum, record) => sum + (record.totalQuantity || 0), 0) / chartData.length).toFixed(1) : 
                        '0.0'}L
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-green-50 to-green-100 border border-green-200">
                    <p className="text-xs text-gray-500">Highest</p>
                    <p className="text-lg font-bold text-green-600">
                      {chartData.length > 0 ? 
                        Math.max(...chartData.map(record => record.totalQuantity || 0)).toFixed(1) : 
                        '0.0'}L
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-purple-600">
                      {chartData.reduce((sum, record) => sum + (record.totalQuantity || 0), 0).toFixed(1)}L
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Collections */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Collections</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {milkData.dailyCollections.length > 0 ? (
                  milkData.dailyCollections.slice(0, 4).map(collection => (
                    <div key={collection.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Droplet size={16} className="text-blue-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-800">
                              {collection.shift} Collection - {formatDate(collection.date)}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Collected by: {collection.collectedBy || 'Farm Staff'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-800">{collection.totalQuantity} L</p>
                          <p className="text-xs text-gray-500">
                            Fat: {collection.qualityParameters?.fat || 'N/A'}% | 
                            Protein: {collection.qualityParameters?.protein || 'N/A'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No collection records available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <CollectionsTab data={milkData.dailyCollections} />
        )}
        
        {/* Quality Analysis Tab */}
        {activeTab === 'quality' && (
          <QualityAnalysisTab data={milkData} />
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsTab data={milkData} />
        )}
      </div>
      
      {/* Add Collection Modal */}
      {isAddModalOpen && (
        <AddCollectionModal 
          onClose={toggleAddModal} 
          onAdd={handleAddCollection}
        />
      )}
    </div>
  );

    function isCurrentDateToday() {
      const today = new Date();
      return (
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      );
    }

  };
  
  // Collections Tab Component
  const CollectionsTab = ({ data }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [viewModalData, setViewModalData] = useState(null);
    const [editModalData, setEditModalData] = useState(null);
    const [deleteModalData, setDeleteModalData] = useState(null);
    const [collectionsList, setCollectionsList] = useState(data);
    const [isLoading, setIsLoading] = useState(false);
    
    // Update collections list when data prop changes
    useEffect(() => {
      setCollectionsList(data);
    }, [data]);
    
    // Filter and search collections
    const filteredCollections = collectionsList.filter(collection => {
      // Filter by date or shift
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'morning' && collection.shift === 'Morning') ||
        (filter === 'evening' && collection.shift === 'Evening');
      
      // Search by ID, date, or collector
      const matchesSearch = 
        searchQuery === '' || 
        collection.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.date.includes(searchQuery) ||
        collection.collectedBy.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
    
    // Sort by date (most recent first)
    const sortedCollections = [...filteredCollections].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedCollections.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedCollections.length / itemsPerPage);
  
    const handleViewCollection = (collection) => {
      setViewModalData(collection);
      setIsViewModalOpen(true);
    };
    
    const handleEditCollection = (collection) => {
      setEditModalData(collection);
      setIsEditModalOpen(true);
    };
  
    const handleDeleteCollection = (collection) => {
      setDeleteModalData(collection);
      setIsDeleteModalOpen(true);
    };
    
    const handleSaveEdit = async (updatedCollection) => {
      setIsLoading(true);
      console.log(updatedCollection);
      try {
        // Create a proper updated collection object with nested qualityParameters
        const processedCollection = {
          ...updatedCollection,
          qualityParameters: {
            fat: updatedCollection.fat,
            protein: updatedCollection.protein,
            lactose: updatedCollection.lactose,
            somatic: updatedCollection.somatic,
            bacteria: updatedCollection.bacteria
          }
        };
        
        // Update the collections list to reflect changes
        const updatedCollectionsList = collectionsList.map(item => 
          item.id === updatedCollection.id ? updatedCollection : item
        );
        
        setCollectionsList(updatedCollectionsList);
        setIsEditModalOpen(false);
      } catch (error) {
        console.error('Error updating collection:', error);
        alert('Failed to update collection. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    const confirmDelete = async () => {
      if (!deleteModalData) return;
      
      setIsLoading(true);
      try {
        await deleteMilkCollection(deleteModalData.id);
        
        // Remove deleted collection from the list
        const updatedCollectionsList = collectionsList.filter(
          item => item.id !== deleteModalData.id
        );
        setCollectionsList(updatedCollectionsList);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
      <div>
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
              placeholder="Search by ID, date, or collector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-300 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="all">All Collections</option>
                <option value="morning">Morning Only</option>
                <option value="evening">Evening Only</option>
              </select>
            </div>
            
            <button 
              onClick={() => handleDownload(filteredCollections, `milk-collections-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      
        {/* Collections Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length > 0 ? (
              currentItems.map(collection => (
                <tr key={collection.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {collection.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatShortDate(collection.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.shift}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {collection.totalQuantity} L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>Fat: {collection.qualityParameters?.fat || 'N/A'}%</span>
                      <span>Protein: {collection.qualityParameters?.protein || 'N/A'}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.collectedBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {collection.status || 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewCollection(collection)}
                      className="text-green-600 hover:text-green-900 mr-3 transition-colors duration-200"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditCollection(collection)}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCollection(collection)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    No collection records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${
                    currentPage === page 
                      ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 flex items-center justify-center rounded-md transition-all duration-300 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Modals */}
        {isViewModalOpen && viewModalData && (
          <ViewCollectionModal
            collection={viewModalData}
            onClose={() => setIsViewModalOpen(false)}
          />
        )}
        
        {isEditModalOpen && editModalData && (
          <EditCollectionModal
            collection={editModalData}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEdit}
          />
        )}
        
        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && deleteModalData && (
          <DeleteConfirmationModal
            collection={deleteModalData}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  };

  // Delete Confirmation Modal with updated UI
  const DeleteConfirmationModal = ({ collection, onClose, onConfirm, isLoading }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Delete Collection</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200" disabled={isLoading}>
              <X size={20} />
            </button>
          </div>
          
          <div className="px-6 py-4">
            <div className="text-red-600 mb-4 flex justify-center">
              <div className="p-3 bg-red-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <p className="text-gray-700 text-center font-medium">
              Are you sure you want to delete this milk collection record?
            </p>
            <div className="mt-2 text-sm text-gray-500 text-center">
              <p>Collection date: {formatDate(collection.date)}</p>
              <p>Quantity: {collection.totalQuantity} L</p>
              <p className="mt-2 text-red-600 font-medium">This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : 'Delete Collection'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // View Collection Modal with updated UI
  const ViewCollectionModal = ({ collection, onClose }) => {
    if (!collection) {
      return null;
    }
    
    const qualityParams = collection.qualityParameters || {};
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Collection Details - {collection.id}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
              <X size={20} />
            </button>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="mt-1 text-sm text-gray-900">{formatDate(collection.date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Shift</p>
                <p className="mt-1 text-sm text-gray-900">{collection.shift}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="mt-1 text-sm text-gray-900 font-medium">{collection.totalQuantity} L</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Collected By</p>
                <p className="mt-1 text-sm text-gray-900">{collection.collectedBy}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Quality Parameters</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                    <p className="text-xs text-gray-500">Fat</p>
                    <p className="text-sm font-medium text-gray-900">{qualityParams.fat || 'N/A'}%</p>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                    <p className="text-xs text-gray-500">Protein</p>
                    <p className="text-sm font-medium text-gray-900">{qualityParams.protein || 'N/A'}%</p>
                  </div>
                  <div className="p-2 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                    <p className="text-xs text-gray-500">Lactose</p>
                    <p className="text-sm font-medium text-gray-900">{qualityParams.lactose || 'N/A'}%</p>
                  </div>
                </div>
              </div>
              {collection.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900 p-2 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">{collection.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
const EditCollectionModal = ({ collection, onClose, onSave }) => {
  // Ensure collection exists and handle missing qualityParameters
  const qualityParams = collection.qualityParameters || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    ...collection,
    fat: qualityParams.fat || '',
    protein: qualityParams.protein || '',
    lactose: qualityParams.lactose || '',
    somatic: qualityParams.somatic || '',
    bacteria: qualityParams.bacteria || ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.date || !formData.totalQuantity) {
        throw new Error("Please fill in all required fields");
      }
      
      // Parse numeric values properly
      const totalQuantity = parseFloat(formData.totalQuantity);
      const fat = formData.fat ? parseFloat(formData.fat) : null;
      const protein = formData.protein ? parseFloat(formData.protein) : null;
      const lactose = formData.lactose ? parseFloat(formData.lactose) : null;
      const somatic = formData.somatic ? parseInt(formData.somatic) : null;
      const bacteria = formData.bacteria ? parseInt(formData.bacteria) : null;
      
      if (isNaN(totalQuantity) || totalQuantity <= 0) {
        throw new Error("Please enter a valid quantity");
      }
      
      // Prepare data for API with correct structure
      const updatedCollection = {
        id: collection.id,
        date: formData.date,
        shift: formData.shift,
        totalQuantity: totalQuantity,
        quality: formData.quality,
        notes: formData.notes,
        collectedBy: formData.collectedBy || collection.collectedBy,
        qualityParameters: {
          fat,
          protein,
          lactose,
          somatic,
          bacteria
        }
      };
      
      // Call the updateMilkCollection service
      await updateMilkCollection(collection.id, {
        date: formData.date,
        amount: totalQuantity,
        shift: formData.shift,
        quality: formData.quality,
        notes: formData.notes,
        fat,
        protein,
        lactose,
        somatic,
        bacteria
      });
      
      // Pass the updated collection back to the parent component
      onSave(updatedCollection);
      
    } catch (err) {
      setError(err.message || "Failed to update collection. Please try again.");
      console.error("Error updating collection:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
      
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              Edit Collection - {collection.id}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
              <X size={20} />
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                    Shift *
                  </label>
                  <select
                    id="shift"
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity (L) *
                </label>
                <input
                  type="number"
                  id="totalQuantity"
                  name="totalQuantity"
                  value={formData.totalQuantity}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
  
              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                      Fat (%)
                    </label>
                    <input
                      type="number"
                      id="fat"
                      name="fat"
                      value={formData.fat}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                      Protein (%)
                    </label>
                    <input
                      type="number"
                      id="protein"
                      name="protein"
                      value={formData.protein}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lactose" className="block text-sm font-medium text-gray-700 mb-1">
                      Lactose (%)
                    </label>
                    <input
                      type="number"
                      id="lactose"
                      name="lactose"
                      value={formData.lactose}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="somatic" className="block text-sm font-medium text-gray-700 mb-1">
                      Somatic Cell Count (thousands/ml)
                    </label>
                    <input
                      type="number"
                      id="somatic"
                      name="somatic"
                      value={formData.somatic}
                      onChange={handleChange}
                      min="0"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bacteria" className="block text-sm font-medium text-gray-700 mb-1">
                      Bacteria Count (CFU/ml)
                    </label>
                    <input
                      type="number"
                      id="bacteria"
                      name="bacteria"
                      value={formData.bacteria}
                      onChange={handleChange}
                      min="0"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Any additional information about this collection..."
                ></textarea>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Quality Analysis Tab Component
  const QualityAnalysisTab = ({ data }) => {
    const [selectedParameter, setSelectedParameter] = useState('fat');
    const [dateRange, setDateRange] = useState('week');
    
    const dailyCollections = data.dailyCollections || [];
    const standards = data.qualityStandards || defaultStandards;
    
    // Check if we have data to display
    const hasQualityData = dailyCollections.length > 0;
    
    // Prepare chart data from actual milk collection records
    const prepareQualityTrendData = () => {
      if (!Array.isArray(dailyCollections) || dailyCollections.length === 0) {
        return [];
      }
      
      // Group collections by date
      const groupedByDate = {};
      
      dailyCollections.forEach(record => {
        const dateKey = typeof record.date === 'string' ? record.date.split('T')[0] : record.date;
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = {
            date: dateKey,
            displayDate: formatShortDate(new Date(dateKey)),
            fatSum: 0,
            fatCount: 0,
            proteinSum: 0,
            proteinCount: 0,
            lactoseSum: 0,
            lactoseCount: 0,
            somaticSum: 0,
            somaticCount: 0,
            bacteriaSum: 0,
            bacteriaCount: 0
          };
        }
        
        // Add fat data
        let fatValue = null;
        if (record.fat !== undefined && record.fat !== null) {
          fatValue = parseFloat(record.fat);
        } else if (record.qualityParameters?.fat !== undefined && record.qualityParameters?.fat !== null) {
          fatValue = parseFloat(record.qualityParameters.fat);
        }
        
        if (!isNaN(fatValue)) {
          groupedByDate[dateKey].fatSum += fatValue;
          groupedByDate[dateKey].fatCount += 1;
        }
        
        // Add protein data
        let proteinValue = null;
        if (record.protein !== undefined && record.protein !== null) {
          proteinValue = parseFloat(record.protein);
        } else if (record.qualityParameters?.protein !== undefined && record.qualityParameters?.protein !== null) {
          proteinValue = parseFloat(record.qualityParameters.protein);
        }
        
        if (!isNaN(proteinValue)) {
          groupedByDate[dateKey].proteinSum += proteinValue;
          groupedByDate[dateKey].proteinCount += 1;
        }
        
        // Add lactose data
        let lactoseValue = null;
        if (record.lactose !== undefined && record.lactose !== null) {
          lactoseValue = parseFloat(record.lactose);
        } else if (record.qualityParameters?.lactose !== undefined && record.qualityParameters?.lactose !== null) {
          lactoseValue = parseFloat(record.qualityParameters.lactose);
        }
        
        if (!isNaN(lactoseValue)) {
          groupedByDate[dateKey].lactoseSum += lactoseValue;
          groupedByDate[dateKey].lactoseCount += 1;
        }
        
        // Add somatic cell data
        let somaticValue = null;
        if (record.somatic_cell_count !== undefined && record.somatic_cell_count !== null) {
          somaticValue = parseFloat(record.somatic_cell_count);
        } else if (record.qualityParameters?.somatic !== undefined && record.qualityParameters?.somatic !== null) {
          somaticValue = parseFloat(record.qualityParameters.somatic);
        }
        
        if (!isNaN(somaticValue)) {
          groupedByDate[dateKey].somaticSum += somaticValue;
          groupedByDate[dateKey].somaticCount += 1;
        }
        
        // Add bacteria data
        let bacteriaValue = null;
        if (record.bacteria_count !== undefined && record.bacteria_count !== null) {
          bacteriaValue = parseFloat(record.bacteria_count);
        } else if (record.qualityParameters?.bacteria !== undefined && record.qualityParameters?.bacteria !== null) {
          bacteriaValue = parseFloat(record.qualityParameters.bacteria);
        }
        
        if (!isNaN(bacteriaValue)) {
          groupedByDate[dateKey].bacteriaSum += bacteriaValue;
          groupedByDate[dateKey].bacteriaCount += 1;
        }
      });
      
      // Calculate averages for each day
      Object.values(groupedByDate).forEach(day => {
        day.fat = day.fatCount > 0 ? day.fatSum / day.fatCount : null;
        day.protein = day.proteinCount > 0 ? day.proteinSum / day.proteinCount : null;
        day.lactose = day.lactoseCount > 0 ? day.lactoseSum / day.lactoseCount : null;
        day.somatic = day.somaticCount > 0 ? day.somaticSum / day.somaticCount : null;
        day.bacteria = day.bacteriaCount > 0 ? day.bacteriaSum / day.bacteriaCount : null;
      });
      
      // Convert to array and sort by date
      return Object.values(groupedByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
    };
    
    const trendData = prepareQualityTrendData();
    
    // Calculate current averages for each parameter
    const calculateParameterAverage = (parameter) => {
      let sum = 0;
      let count = 0;
      
      trendData.forEach(day => {
        if (day[parameter] !== null) {
          sum += day[parameter];
          count++;
        }
      });
      
      return count > 0 ? (sum / count).toFixed(1) : '0.0';
    };
    
    // Determine status based on parameter value and standards
    const getParameterStatus = (parameter, value) => {
      if (!value || isNaN(value)) return "Unknown";
      
      const paramStandards = standards[parameter];
      if (!paramStandards) return "Unknown";
      
      // For fat, protein, lactose - check if within target range
      if (parameter === 'fat' || parameter === 'protein' || parameter === 'lactose') {
        if (value >= paramStandards.min && value <= paramStandards.max) {
          if (Math.abs(value - paramStandards.target) <= 0.2) {
            return "Excellent";
          } else {
            return "Good";
          }
        } else if (value < paramStandards.min * 0.9 || value > paramStandards.max * 1.1) {
          return "Poor";
        } else {
          return "Average";
        }
      }
      
      // For somatic cell count and bacteria count (lower is better)
      if (parameter === 'somatic') {
        if (value < paramStandards.max * 0.7) return "Excellent";
        if (value < paramStandards.max) return "Good";
        if (value < paramStandards.max * 1.3) return "Average";
        return "Poor";
      }
      
      if (parameter === 'bacteria') {
        if (value < paramStandards.max * 0.5) return "Excellent";
        if (value < paramStandards.max) return "Good";
        if (value < paramStandards.max * 1.5) return "Average";
        return "Poor";
      }
      
      return "Unknown";
    };
    
    // Get status color class based on status
    const getStatusColorClass = (status) => {
      switch (status) {
        case "Excellent": return "bg-green-100 text-green-800";
        case "Good": return "bg-blue-100 text-blue-800";
        case "Average": return "bg-yellow-100 text-yellow-800";
        case "Poor": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };
    
    // Calculate averages once
    const currentAverages = {
      fat: parseFloat(calculateParameterAverage('fat')),
      protein: parseFloat(calculateParameterAverage('protein')),
      lactose: parseFloat(calculateParameterAverage('lactose')),
      somatic: parseFloat(calculateParameterAverage('somatic')),
      bacteria: parseFloat(calculateParameterAverage('bacteria'))
    };
    
    // Generate statuses based on averages
    const parameterStatuses = {
      fat: getParameterStatus('fat', currentAverages.fat),
      protein: getParameterStatus('protein', currentAverages.protein),
      lactose: getParameterStatus('lactose', currentAverages.lactose),
      somatic: getParameterStatus('somatic', currentAverages.somatic),
      bacteria: getParameterStatus('bacteria', currentAverages.bacteria)
    };
    
    return (
      <div>
        {/* Parameter Selection */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-2 sm:mb-0">Milk Quality Analysis</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedParameter('fat')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    selectedParameter === 'fat' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Fat
                </button>
                <button
                  onClick={() => setSelectedParameter('protein')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    selectedParameter === 'protein' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Protein
                </button>
                <button
                  onClick={() => setSelectedParameter('lactose')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    selectedParameter === 'lactose' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Lactose
                </button>
                <button
                  onClick={() => setSelectedParameter('somatic')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    selectedParameter === 'somatic' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Somatic Cells
                </button>
              </div>
            </div>
            
            {/* Selected Parameter Chart */}
            <div className="h-80">
              {hasQualityData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      allowDataOverflow={true}
                    />
                    <YAxis 
                      domain={
                        selectedParameter === 'somatic' ? [0, 'auto'] : 
                        selectedParameter === 'bacteria' ? [0, 'auto'] :
                        [standards[selectedParameter]?.min * 0.9 || 0, standards[selectedParameter]?.max * 1.1 || 5]
                      } 
                    />
                    <Tooltip 
                      formatter={(value) => {
                        if (selectedParameter === 'fat' || selectedParameter === 'protein' || selectedParameter === 'lactose') {
                          return [`${value.toFixed(2)}%`, selectedParameter.charAt(0).toUpperCase() + selectedParameter.slice(1)];
                        } else if (selectedParameter === 'somatic') {
                          return [`${value}`, 'Somatic Cell Count'];
                        } else {
                          return [`${value}`, 'Bacteria Count'];
                        }
                      }}
                      contentStyle={{ 
                        background: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #EEE', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelFormatter={(date) => formatDate(date)}
                    />
                    <Legend />
                    <Area
                      type="monotone" 
                      dataKey={selectedParameter} 
                      stroke="#4CAF50"
                      strokeWidth={3}
                      fill="url(#qualityGradient)"
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#4CAF50' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={selectedParameter} 
                      stroke="#4CAF50" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#4CAF50', fill: 'white' }}
                      activeDot={{ r: 6 }}
                    />
                    
                    {/* Add reference lines for target and limits */}
                    {(selectedParameter === 'fat' || selectedParameter === 'protein' || selectedParameter === 'lactose') && standards[selectedParameter]?.target && (
                      <ReferenceLine 
                        y={standards[selectedParameter].target} 
                        stroke="#2196F3" 
                        strokeDasharray="3 3" 
                        label={{ 
                          value: 'Target', 
                          position: 'insideTopRight', 
                          fill: '#2196F3',
                          fontSize: 12
                        }} 
                      />
                    )}
                    
                    {(selectedParameter === 'fat' || selectedParameter === 'protein' || selectedParameter === 'lactose') && standards[selectedParameter]?.min && (
                      <ReferenceLine 
                        y={standards[selectedParameter].min} 
                        stroke="rgba(255, 152, 0, 0.5)" 
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Min', 
                          position: 'insideBottomRight', 
                          fill: '#FF9800',
                          fontSize: 10
                        }}
                      />
                    )}
                    
                    {(selectedParameter === 'fat' || selectedParameter === 'protein' || selectedParameter === 'lactose') && standards[selectedParameter]?.max && (
                      <ReferenceLine 
                        y={standards[selectedParameter].max} 
                        stroke="rgba(255, 152, 0, 0.5)"
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Max', 
                          position: 'insideTopRight', 
                          fill: '#FF9800',
                          fontSize: 10
                        }}
                      />
                    )}
                    
                    {(selectedParameter === 'somatic' || selectedParameter === 'bacteria') && standards[selectedParameter]?.max && (
                      <ReferenceLine 
                        y={standards[selectedParameter].max} 
                        stroke="rgba(244, 67, 54, 0.5)"
                        strokeDasharray="3 3"
                        label={{ 
                          value: 'Limit', 
                          position: 'insideTopRight', 
                          fill: '#F44336',
                          fontSize: 10
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                  No quality data available for the selected period.
                </div>
              )}
            </div>
            
            {/* Parameter Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {selectedParameter === 'somatic' ? 'Somatic Cell Count Details' :
                 selectedParameter === 'bacteria' ? 'Bacteria Count Details' :
                 `${selectedParameter.charAt(0).toUpperCase() + selectedParameter.slice(1)} Content Details`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-500">Current Average</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {selectedParameter === 'somatic' ? currentAverages[selectedParameter].toFixed(0) :
                     selectedParameter === 'bacteria' ? currentAverages[selectedParameter].toFixed(0) :
                     `${currentAverages[selectedParameter].toFixed(2)}%`}
                  </p>
                </div>
                <div className="bg-gradient-to-b from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-500">Target Range</p>
                  <p className="text-xl font-semibold text-green-600">
                    {selectedParameter === 'somatic' ? `< ${standards[selectedParameter]?.max || '200'}` :
                     selectedParameter === 'bacteria' ? `< ${standards[selectedParameter]?.max || '20000'}` :
                     `${standards[selectedParameter]?.min || '3.0'}% - ${standards[selectedParameter]?.max || '5.0'}%`}
                  </p>
                </div>
                <div className="bg-gradient-to-b from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-xl font-semibold text-purple-600">{parameterStatuses[selectedParameter]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quality Summary Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Quality Summary</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Range
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Fat Content
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.fat.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.fat?.target || '3.8'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.fat?.min || '3.5'}% - {standards.fat?.max || '4.2'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(parameterStatuses.fat)}`}>
                    {parameterStatuses.fat}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Protein Content
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.protein.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.protein?.target || '3.3'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.protein?.min || '3.0'}% - {standards.protein?.max || '3.6'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(parameterStatuses.protein)}`}>
                    {parameterStatuses.protein}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Lactose Content
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.lactose.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.lactose?.target || '4.8'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.lactose?.min || '4.5'}% - {standards.lactose?.max || '5.0'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(parameterStatuses.lactose)}`}>
                    {parameterStatuses.lactose}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Somatic Cell Count
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.somatic.toFixed(0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {'< 150'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {'< ' + (standards.somatic?.max || '200')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(parameterStatuses.somatic)}`}>
                    {parameterStatuses.somatic}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const ReportsTab = ({ data }) => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState('last7');
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [format, setFormat] = useState('pdf');
    const [isGenerating, setIsGenerating] = useState(false);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
  
    // Initialize the reports table if needed and load existing reports
    useEffect(() => {
      const loadReports = async () => {
        setIsLoading(true);
        try {
          // First initialize the reports table if needed
          await initReportsTable();
          
          // Then fetch the reports
          const reportsList = await fetchReports();
          console.log('Loaded reports:', reportsList);
          
          // Filter out any malformed reports
          const validReports = reportsList.filter(report => 
            report && report.id && report.title
          );
          
          setReports(validReports);
        } catch (err) {
          console.error('Error loading reports:', err);
          setError('Failed to load reports. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
    
      loadReports();
    }, []);
  
    // Calculate date range based on selected option
    const getDateRange = () => {
      const now = new Date();
      let startDate, endDate;
    
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
          break;
        case 'last7':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'last30':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }
    
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    };
  
    // Handle report generation
    const handleGenerateReport = async () => {
      setIsGenerating(true);
      setError(null);
    
      try {
        // Validate custom date range if selected
        if (dateRange === 'custom') {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          
          if (isNaN(startDate) || isNaN(endDate)) {
            throw new Error('Please select valid dates');
          }
          
          if (startDate > endDate) {
            throw new Error('Start date must be before end date');
          }
          
          // Limit to reasonable range (e.g., 1 year)
          const oneYear = 365 * 24 * 60 * 60 * 1000;
          if (endDate - startDate > oneYear) {
            throw new Error('Date range cannot exceed 1 year');
          }
        }
        
        const { startDate, endDate } = getDateRange();
        console.log('Generating report for range:', { startDate, endDate, reportType, format });
    
        // Call the report generation service
        const result = await generateReport({
          reportType,
          dateRangeStart: startDate,
          dateRangeEnd: endDate,
          format
        });
    
        if (result && result.success) {
          // Refresh the reports list
          const updatedReports = await fetchReports();
          setReports(updatedReports);
          
          // Download the report file automatically
          if (result.fileData && result.fileName) {
            downloadReport(result.fileData, result.fileName, format);
            console.log('Report downloaded with filename:', result.fileName);
            
            // Show success message
            alert('Report generated and downloaded successfully!');
          } else {
            throw new Error('Generated report is missing file data');
          }
        } else {
          throw new Error(result?.error || 'Report generation failed');
        }
      } catch (err) {
        console.error('Error generating report:', err);
        setError(`Failed to generate report: ${err.message || 'Unknown error'}`);
      } finally {
        setIsGenerating(false);
      }
    };
  
    // Handle report deletion
    const handleDeleteReport = async (reportId) => {
      if (!window.confirm('Are you sure you want to delete this report?')) {
        return;
      }
    
      try {
        setIsLoading(true);
        console.log('Deleting report:', reportId);
        
        // Call the deleteReport service function
        const result = await deleteReport(reportId);
        
        if (result) {
          // Remove the deleted report from the state
          setReports(currentReports => 
            currentReports.filter(report => report.id !== reportId)
          );
          
          // Show success message
          alert('Report deleted successfully');
        } else {
          throw new Error('Failed to delete report');
        }
      } catch (err) {
        console.error('Error deleting report:', err);
        alert(`Failed to delete report: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const ReportPreview = ({ reportType }) => {
      return (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Report Preview</h3>
          
          {reportType === 'daily' && (
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Daily Production Report</strong> includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Total milk production summary</li>
                <li>Morning and evening collection totals</li>
                <li>Top producing cows</li>
                <li>Detailed collection records with dates</li>
              </ul>
            </div>
          )}
          
          {reportType === 'weekly' && (
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Weekly Summary Report</strong> includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Weekly production overview</li>
                <li>Daily breakdown with date and shift amounts</li>
                <li>Weekly averages and trends</li>
                <li>Top performing cows for the week</li>
              </ul>
            </div>
          )}
          
          {reportType === 'monthly' && (
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Monthly Analysis Report</strong> includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Monthly production summary</li>
                <li>Weekly breakdown throughout the month</li>
                <li>Top performing cows</li>
                <li>Daily and per-cow averages</li>
                <li>Production trends</li>
              </ul>
            </div>
          )}
          
          {reportType === 'quality' && (
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Quality Metrics Report</strong> includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Average fat, protein and lactose content</li>
                <li>Somatic cell and bacteria counts</li>
                <li>Daily quality trends</li>
                <li>Compliance with industry standards</li>
              </ul>
            </div>
          )}
          
          {reportType === 'compliance' && (
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Compliance Report</strong> includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Overall compliance rate</li>
                <li>Parameter-specific compliance percentages</li>
                <li>Detailed violations list</li>
                <li>Improvement recommendations</li>
              </ul>
            </div>
          )}
          
          <p className="mt-3 text-xs text-gray-500">The report will be generated in {reportType === 'daily' ? 'portrait' : 'landscape'} format and will include all data from the selected date range.</p>
        </div>
      );
    };
  
    // Handle report download
    const handleDownloadReport = async (report) => {
      try {
        setIsLoading(true);
        
        // Get the report by ID to retrieve the latest data
        const reportData = await getReportById(report.id);
        
        if (!reportData) {
          throw new Error('Report not found');
        }
        
        // Generate a new report on-demand with the same parameters
        const result = await generateReport({
          reportType: report.report_type,
          dateRangeStart: report.date_range_start,
          dateRangeEnd: report.date_range_end,
          format: report.format
        });
        
        if (result && result.success && result.fileData) {
          // Use the filename from the report record
          const fileName = report.file_path ? 
            report.file_path.split('/').pop() : 
            `report-${report.id}.${report.format}`;
          
          // Download the report
          downloadReport(result.fileData, fileName, report.format);
          console.log('Report downloaded:', fileName);
        } else {
          throw new Error('Failed to generate report file');
        }
      } catch (err) {
        console.error('Error downloading report:', err);
        alert(`Failed to download report: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
  
    // Format date for display
    const formatReportDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
  
    // Get the file icon based on format
    const getFormatIcon = (format) => {
      switch (format.toLowerCase()) {
        case 'pdf':
          return (
            <div className="w-10 h-12 bg-gradient-to-b from-red-50 to-red-100 border border-red-200 text-red-600 flex items-center justify-center rounded-lg shadow-sm">
              <FileType size={18} />
            </div>
          );
        case 'xlsx':
        case 'excel':
          return (
            <div className="w-10 h-12 bg-gradient-to-b from-green-50 to-green-100 border border-green-200 text-green-600 flex items-center justify-center rounded-lg shadow-sm">
              <FileSpreadsheet size={18} />
            </div>
          );
        case 'csv':
          return (
            <div className="w-10 h-12 bg-gradient-to-b from-blue-50 to-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center rounded-lg shadow-sm">
              <FileText size={18} />
            </div>
          );
        default:
          return (
            <div className="w-10 h-12 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center rounded-lg shadow-sm">
              <File size={18} />
            </div>
          );
      }
    };
  
    return (
      <div>
        {/* Report Generator Form */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 mb-6">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Generate Reports</h2>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="daily">Daily Production Report</option>
                  <option value="weekly">Weekly Summary Report</option>
                  <option value="monthly">Monthly Analysis Report</option>
                  <option value="quality">Quality Metrics Report</option>
                  <option value="compliance">Compliance Report</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  id="dateRange"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7">Last 7 days</option>
                  <option value="last30">Last 30 days</option>
                  <option value="thisMonth">This month</option>
                  <option value="lastMonth">Last month</option>
                  <option value="custom">Custom range...</option>
                </select>
              </div>
              
              {dateRange === 'custom' && (
                <>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      id="pdf"
                      name="format"
                      type="radio"
                      checked={format === 'pdf'}
                      onChange={() => setFormat('pdf')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="pdf" className="ml-2 block text-sm text-gray-700">
                      PDF
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="xlsx"
                      name="format"
                      type="radio"
                      checked={format === 'xlsx'}
                      onChange={() => setFormat('xlsx')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="xlsx" className="ml-2 block text-sm text-gray-700">
                      Excel
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="csv"
                      name="format"
                      type="radio"
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="csv" className="ml-2 block text-sm text-gray-700">
                      CSV
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add report preview component */}
            <ReportPreview reportType={reportType} />
            
            <div className="mt-6">
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Reports List */}
        {/* <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Recent Reports</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : reports.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {reports.map(report => (
                <li key={report.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getFormatIcon(report.format)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-800">{report.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center text-xs text-gray-500 gap-1">
                          <span className="bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-full px-2 py-0.5">
                            {report.report_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="mx-1">•</span>
                          <span>{formatReportDate(report.created_at)}</span>
                          <span className="mx-1">•</span>
                          <span>{report.file_size}</span>
                          <span className="mx-1">•</span>
                          <span className={`rounded-full px-2 py-0.5 ${
                            report.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : report.status === 'generating' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}>
                            {report.status === 'completed' ? 'Complete' : 
                            report.status === 'generating' ? 'Generating...' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDownloadReport(report)}
                        className="p-2 text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 rounded-lg shadow-sm transition-all duration-300"
                        title="Download"
                        disabled={report.status !== 'completed'}
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-white bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90 rounded-lg shadow-sm transition-all duration-300"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500 bg-gradient-to-r from-blue-50/20 via-gray-50/20 to-green-50/20 rounded-lg m-6">
              <div className="p-4 rounded-full bg-gray-50 inline-flex mb-4 border border-gray-100 shadow-sm">
                <Download className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-2">No reports found</p>
              <p className="text-sm text-gray-500">Generate a report to see it listed here.</p>
            </div>
          )}
        </div> */}
      </div>
    );
  };
  
  // Add Collection Modal Component
  const AddCollectionModal = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      totalQuantity: '',
      cowId: '',
      quality: 'Good',
      notes: '',
      sendWhatsAppNotification: false,
      fat: '',
      protein: '',
      lactose: '',
      somatic: '',
      bacteria: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [cows, setCows] = useState([]);
    const [isLoadingCows, setIsLoadingCows] = useState(true);
    
    // Load cows for dropdown
    useEffect(() => {
      const loadCows = async () => {
        try {
          const { data: cowsData, error } = await supabase
            .from('cows')
            .select('id, name, tag_number')
            .order('name');
          
          if (error) throw error;
          setCows(cowsData);
        } catch (error) {
          console.error('Error loading cows:', error);
          setError('Failed to load cows. Please try again.');
        } finally {
          setIsLoadingCows(false);
        }
      };
      
      loadCows();
    }, []);
    
    // Handle form field changes
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
    
    // Handle checkbox change
    const handleCheckboxChange = (e) => {
      setFormData({
        ...formData,
        sendWhatsAppNotification: e.target.checked
      });
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      
      try {
        // Validate required fields
        if (!formData.cowId || !formData.date || !formData.totalQuantity) {
          throw new Error("Please fill in all required fields");
        }
        
        // Prepare data for API
        const collectionData = {
          cowId: formData.cowId,
          date: formData.date,
          shift: formData.shift,
          totalQuantity: parseFloat(formData.totalQuantity),
          quality: formData.quality,
          notes: formData.notes,
          fat: formData.fat ? parseFloat(formData.fat) : null,
          protein: formData.protein ? parseFloat(formData.protein) : null,
          lactose: formData.lactose ? parseFloat(formData.lactose) : null,
          somatic: formData.somatic ? parseInt(formData.somatic) : null,
          bacteria: formData.bacteria ? parseInt(formData.bacteria) : null
        };  
        
        // Call the onAdd function that will use the milk service
        await onAdd(collectionData);
        
        // Handle WhatsApp notification if enabled
        if (formData.sendWhatsAppNotification) {
          console.log('Would send WhatsApp notification here');
          // In a real app, you'd implement a notification service
        }
        
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        setError('Failed to record milk collection. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
          <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Record Milk Collection</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-6">
              {/* Cow Selection */}
              <div>
                <label htmlFor="cowId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cow *
                </label>
                {isLoadingCows ? (
                  <div className="py-2">Loading cows...</div>
                ) : (
                  <select
                    id="cowId"
                    name="cowId"
                    value={formData.cowId}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Select a cow</option>
                    {cows.map(cow => (
                      <option key={cow.id} value={cow.id}>
                        {cow.name} ({cow.tag_number})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                    Shift *
                  </label>
                  <select
                    id="shift"
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Quantity (L) *
                </label>
                <input
                  type="number"
                  id="totalQuantity"
                  name="totalQuantity"
                  value={formData.totalQuantity}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">
                  Quality
                </label>
                <select
                  id="quality"
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              
              {/* Quality Parameters - Same as in Edit form */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quality Parameters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-1">
                      Fat (%)
                    </label>
                    <input
                      type="number"
                      id="fat"
                      name="fat"
                      value={formData.fat}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">
                      Protein (%)
                    </label>
                    <input
                      type="number"
                      id="protein"
                      name="protein"
                      value={formData.protein}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lactose" className="block text-sm font-medium text-gray-700 mb-1">
                      Lactose (%)
                    </label>
                    <input
                      type="number"
                      id="lactose"
                      name="lactose"
                      value={formData.lactose}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="somatic" className="block text-sm font-medium text-gray-700 mb-1">
                      Somatic Cell Count (thousands/ml)
                    </label>
                    <input
                      type="number"
                      id="somatic"
                      name="somatic"
                      value={formData.somatic}
                      onChange={handleChange}
                      min="0"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bacteria" className="block text-sm font-medium text-gray-700 mb-1">
                      Bacteria Count (CFU/ml)
                    </label>
                    <input
                      type="number"
                      id="bacteria"
                      name="bacteria"
                      value={formData.bacteria}
                      onChange={handleChange}
                      min="0"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Any additional notes about this collection..."
                ></textarea>
              </div>
              
              <div className="flex items-center mt-4 p-3 bg-gradient-to-r from-blue-50/40 via-gray-50 to-green-50/30 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    id="sendWhatsAppNotification"
                    name="sendWhatsAppNotification"
                    type="checkbox"
                    checked={formData.sendWhatsAppNotification}
                    onChange={handleCheckboxChange}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="sendWhatsAppNotification" className="font-medium text-gray-700">Send WhatsApp notification to cow owner</label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default MilkProduction;