import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Calendar, Clipboard, AlertTriangle, ChevronLeft, ChevronRight, Thermometer, Heart, AlertCircle, MoreHorizontal, Download, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for cow health
const mockHealthData = {
  healthEvents: [
    {
      id: 'HE001',
      cowId: 'C001',
      cowName: 'Daisy',
      cowTag: 'A128',
      eventType: 'Vaccination',
      eventDate: '2023-04-22',
      description: 'Annual vaccination administered',
      performedBy: 'Dr. Smith',
      medications: [
        { name: 'BVD Vaccine', dosage: '5ml', method: 'Injection' }
      ],
      notes: 'Cow handled well, no adverse reactions',
      followUp: '2024-04-22',
      status: 'Completed'
    },
    {
      id: 'HE002',
      cowId: 'C003',
      cowName: 'Buttercup',
      cowTag: 'C215',
      eventType: 'Treatment',
      eventDate: '2023-04-20',
      description: 'Treatment for mastitis',
      performedBy: 'Dr. Johnson',
      medications: [
        { name: 'Antibiotics', dosage: '10ml', method: 'Injection' },
        { name: 'Anti-inflammatory', dosage: '5ml', method: 'Injection' }
      ],
      notes: 'Detected during morning milking. Moderate case in right rear quarter',
      followUp: '2023-04-27',
      status: 'In progress'
    },
    {
      id: 'HE003',
      cowId: 'C005',
      cowName: 'Luna',
      cowTag: 'E162',
      eventType: 'Regular Checkup',
      eventDate: '2023-04-20',
      description: 'Scheduled health check',
      performedBy: 'Dr. Smith',
      medications: [],
      notes: 'All vitals normal, but milk production has decreased. Will monitor closely',
      followUp: '2023-05-04',
      status: 'Monitoring'
    },
    {
      id: 'HE004',
      cowId: 'C004',
      cowName: 'Millie',
      cowTag: 'D073',
      eventType: 'Hoof Trimming',
      eventDate: '2023-04-15',
      description: 'Regular hoof maintenance',
      performedBy: 'Mike Peterson',
      medications: [],
      notes: 'Slight inflammation on front left hoof. Applied topical cream',
      followUp: '',
      status: 'Completed'
    },
    {
      id: 'HE005',
      cowId: 'C003',
      cowName: 'Buttercup',
      cowTag: 'C215',
      eventType: 'Examination',
      eventDate: '2023-04-10',
      description: 'Suspected mastitis',
      performedBy: 'Dr. Johnson',
      medications: [],
      notes: 'Early signs of mastitis detected. Milk sample sent to lab for confirmation',
      followUp: '2023-04-15',
      status: 'Completed'
    }
  ],
  vaccinationSchedule: [
    {
      id: 'VS001',
      cowId: 'C004',
      cowName: 'Millie',
      cowTag: 'D073',
      vaccinationType: 'Annual Booster',
      dueDate: '2023-05-01',
      status: 'Scheduled',
      assignedTo: 'Dr. Smith'
    },
    {
      id: 'VS002',
      cowId: 'C002',
      cowName: 'Bella',
      cowTag: 'B094',
      vaccinationType: 'Annual Booster',
      dueDate: '2023-05-10',
      status: 'Scheduled',
      assignedTo: 'Dr. Johnson'
    }
  ],
  healthStats: {
    activeCases: 2,
    scheduledCheckups: 3,
    treatedLastMonth: 8,
    totalVaccinations: 15,
    commonIssues: [
      { name: 'Mastitis', count: 4 },
      { name: 'Lameness', count: 3 },
      { name: 'Respiratory', count: 2 },
      { name: 'Digestive', count: 2 },
      { name: 'Other', count: 5 }
    ],
    monthlyData: [
      { month: 'Jan', treatments: 12, checkups: 25 },
      { month: 'Feb', treatments: 8, checkups: 22 },
      { month: 'Mar', treatments: 10, checkups: 24 },
      { month: 'Apr', treatments: 8, checkups: 26 }
    ]
  },
  medications: [
    { 
      id: 'M001', 
      name: 'BVD Vaccine', 
      type: 'Vaccine', 
      stock: 45, 
      unit: 'doses', 
      expirationDate: '2023-12-15',
      supplier: 'VetSupply Inc.'
    },
    { 
      id: 'M002', 
      name: 'Mastitis Treatment', 
      type: 'Antibiotic', 
      stock: 12, 
      unit: 'tubes', 
      expirationDate: '2023-10-30',
      supplier: 'AnimalHealth Co.'
    },
    { 
      id: 'M003', 
      name: 'Anti-inflammatory', 
      type: 'Pain relief', 
      stock: 8, 
      unit: 'bottles', 
      expirationDate: '2023-11-20',
      supplier: 'VetSupply Inc.'
    },
    { 
      id: 'M004', 
      name: 'Hoof Treatment', 
      type: 'Topical', 
      stock: 3, 
      unit: 'containers', 
      expirationDate: '2024-01-15',
      supplier: 'FarmMed Ltd.'
    },
    { 
      id: 'M005', 
      name: 'Broad Spectrum Antibiotic', 
      type: 'Antibiotic', 
      stock: 5, 
      unit: 'bottles', 
      expirationDate: '2023-08-10',
      supplier: 'AnimalHealth Co.'
    }
  ]
};

// Status badge colors
const statusColors = {
  'Completed': 'bg-green-100 text-green-800',
  'In progress': 'bg-blue-100 text-blue-800',
  'Scheduled': 'bg-amber-100 text-amber-800',
  'Monitoring': 'bg-purple-100 text-purple-800',
  'Overdue': 'bg-red-100 text-red-800'
};

// Utility functions
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const getStatusWithDate = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (due < today) {
    return 'Overdue';
  }
  return 'Scheduled';
};

// Main health management component
const HealthManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [healthData, setHealthData] = useState(mockHealthData);
  
  // Filter health events based on search and filters
  const filteredEvents = healthData.healthEvents.filter(event => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      event.cowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.cowTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'All' || 
      event.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort by date (most recent first)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.eventDate) - new Date(a.eventDate)
  );
  
  // Pagination
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  
  // Toggle add event modal
  const toggleAddEvent = () => {
    setIsAddEventOpen(!isAddEventOpen);
  };
  
  // Prepare chart data for health issues
  const healthIssuesData = healthData.healthStats.commonIssues;
  const COLORS = ['#2E7D32', '#1565C0', '#FFA000', '#6D4C41', '#9E9E9E'];
  
  return (
    <div className="h-full bg-gray-100">
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Health Management</h1>
          <button 
            onClick={toggleAddEvent}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <Plus size={20} className="mr-2" />
            Record Health Event
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
              onClick={() => setActiveTab('events')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'events'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Events
            </button>
            <button
              onClick={() => setActiveTab('vaccinations')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'vaccinations'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vaccinations
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className={`py-4 px-2 font-medium text-sm border-b-2 -mb-px ${
                activeTab === 'medications'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medications
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
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div className="bg-gradient-to-br from-white to-red-50 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Cases</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{healthData.healthStats.activeCases}</p>
                </div>
                <div className="p-2 rounded-full bg-red-50 text-red-600">
                  <AlertCircle size={20} />
                </div>
              </div>
              <div className="mt-4 text-xs text-red-600 flex items-center">
                <span>Requires attention</span>
              </div>
            </div>
              
            <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Scheduled Checkups</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{healthData.healthStats.scheduledCheckups}</p>
                </div>
                <div className="p-2 rounded-full bg-green-50 text-green-600">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-4 text-xs text-green-600 flex items-center">
                <span>Next: Today at 2:00 PM</span>
              </div>
            </div>
              
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Treated This Month</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{healthData.healthStats.treatedLastMonth}</p>
                </div>
                <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                  <Thermometer size={20} />
                </div>
              </div>
              <div className="mt-4 text-xs text-amber-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>25% decrease from last month</span>
              </div>
            </div>
              
              
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vaccinations YTD</p>
                    <p className="text-2xl font-semibold text-gray-800 mt-1">{healthData.healthStats.totalVaccinations}</p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                    <Heart size={20} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-blue-600 flex items-center">
                  <span>Herd immunity: Good</span>
                </div>
              </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Treatment History Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Treatment History</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={healthData.healthStats.monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      barSize={25}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                      />
                      <Legend />
                      <Bar dataKey="treatments" name="Treatments" fill="#FFA000" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="checkups" name="Checkups" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Common Health Issues Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Common Health Issues</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthIssuesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {healthIssuesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [`${value} cases`, name]}
                        contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Recent Health Events and Upcoming Vaccinations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Health Events */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Health Events</h2>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {healthData.healthEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-800 mr-2">{event.cowName} ({event.cowTag})</span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[event.status]}`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.eventType} - {event.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(event.eventDate)}</p>
                          <p className="text-xs text-gray-500 mt-1">By: {event.performedBy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Upcoming Vaccinations */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Upcoming Vaccinations</h2>
                  <button
                    onClick={() => setActiveTab('vaccinations')}
                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {healthData.vaccinationSchedule.map(vac => (
                    <div key={vac.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-800 mr-2">{vac.cowName} ({vac.cowTag})</span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[getStatusWithDate(vac.dueDate)]}`}>
                              {getStatusWithDate(vac.dueDate)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{vac.vaccinationType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(vac.dueDate)}</p>
                          <p className="text-xs text-gray-500 mt-1">Assigned to: {vac.assignedTo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="px-6 py-4">
                    <button className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50">
                      + Schedule New Vaccination
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Health Events Tab */}
        {activeTab === 'events' && (
          <div>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search by cow name, tag, or event type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="In progress">In Progress</option>
                    <option value="Monitoring">Monitoring</option>
                  </select>
                </div>
                
                <button className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Health Events Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cow
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Follow Up
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEvents.map(event => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{event.cowName}</div>
                          <div className="text-sm text-gray-500 ml-2">({event.cowTag})</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.eventType}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.eventDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.performedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.followUp ? formatDate(event.followUp) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-green-600 hover:text-green-900">View</a>
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
        )}
        
        {/* Vaccinations Tab */}
        {activeTab === 'vaccinations' && (
          <VaccinationsTab vaccinationSchedule={healthData.vaccinationSchedule} />
        )}
        
        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <MedicationsTab medications={healthData.medications} />
        )}
        
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsTab healthData={healthData} />
        )}
      </div>
      
      {/* Add Health Event Modal */}
      {isAddEventOpen && (
        <AddHealthEventModal onClose={toggleAddEvent} />
      )}
    </div>
  );
};

// Vaccinations Tab Component
const VaccinationsTab = ({ vaccinationSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('calendar');
  const [filteredVaccinations, setFilteredVaccinations] = useState([]);
  
  useEffect(() => {
    // Filter vaccinations based on view
    if (view === 'calendar') {
      // For calendar view, show all vaccinations
      setFilteredVaccinations(vaccinationSchedule);
    } else if (view === 'upcoming') {
      // For upcoming view, show only upcoming vaccinations
      const today = new Date();
      setFilteredVaccinations(
        vaccinationSchedule.filter(vac => new Date(vac.dueDate) >= today)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      );
    } else if (view === 'overdue') {
      // For overdue view, show only overdue vaccinations
      const today = new Date();
      setFilteredVaccinations(
        vaccinationSchedule.filter(vac => new Date(vac.dueDate) < today)
      );
    }
  }, [view, vaccinationSchedule]);
  
  // Generate days for the month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  // Get vaccinations for a specific day
  const getVaccinationsForDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = date.toISOString().split('T')[0];
    
    return vaccinationSchedule.filter(vac => vac.dueDate === dateString);
  };
  
  // Get status class for day
  const getDayStatusClass = (day) => {
    const vaccinations = getVaccinationsForDay(day);
    
    if (vaccinations.length > 0) {
      return 'bg-green-100 text-green-800 font-semibold';
    }
    return '';
  };
  
  return (
    <div>
      {/* View Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                view === 'calendar' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('upcoming')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'upcoming' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setView('overdue')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ml-2 ${
                view === 'overdue' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue
            </button>
          </div>
          
          <div className="flex items-center">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <span className="mx-4 text-sm font-medium">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={18} className="text-gray-500" />
            </button>
            <button className="ml-4 px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              Today
            </button>
          </div>
        </div>
        
        {view === 'calendar' && (
          <div>
            {/* Calendar View */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Calendar header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
              
              {/* Blank days */}
              {blankDays.map((_, index) => (
                <div key={index} className="bg-white p-2 h-32"></div>
              ))}
              
              {/* Days */}
              {days.map((day, index) => (
                <div key={index} className="bg-white p-2 h-32 overflow-y-auto">
                  <div className={`text-right ${getDayStatusClass(day)}`}>
                    <span className="text-sm">{day}</span>
                  </div>
                  {getVaccinationsForDay(day).map(vac => (
                    <div key={vac.id} className="mt-1 p-1 bg-green-50 border border-green-200 rounded text-xs">
                      <div className="font-medium text-green-800">
                        {vac.cowName} ({vac.cowTag})
                      </div>
                      <div className="text-green-600">
                        {vac.vaccinationType}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(view === 'upcoming' || view === 'overdue') && (
          <div>
            {/* List View */}
            <div className="space-y-4">
              {filteredVaccinations.length > 0 ? (
                filteredVaccinations.map(vac => (
                  <div key={vac.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">{vac.cowName} ({vac.cowTag})</span>
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[getStatusWithDate(vac.dueDate)]}`}>
                          {getStatusWithDate(vac.dueDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{vac.vaccinationType}</p>
                      <p className="text-xs text-gray-500 mt-1">Assigned to: {vac.assignedTo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(vac.dueDate)}</p>
                      <div className="mt-2 space-x-2">
                        <button className="px-3 py-1 text-xs text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                          Complete
                        </button>
                        <button className="px-3 py-1 text-xs text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No {view} vaccinations found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Schedule Vaccination</h3>
        </div>
        
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cow" className="block text-sm font-medium text-gray-700 mb-1">
                Cow *
              </label>
              <select
                id="cow"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">Select a cow</option>
                <option value="C001">Daisy (A128)</option>
                <option value="C002">Bella (B094)</option>
                <option value="C003">Buttercup (C215)</option>
                <option value="C004">Millie (D073)</option>
                <option value="C005">Luna (E162)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="vaccination-type" className="block text-sm font-medium text-gray-700 mb-1">
                Vaccination Type *
              </label>
              <select
                id="vaccination-type"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">Select a vaccination type</option>
                <option value="annual">Annual Booster</option>
                <option value="bvd">BVD Vaccine</option>
                <option value="respiratory">Respiratory Vaccine</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                id="due-date"
                className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="assigned-to" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To *
              </label>
              <select
                id="assigned-to"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">Select a person</option>
                <option value="dr-smith">Dr. Smith</option>
                <option value="dr-johnson">Dr. Johnson</option>
                <option value="staff">Farm Staff</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="block w-full pl-3 pr-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              placeholder="Any additional information..."
            ></textarea>
          </div>
          <div>
          <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        
      </div>
  );
};

// Medications Tab Component
const MedicationsTab = ({ medications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [stockAlert, setStockAlert] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filter medications based on search and filters
  const filteredMedications = medications.filter(med => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    const matchesType = 
      filterType === 'All' || 
      med.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Get unique medication types for filter
  const uniqueTypes = Array.from(new Set(medications.map(med => med.type)));
  
  // Check if a medication is low in stock
  const isLowStock = (stock) => stock < 10;
  
  // Check if a medication is about to expire
  const isNearExpiry = (expirationDate) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = Math.abs(expiry - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30; // Within 30 days of expiry
  };
  
  // Toggle add medication modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };
  
  return (
    <div>
      {/* Stock Alerts */}
      {stockAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Inventory Alerts</h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Mastitis Treatment is running low (12 tubes left)</li>
                  <li>Broad Spectrum Antibiotic will expire soon (Aug 10, 2023)</li>
                </ul>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <button 
                    type="button" 
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                  >
                    Order Supplies
                  </button>
                  <button
                    type="button"
                    className="ml-3 px-2 py-1.5 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-50 focus:ring-amber-600"
                    onClick={() => setStockAlert(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search medications by name or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="All">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={toggleAddModal}
            className="flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus size={16} className="mr-2" />
            Add Medication
          </button>
        </div>
      </div>
      
      {/* Medications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredMedications.map(med => (
          <div 
            key={med.id} 
            className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
              isLowStock(med.stock) ? 'border-red-500' : 
              isNearExpiry(med.expirationDate) ? 'border-amber-500' : 
              'border-green-500'
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{med.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{med.type}</p>
                </div>
                <div className="relative">
                  <button className="p-1 rounded-full hover:bg-gray-100 focus:outline-none">
                    <MoreHorizontal size={20} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className={`text-lg font-medium ${isLowStock(med.stock) ? 'text-red-600' : 'text-gray-900'}`}>
                    {med.stock} {med.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiration Date</p>
                  <p className={`text-lg font-medium ${isNearExpiry(med.expirationDate) ? 'text-amber-600' : 'text-gray-900'}`}>
                    {new Date(med.expirationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-gray-600">
                Supplier: {med.supplier}
              </p>
              
              <div className="mt-4 flex space-x-2">
                <button className="px-3 py-1 text-xs text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                  Update Stock
                </button>
                <button className="px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                  Usage History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Order History */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Order History</h2>
          <button className="text-sm text-green-600 hover:text-green-500 font-medium">
            View All Orders
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order No.
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-042
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Apr 15, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                VetSupply Inc.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                5 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $1,245.00
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-038
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Mar 28, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                AnimalHealth Co.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                3 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $720.50
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ORD-2023-031
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Mar 10, 2023
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                FarmMed Ltd.
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                2 items
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $350.25
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Delivered
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <AddMedicationModal onClose={toggleAddModal} />
      )}
    </div>
  );
};

// Reports Tab Component
const ReportsTab = ({ healthData }) => {
  const [reportType, setReportType] = useState('healthSummary');
  const [dateRange, setDateRange] = useState('lastMonth');
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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Health Reports</h2>
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
              <option value="healthSummary">Health Summary Report</option>
              <option value="vaccinationStatus">Vaccination Status Report</option>
              <option value="treatmentHistory">Treatment History Report</option>
              <option value="medicationUsage">Medication Usage Report</option>
              <option value="diseaseIncidence">Disease Incidence Report</option>
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
              <option value="lastWeek">Last 7 days</option>
              <option value="lastMonth">Last 30 days</option>
              <option value="lastQuarter">Last Quarter</option>
              <option value="lastYear">Last Year</option>
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
            title="Monthly Health Summary - April 2023"
            type="Health Summary"
            date="2023-04-26"
            format="PDF"
            size="1.3 MB"
          />
          <ReportItem 
            title="Vaccination Status Report - Q1 2023"
            type="Vaccination Status"
            date="2023-04-15"
            format="Excel"
            size="875 KB"
          />
          <ReportItem 
            title="Treatment History Report - March 2023"
            type="Treatment History"
            date="2023-04-02"
            format="PDF"
            size="1.1 MB"
          />
          <ReportItem 
            title="Medication Usage Report - Q1 2023"
            type="Medication Usage"
            date="2023-03-31"
            format="PDF"
            size="1.2 MB"
          />
          <ReportItem 
            title="Disease Incidence Report - Q1 2023"
            type="Disease Incidence"
            date="2023-03-30"
            format="Excel"
            size="952 KB"
          />
        </ul>
      </div>
    </div>
  );
};

// Report Item Component for Health Management
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

// Add Health Event Modal Component
const AddHealthEventModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    cowId: '',
    eventType: 'Examination',
    eventDate: new Date().toISOString().split('T')[0],
    description: '',
    performedBy: '',
    medications: [{ name: '', dosage: '', method: '' }],
    notes: '',
    followUp: '',
    status: 'Completed'
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle medication field changes
  const handleMedicationChange = (index, field, value) => {
    const updatedMeds = [...formData.medications];
    updatedMeds[index][field] = value;
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Add a new medication field
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...formData.medications, { name: '', dosage: '', method: '' }]
    });
  };
  
  // Remove a medication field
  const removeMedication = (index) => {
    const updatedMeds = [...formData.medications];
    updatedMeds.splice(index, 1);
    
    setFormData({
      ...formData,
      medications: updatedMeds
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // Here you would make an API call to record the health event
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Record Health Event</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
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
                <label htmlFor="cowId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cow *
                </label>
                <select
                  id="cowId"
                  name="cowId"
                  value={formData.cowId}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a cow</option>
                  <option value="C001">Daisy (A128)</option>
                  <option value="C002">Bella (B094)</option>
                  <option value="C003">Buttercup (C215)</option>
                  <option value="C004">Millie (D073)</option>
                  <option value="C005">Luna (E162)</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Examination">Examination</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Hoof Trimming">Hoof Trimming</option>
                  <option value="Regular Checkup">Regular Checkup</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Performed By *
                </label>
                <select
                  id="performedBy"
                  name="performedBy"
                  value={formData.performedBy}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Select a person</option>
                  <option value="Dr. Smith">Dr. Smith</option>
                  <option value="Dr. Johnson">Dr. Johnson</option>
                  <option value="Mike Peterson">Mike Peterson</option>
                  <option value="Farm Staff">Farm Staff</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Brief description of the health event"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medications Used
                </label>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-500"
                >
                  <Plus size={16} className="mr-1" />
                  Add Medication
                </button>
              </div>
              
              {formData.medications.map((med, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 mb-4 border-b pb-4 last:border-0">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. Antibiotic"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. 10ml"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <div className="flex-grow">
                      <label className="block text-xs text-gray-500 mb-1">
                        Administration Method
                      </label>
                      <select
                        value={med.method}
                        onChange={(e) => handleMedicationChange(index, 'method', e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="">Select method</option>
                        <option value="Injection">Injection</option>
                        <option value="Oral">Oral</option>
                        <option value="Topical">Topical</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(index)}
                        className="ml-2 p-2 text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                placeholder="Any additional information about this health event..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="followUp" className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  id="followUp"
                  name="followUp"
                  value={formData.followUp}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="In progress">In progress</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Medication Modal Component
const AddMedicationModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Antibiotic',
    stock: '',
    unit: 'doses',
    expirationDate: '',
    supplier: '',
    reorderLevel: '',
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
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // Here you would make an API call to add the medication
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Add New Medication</h3>
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
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Antibiotic">Antibiotic</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Pain relief">Pain relief</option>
                <option value="Topical">Topical</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="doses">doses</option>
                  <option value="bottles">bottles</option>
                  <option value="tubes">tubes</option>
                  <option value="containers">containers</option>
                  <option value="packages">packages</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  id="reorderLevel"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
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
                placeholder="Any additional information..."
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
              Add Medication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthManagement;