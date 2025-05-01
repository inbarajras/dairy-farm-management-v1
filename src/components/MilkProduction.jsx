import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Droplet, Filter, Search, ChevronLeft, ChevronRight, BarChart2, Download, Plus, ThermometerSun, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  initReportsTable, 
  fetchReports, 
  generateReport, 
  deleteReport, 
  downloadReport 
} from './services/reportService';
import { saveAs } from 'file-saver';



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
    return data.reduce((sum, record) => sum + (record.totalQuantity || 0), 0);
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

    // Group by date and calculate totals for each day
    const groupedByDate = {};
    
    filteredData.forEach(record => {
      if (!record.date) return; // Skip records with no date
      
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = {
          date: record.date,
          displayDate: formatShortDate(record.date),
          totalQuantity: 0
        };
      }
      groupedByDate[record.date].totalQuantity += record.totalQuantity || 0;
    });
    
    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
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

  return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-green-50">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Milk Production</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 text-white rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'dashboard'
                    ? 'border-green-500 text-green-600 bg-gradient-to-b from-white to-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'collections'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                  activeTab === 'quality'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quality Analysis
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
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
            className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
          
          <div className="flex items-center ml-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="mx-2 text-sm font-medium">
              {dateRange === 'today' 
                ? formatShortDate(currentDate) 
                : dateRange === 'week'
                ? `${formatShortDate(new Date(currentDate.getTime() - 6 * 24 * 60 * 60 * 1000))} - ${formatShortDate(currentDate)}`
                : `${formatShortDate(new Date(currentDate.getTime() - 29 * 24 * 60 * 60 * 1000))} - ${formatShortDate(currentDate)}`
              }
            </span>
            <button 
              onClick={() => navigateDate('next')}
              className={`p-1 rounded-full ${
                isCurrentDateToday() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
              }`}
              disabled={isCurrentDateToday()}
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div className="bg-white rounded-lg shadow-sm p-6 bg-gradient-to-br from-white to-green-50">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Milk Production</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">{totalMilk} L</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <Droplet size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>+2% from previous period</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Fat Content</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">{avgFat.toFixed(1)}%</p>
                    </div>
                    <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                      <ThermometerSun size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600 flex items-center">
                    <span>Target: {milkData.qualityStandards.fat.target}%</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Protein Content</p>
                      <p className="text-2xl font-semibold text-gray-800 mt-1">{avgProtein.toFixed(1)}%</p>
                    </div>
                    <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                      <BarChart2 size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600 flex items-center">
                    <span>Target: {milkData.qualityStandards.protein.target}%</span>
                  </div>
                </div>
              </div>
              
              {/* Alerts Section
              {Array.isArray(milkData.alerts) && milkData.alerts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h3 className="text-amber-800 font-medium flex items-center mb-2">
                    <AlertTriangle size={18} className="mr-2" />
                    Alerts
                  </h3>
                  <div className="space-y-2">
                    {milkData.alerts.map(alert => (
                      <div key={alert.id} className="flex items-start text-amber-700 text-sm">
                        <span className="mr-2">•</span>
                        <div>
                          <p>{alert.message}</p>
                          <p className="text-xs mt-1 text-amber-600">{formatDate(alert.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
              
              {/* Production Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Daily Milk Production</h2>
                  <button 
                    onClick={() => handleDownload(chartData, `milk-collections-${new Date().toISOString().slice(0, 10)}.csv`, 'csv')}
                    className="text-sm text-white flex items-center px-3 py-2 rounded-md bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
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
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                      />
                      <Bar dataKey="totalQuantity" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Recent Collections */}
              <div className="divide-y divide-gray-200">
                {milkData.dailyCollections.length > 0 ? (
                  milkData.dailyCollections.slice(0, 4).map(collection => (
                    <div key={collection.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Droplet size={16} className="text-blue-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-800">
                              {collection.shift} Collection - {formatDate(collection.date)}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Collected by: {collection.collectedBy}
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
        
        {/* Add Collection Modal - Updated to use Supabase */}
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
      try {
        // Update the collections list to reflect changes
        const updatedCollectionsList = collectionsList.map(item => 
          item.id === updatedCollection.id ? updatedCollection : item
        );
        setCollectionsList(updatedCollectionsList);
        setIsEditModalOpen(false);
      } catch (error) {
        console.error('Error updating collection:', error);
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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Collections</option>
                <option value="morning">Morning Only</option>
                <option value="evening">Evening Only</option>
              </select>
            </div>
            
            <button 
              onClick={() => handleDownload(filteredCollections, `milk-collections-${new Date().toISOString().split('T')[0]}.csv`, 'csv')}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
        
        {/* Collections Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                <tr key={collection.id} className="hover:bg-gray-50">
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
                      {collection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewCollection(collection)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditCollection(collection)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCollection(collection)}
                      className="text-red-600 hover:text-red-900"
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
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === page ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronRight size={16} />
            </button>
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
  
  // Add the Delete Confirmation Modal component
  const DeleteConfirmationModal = ({ collection, onClose, onConfirm, isLoading }) => {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Delete Collection</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500" disabled={isLoading}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="px-6 py-4">
            <div className="text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="text-gray-700 text-center">
              Are you sure you want to delete this milk collection record?
            </p>
            <div className="mt-2 text-sm text-gray-500 text-center">
              <p>Collection date: {formatDate(collection.date)}</p>
              <p>Quantity: {collection.totalQuantity} L</p>
              <p>This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

  const ViewCollectionModal = ({ collection, onClose }) => {
    if (!collection) {
      return null;
    }
    
    const qualityParams = collection.qualityParameters || {};
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Collection Details - {collection.id}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
                <p className="mt-1 text-sm text-gray-900">{collection.totalQuantity} L</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Collected By</p>
                <p className="mt-1 text-sm text-gray-900">{collection.collectedBy}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500">Quality Parameters</p>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Fat</p>
                    <p className="text-sm text-gray-900">{qualityParams.fat || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Protein</p>
                    <p className="text-sm text-gray-900">{qualityParams.protein || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lactose</p>
                    <p className="text-sm text-gray-900">{qualityParams.lactose || 'N/A'}%</p>
                  </div>
                </div>
              </div>
              {collection.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900">{collection.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Edit Collection Modal
 // Fix for the EditCollectionModal component
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
      // Prepare data for Supabase update
      const dataToUpdate = {
        date: formData.date,
        amount: parseFloat(formData.totalQuantity),
        shift: formData.shift,
        quality: formData.quality || 'Good',
        notes: formData.notes
      };
      
      // First, update the database record
      const result = await updateMilkCollection(collection.id, dataToUpdate);
      
      if (!result) throw new Error("Failed to update the collection in the database");
      
      // Then prepare the updated collection object for the UI update
      const updatedCollection = {
        ...collection,
        ...dataToUpdate,
        totalQuantity: parseFloat(formData.totalQuantity), // Ensure we update with the right property name
        qualityParameters: {
          fat: formData.fat ? parseFloat(formData.fat) : null,
          protein: formData.protein ? parseFloat(formData.protein) : null,
          lactose: formData.lactose ? parseFloat(formData.lactose) : null,
          somatic: formData.somatic ? parseInt(formData.somatic) : null,
          bacteria: formData.bacteria ? parseInt(formData.bacteria) : null
        }
      };
      
      // Pass the updated collection back to the parent component for UI update
      onSave(updatedCollection);
    } catch (err) {
      setError("Failed to update collection. Please try again.");
      console.error("Error updating collection:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
      
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Edit Collection - {collection.id}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
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
                  placeholder="Any additional information about this collection..."
                ></textarea>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
    
    const qualityTrends = data.qualityTrends || [];
    const standards = data.qualityStandards || defaultStandards;
    
    // Check if we have data to display
    const hasQualityData = qualityTrends.length > 0;
    
    // Calculate current averages safely
    const calculateAverage = (parameter) => {
      if (!hasQualityData) return 0;
      return qualityTrends.reduce((sum, record) => sum + (record[parameter] || 0), 0) / qualityTrends.length;
    };
    
    const currentAverages = {
      fat: calculateAverage('fat'),
      protein: calculateAverage('protein'),
      lactose: calculateAverage('lactose')
    };
    
    return (
      <div>
        {/* Parameter Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Milk Quality Analysis</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedParameter('fat')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  selectedParameter === 'fat' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fat
              </button>
              <button
                onClick={() => setSelectedParameter('protein')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  selectedParameter === 'protein' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Protein
              </button>
              <button
                onClick={() => setSelectedParameter('lactose')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  selectedParameter === 'lactose' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lactose
              </button>
            </div>
          </div>
          
          {/* Selected Parameter Chart */}
          <div className="h-80">
            {hasQualityData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => formatShortDate(date)}
                />
                <YAxis domain={[
                  standards[selectedParameter].min * 0.9,
                  standards[selectedParameter].max * 1.1
                ]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, selectedParameter.charAt(0).toUpperCase() + selectedParameter.slice(1)]}
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                  labelFormatter={(date) => formatDate(date)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={selectedParameter} 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {standards[selectedParameter].min && (
                  <span className="text-xs text-gray-500">Min: {standards[selectedParameter].min}%</span>
                )}
                {standards[selectedParameter].target && (
                  <span className="text-xs text-gray-500">Target: {standards[selectedParameter].target}%</span>
                )}
                {standards[selectedParameter].max && (
                  <span className="text-xs text-gray-500">Max: {standards[selectedParameter].max}%</span>
                )}
              </LineChart>
            </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No quality trend data available for the selected period.
                </div>
              )}
            </div>
          
          {/* Parameter Details */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {selectedParameter.charAt(0).toUpperCase() + selectedParameter.slice(1)} Content Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Current Average</p>
                <p className="text-xl font-semibold text-gray-800">{currentAverages[selectedParameter].toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Target Range</p>
                <p className="text-xl font-semibold text-gray-800">
                  {standards[selectedParameter].min}% - {standards[selectedParameter].max}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-xl font-semibold text-green-600">Within Range</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quality Summary Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Quality Summary</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Fat Content
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.fat.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.fat.target}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.fat.min}% - {standards.fat.max}%
                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Good
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Lactose Content
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {currentAverages.lactose.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.lactose.target}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {standards.lactose.min}% - {standards.lactose.max}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Good
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Somatic Cell Count
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  178 thousand/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  &lt; 200 thousand/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  0 - {standards.somatic.max} thousand/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                    Warning
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Bacteria Count
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  15,000 CFU/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  &lt; 20,000 CFU/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  0 - {standards.bacteria.max} CFU/ml
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Good
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
          await initReportsTable(); // Ensure the reports table exists
          const reportsList = await fetchReports();
          setReports(reportsList);
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
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'last7':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'last30':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'custom':
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
        const { startDate, endDate } = getDateRange();
  
        // Call the report generation service
        const result = await generateReport({
          reportType,
          dateRangeStart: startDate,
          dateRangeEnd: endDate,
          format
        });
  
        if (result.success) {
          // Refresh reports list
          const updatedReports = await fetchReports();
          setReports(updatedReports);
  
          // Download the generated report
          downloadReport(result.fileData, result.fileName, format);
          
          // Show success message
          alert('Report generated and downloaded successfully!');
        } else {
          throw new Error('Failed to generate report');
        }
      } catch (err) {
        console.error('Error generating report:', err);
        setError(`Failed to generate report: ${err.message}`);
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
        await deleteReport(reportId);
        // Refresh the reports list
        const updatedReports = await fetchReports();
        setReports(updatedReports);
      } catch (err) {
        console.error('Error deleting report:', err);
        alert('Failed to delete report. Please try again.');
      }
    };
  
    // Handle report download
    const handleDownloadReport = async (report) => {
      try {
        // In a real app, you would fetch the actual file from storage
        // Here we'll create a mock file based on the report format
        const mockContent = `This is a sample ${report.report_type} report content.\nTitle: ${report.title}\nGenerated on: ${report.created_at}`;
        let blob;
        
        switch (report.format.toLowerCase()) {
          case 'pdf':
            // For demo purposes we're creating a text file with .pdf extension
            blob = new Blob([mockContent], { type: 'application/pdf' });
            break;
          case 'xlsx':
            blob = new Blob([mockContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            break;
          case 'csv':
            blob = new Blob([mockContent], { type: 'text/csv' });
            break;
          default:
            blob = new Blob([mockContent], { type: 'text/plain' });
        }
        
        // Use file-saver to download the blob
        saveAs(blob, report.file_path.split('/').pop() || `report-${report.id}.${report.format}`);
      } catch (err) {
        console.error('Error downloading report:', err);
        alert('Failed to download report. Please try again.');
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
            <div className="w-10 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded">
              <span className="text-xs font-medium">PDF</span>
            </div>
          );
        case 'xlsx':
          return (
            <div className="w-10 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded">
              <span className="text-xs font-medium">XLS</span>
            </div>
          );
        case 'csv':
          return (
            <div className="w-10 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded">
              <span className="text-xs font-medium">CSV</span>
            </div>
          );
        default:
          return (
            <div className="w-10 h-12 bg-gray-100 text-gray-600 flex items-center justify-center rounded">
              <span className="text-xs font-medium">FILE</span>
            </div>
          );
      }
    };
  
    return (
      <div>
        {/* Report Generator Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Reports</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </>
            )}
            
            <div className="md:col-span-2">
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
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
          
          <div className="mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : reports.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {reports.map(report => (
                <li key={report.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getFormatIcon(report.format)}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-800">{report.title}</h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{report.report_type.replace('_', ' ').charAt(0).toUpperCase() + report.report_type.replace('_', ' ').slice(1)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatReportDate(report.created_at)}</span>
                          <span className="mx-1">•</span>
                          <span>{report.file_size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleDownloadReport(report)}
                        className="p-2 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-full"
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
            <div className="px-6 py-12 text-center text-gray-500">
              No reports found. Generate a report to see it listed here.
            </div>
          )}
        </div>
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
      
      if (!formData.cowId) {
        setError('Please select a cow');
        return;
      }
      
      try {
        setIsSubmitting(true);
        setError(null);
        
        // Prepare data for submission
        const collectionData = {
          cowId: formData.cowId,
          date: formData.date,
          totalQuantity: parseFloat(formData.totalQuantity),
          shift: formData.shift,
          quality: formData.quality,
          notes: formData.notes,
          qualityParameters: {
            fat: formData.fat ? parseFloat(formData.fat) : null,
            protein: formData.protein ? parseFloat(formData.protein) : null,
            lactose: formData.lactose ? parseFloat(formData.lactose) : null,
            somatic: formData.somatic ? parseInt(formData.somatic) : null,
            bacteria: formData.bacteria ? parseInt(formData.bacteria) : null
          }
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
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Record Milk Collection</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isSubmitting}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
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
              
              <div className="flex items-center mt-4">
                <input
                  id="sendWhatsAppNotification"
                  name="sendWhatsAppNotification"
                  type="checkbox"
                  checked={formData.sendWhatsAppNotification}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="sendWhatsAppNotification" className="ml-2 block text-sm text-gray-700">
                  Send WhatsApp notification to cow owner
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
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