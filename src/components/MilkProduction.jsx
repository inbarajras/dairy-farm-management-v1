import React, { useState, useEffect } from 'react';
import { Calendar, Droplet, Filter, Search, ChevronLeft, ChevronRight, BarChart2, Download, Plus, ThermometerSun, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for milk production
const mockMilkData = {
  dailyCollections: [
    {
      id: 'MC001',
      date: '2023-04-26',
      shift: 'Morning',
      totalQuantity: 427,
      qualityParameters: {
        fat: 3.8,
        protein: 3.2,
        lactose: 4.7,
        somatic: 175,
        bacteria: 15000
      },
      collectedBy: 'John Doe',
      status: 'Completed',
      notes: 'Regular collection'
    },
    {
      id: 'MC002',
      date: '2023-04-26',
      shift: 'Evening',
      totalQuantity: 385,
      qualityParameters: {
        fat: 3.7,
        protein: 3.3,
        lactose: 4.6,
        somatic: 180,
        bacteria: 16000
      },
      collectedBy: 'Jane Smith',
      status: 'Completed',
      notes: ''
    },
    {
      id: 'MC003',
      date: '2023-04-25',
      shift: 'Morning',
      totalQuantity: 430,
      qualityParameters: {
        fat: 3.9,
        protein: 3.2,
        lactose: 4.8,
        somatic: 170,
        bacteria: 14000
      },
      collectedBy: 'John Doe',
      status: 'Completed',
      notes: ''
    },
    {
      id: 'MC004',
      date: '2023-04-25',
      shift: 'Evening',
      totalQuantity: 390,
      qualityParameters: {
        fat: 3.8,
        protein: 3.1,
        lactose: 4.7,
        somatic: 175,
        bacteria: 15000
      },
      collectedBy: 'Jane Smith',
      status: 'Completed',
      notes: ''
    },
    {
      id: 'MC005',
      date: '2023-04-24',
      shift: 'Morning',
      totalQuantity: 425,
      qualityParameters: {
        fat: 3.7,
        protein: 3.2,
        lactose: 4.6,
        somatic: 185,
        bacteria: 16000
      },
      collectedBy: 'John Doe',
      status: 'Completed',
      notes: ''
    },
    {
      id: 'MC006',
      date: '2023-04-24',
      shift: 'Evening',
      totalQuantity: 380,
      qualityParameters: {
        fat: 3.6,
        protein: 3.1,
        lactose: 4.5,
        somatic: 190,
        bacteria: 17000
      },
      collectedBy: 'Jane Smith',
      status: 'Completed',
      notes: 'Slight decrease in production'
    }
  ],
  monthlyTotals: [
    { month: 'Jan', quantity: 24150 },
    { month: 'Feb', quantity: 23000 },
    { month: 'Mar', quantity: 26500 },
    { month: 'Apr', quantity: 25800 }
  ],
  qualityTrends: [
    { date: '2023-04-20', fat: 3.7, protein: 3.1, lactose: 4.6 },
    { date: '2023-04-21', fat: 3.8, protein: 3.2, lactose: 4.7 },
    { date: '2023-04-22', fat: 3.7, protein: 3.2, lactose: 4.6 },
    { date: '2023-04-23', fat: 3.6, protein: 3.1, lactose: 4.5 },
    { date: '2023-04-24', fat: 3.7, protein: 3.2, lactose: 4.6 },
    { date: '2023-04-25', fat: 3.8, protein: 3.2, lactose: 4.7 },
    { date: '2023-04-26', fat: 3.8, protein: 3.3, lactose: 4.7 }
  ],
  qualityStandards: {
    fat: { min: 3.5, target: 3.8, max: 4.2 },
    protein: { min: 3.0, target: 3.3, max: 3.6 },
    lactose: { min: 4.5, target: 4.8, max: 5.0 },
    somatic: { max: 200 }, // cells/ml in thousands
    bacteria: { max: 20000 } // CFU/ml
  },
  alerts: [
    {
      id: 'A001',
      date: '2023-04-24',
      type: 'quality',
      parameter: 'somatic',
      value: 190,
      message: 'Somatic cell count nearing upper limit',
      severity: 'warning'
    }
  ]
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

const getTotal = (data) => {
  return data.reduce((sum, record) => sum + record.totalQuantity, 0);
};

const getAverageQuality = (data, parameter) => {
  return data.reduce((sum, record) => sum + record.qualityParameters[parameter], 0) / data.length;
};

// Main milk production component
const MilkProduction = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState('week');
  const [milkData, setMilkData] = useState(mockMilkData);
  
  // Filter data based on date range
  const getFilteredData = () => {
    const today = new Date();
    let startDate;
    
    switch(dateRange) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      default:
        startDate = new Date(today.setDate(today.getDate() - 7));
    }
    
    return milkData.dailyCollections.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate;
    });
  };
  
  const filteredData = getFilteredData();
  
  // Calculate statistics
  const totalMilk = getTotal(filteredData);
  const avgFat = getAverageQuality(filteredData, 'fat');
  const avgProtein = getAverageQuality(filteredData, 'protein');
  
  // Prepare chart data
  const prepareChartData = () => {
    // Group by date and calculate totals for each day
    const groupedByDate = {};
    
    filteredData.forEach(record => {
        if (!groupedByDate[record.date]) {
          groupedByDate[record.date] = {
            date: record.date,
            displayDate: formatShortDate(record.date),
            totalQuantity: 0
          };
        }
        groupedByDate[record.date].totalQuantity += record.totalQuantity;
      });
      
      return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
    };
    
    const chartData = prepareChartData();
    
    // Toggle add modal
    const toggleAddModal = () => {
      setIsAddModalOpen(!isAddModalOpen);
    };
    
    return (
      <div className="h-full bg-gray-100">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Milk Production</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                    ? 'border-green-500 text-green-600'
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
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
            
            <div className="flex items-center ml-4">
              <button className="p-1 rounded-full hover:bg-gray-200">
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <span className="mx-2 text-sm font-medium">{formatShortDate(new Date())}</span>
              <button className="p-1 rounded-full hover:bg-gray-200">
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
              
              {/* Alerts Section */}
              {milkData.alerts.length > 0 && (
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
              )}
              
              {/* Production Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Daily Milk Production</h2>
                  <button className="text-sm text-gray-500 flex items-center">
                    <Download size={16} className="mr-1" />
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
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Collections</h2>
                  <button
                    onClick={() => setActiveTab('collections')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {milkData.dailyCollections.slice(0, 4).map(collection => (
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
                          <p className="text-xs text-gray-500">Fat: {collection.qualityParameters.fat}% | Protein: {collection.qualityParameters.protein}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
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
          <AddCollectionModal onClose={toggleAddModal} />
        )}
      </div>
    );
  };
  
  // Collections Tab Component
  const CollectionsTab = ({ data }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    // Filter and search collections
    const filteredCollections = data.filter(collection => {
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
            
            <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
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
              {currentItems.map(collection => (
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
                      <span>Fat: {collection.qualityParameters.fat}%</span>
                      <span>Protein: {collection.qualityParameters.protein}%</span>
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
                    <a href="#" className="text-green-600 hover:text-green-900 mr-4">View</a>
                    <a href="#" className="text-blue-600 hover:text-blue-900 mr-4">Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === page ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Quality Analysis Tab Component
  const QualityAnalysisTab = ({ data }) => {
    const [selectedParameter, setSelectedParameter] = useState('fat');
    const [dateRange, setDateRange] = useState('week');
    
    const qualityTrends = data.qualityTrends;
    const standards = data.qualityStandards;
    
    // Calculate current averages
    const calculateAverage = (parameter) => {
      return qualityTrends.reduce((sum, record) => sum + record[parameter], 0) / qualityTrends.length;
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
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fat
              </button>
              <button
                onClick={() => setSelectedParameter('protein')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  selectedParameter === 'protein' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Protein
              </button>
              <button
                onClick={() => setSelectedParameter('lactose')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  selectedParameter === 'lactose' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lactose
              </button>
            </div>
          </div>
          
          {/* Selected Parameter Chart */}
          <div className="h-80">
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
  
  // Reports Tab Component
  const ReportsTab = ({ data }) => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState('last7');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Handle report generation
    const generateReport = () => {
      setIsGenerating(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        setIsGenerating(false);
        alert('Report generated successfully!');
      }, 1500);
    };
    
    return (
      <div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Reports</h2>
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
                    defaultChecked
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="pdf" className="ml-2 block text-sm text-gray-700">
                    PDF
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="excel"
                    name="format"
                    type="radio"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <label htmlFor="excel" className="ml-2 block text-sm text-gray-700">
                    Excel
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="csv"
                    name="format"
                    type="radio"
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
              onClick={generateReport}
              disabled={isGenerating}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
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
        
        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Recent Reports</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            <ReportItem 
              title="Monthly Analysis Report - April 2023"
              type="Monthly Analysis"
              date="2023-04-26"
              format="PDF"
              size="1.2 MB"
            />
            <ReportItem 
              title="Weekly Summary Report - Week 16, 2023"
              type="Weekly Summary"
              date="2023-04-24"
              format="Excel"
              size="856 KB"
            />
            <ReportItem 
              title="Quality Metrics Report - March 2023"
              type="Quality Metrics"
              date="2023-04-05"
              format="PDF"
              size="1.5 MB"
            />
            <ReportItem 
              title="Compliance Report - Q1 2023"
              type="Compliance"
              date="2023-04-02"
              format="PDF"
              size="2.1 MB"
            />
            <ReportItem 
              title="Monthly Analysis Report - March 2023"
              type="Monthly Analysis"
              date="2023-03-31"
              format="PDF"
              size="1.3 MB"
            />
          </ul>
        </div>
      </div>
    );
  };
  
  // Report Item Component
  const ReportItem = ({ title, type, date, format, size }) => {
    return (
      <li className="px-6 py-4 hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {format === 'PDF' ? (
                <div className="w-10 h-12 bg-red-100 text-red-600 flex items-center justify-center rounded">
                  <span className="text-xs font-medium">PDF</span>
                </div>
              ) : format === 'Excel' ? (
                <div className="w-10 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded">
                  <span className="text-xs font-medium">XLS</span>
                </div>
              ) : (
                <div className="w-10 h-12 bg-blue-100 text-blue-600 flex items-center justify-center rounded">
                  <span className="text-xs font-medium">CSV</span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-800">{title}</h3>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span>{type}</span>
                <span className="mx-1">•</span>
                <span>{formatDate(date)}</span>
                <span className="mx-1">•</span>
                <span>{size}</span>
              </div>
            </div>
          </div>
          <div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
              <Download size={16} />
            </button>
          </div>
        </div>
      </li>
    );
  };
  
  // Add Collection Modal Component
  const AddCollectionModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      totalQuantity: '',
      fat: '',
      protein: '',
      lactose: '',
      somatic: '',
      bacteria: '',
      collectedBy: '',
      sendWhatsAppNotification: false,
      notes: ''
    });
    
    // Handle form field changes
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        // 1. Save the milk collection record
        console.log('Recording milk collection:', formData);
        
        // This would be an API call in a real implementation
        // const response = await fetch('/api/milk-collections', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(formData)
        // });
        
        // 2. If WhatsApp notification is enabled, send notification
        if (formData.sendWhatsAppNotification) {
          // In a real implementation, fetch the cow owner details based on the cow
          // For example, if you know which cow the milk is from:
          
          // Get the cow owner information from a database/API
          // This is a mock example - you'd need to implement the actual data fetching
          const cowOwnerData = {
            name: "John Smith", // The cow owner's name
            phoneNumber: "+15551234567" // The cow owner's WhatsApp number
          };
          
          const notificationResult = sendWhatsAppNotification(formData, cowOwnerData);
          
          if (notificationResult.success) {
            console.log('Notification sent successfully');
          } else {
            console.error('Failed to send notification:', notificationResult.message);
          }
        }
        
        // Show success message
        alert(formData.sendWhatsAppNotification 
          ? 'Milk collection recorded and notification sent!'
          : 'Milk collection recorded successfully!');
        
        // Close the modal
        onClose();
      } catch (error) {
        console.error('Error recording milk collection:', error);
        alert('Failed to record milk collection. Please try again.');
      }
    };

    // WhatsApp notification service
    const sendWhatsAppNotification = async (collectionData, cowOwnerData) => {
      try {
        console.log('Sending WhatsApp notification for milk collection:', collectionData);
        
        // In a real implementation, make an API call to your WhatsApp service (like Twilio)
        // Example:
        const message = `Hello ${cowOwnerData.name}, your cow's milk collection for ${collectionData.date} (${collectionData.shift} shift) has been recorded. Quantity: ${collectionData.totalQuantity}L.`;
        
        // Mock API call for demonstration
        /*
        const response = await fetch('https://api.yourmessagingservice.com/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_AUTH_TOKEN'
          },
          body: JSON.stringify({
            to: `whatsapp:${cowOwnerData.phoneNumber}`, // Format required by most WhatsApp APIs
            from: 'whatsapp:+15551234567',  // Your WhatsApp business number
            body: message
          })
        });
        
        const result = await response.json();
        */
        
        // For demo, log the notification details
        console.log('WhatsApp message:', message);
        console.log('WhatsApp notification would be sent to:', cowOwnerData.phoneNumber);
        
        // Return success
        return { success: true, message: 'Notification sent successfully' };
      } catch (error) {
        console.error('Failed to send WhatsApp notification:', error);
        return { success: false, message: error.message };
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
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
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
                <label htmlFor="collectedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Collected By *
                </label>
                <input
                  type="text"
                  id="collectedBy"
                  name="collectedBy"
                  value={formData.collectedBy}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center mt-4">
                <input
                  id="sendWhatsAppNotification"
                  name="sendWhatsAppNotification"
                  type="checkbox"
                  checked={formData.sendWhatsAppNotification}
                  onChange={(e) => setFormData({
                    ...formData,
                    sendWhatsAppNotification: e.target.checked
                  })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="sendWhatsAppNotification" className="ml-2 block text-sm text-gray-700">
                  Send WhatsApp notification to cow owner
                </label>
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default MilkProduction;