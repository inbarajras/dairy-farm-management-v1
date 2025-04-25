import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Droplet, Calendar, Clipboard, AlertTriangle, Heart, MoreHorizontal,Thermometer } from 'lucide-react';

// Mock data for cows
const mockCows = [
  {
    id: 'C001',
    tagNumber: 'A128',
    name: 'Daisy',
    breed: 'Holstein',
    dateOfBirth: '2019-05-15',
    age: '4 years',
    status: 'Active',
    healthStatus: 'Healthy',
    milkProduction: [
      { date: '2023-04-20', amount: 28 },
      { date: '2023-04-21', amount: 27 },
      { date: '2023-04-22', amount: 29 },
      { date: '2023-04-23', amount: 26 },
      { date: '2023-04-24', amount: 28 },
      { date: '2023-04-25', amount: 30 },
      { date: '2023-04-26', amount: 29 },
    ],
    lastHealthCheck: '2023-04-15',
    vaccinationStatus: 'Up to date',
    image: '/api/placeholder/160/160'
  },
  {
    id: 'C002',
    tagNumber: 'B094',
    name: 'Bella',
    breed: 'Jersey',
    dateOfBirth: '2020-03-10',
    age: '3 years',
    status: 'Active',
    healthStatus: 'Healthy',
    milkProduction: [
      { date: '2023-04-20', amount: 22 },
      { date: '2023-04-21', amount: 23 },
      { date: '2023-04-22', amount: 22 },
      { date: '2023-04-23', amount: 24 },
      { date: '2023-04-24', amount: 23 },
      { date: '2023-04-25', amount: 21 },
      { date: '2023-04-26', amount: 22 },
    ],
    lastHealthCheck: '2023-04-10',
    vaccinationStatus: 'Up to date',
    image: '/api/placeholder/160/160'
  },
  {
    id: 'C003',
    tagNumber: 'C215',
    name: 'Buttercup',
    breed: 'Brown Swiss',
    dateOfBirth: '2018-08-22',
    age: '5 years',
    status: 'Active',
    healthStatus: 'Under treatment',
    milkProduction: [
      { date: '2023-04-20', amount: 18 },
      { date: '2023-04-21', amount: 16 },
      { date: '2023-04-22', amount: 15 },
      { date: '2023-04-23', amount: 14 },
      { date: '2023-04-24', amount: 16 },
      { date: '2023-04-25', amount: 18 },
      { date: '2023-04-26', amount: 19 },
    ],
    lastHealthCheck: '2023-04-22',
    vaccinationStatus: 'Up to date',
    alerts: ['Mastitis treatment in progress'],
    image: '/api/placeholder/160/160'
  },
  {
    id: 'C004',
    tagNumber: 'D073',
    name: 'Millie',
    breed: 'Holstein',
    dateOfBirth: '2021-01-05',
    age: '2 years',
    status: 'Active',
    healthStatus: 'Healthy',
    milkProduction: [
      { date: '2023-04-20', amount: 25 },
      { date: '2023-04-21', amount: 26 },
      { date: '2023-04-22', amount: 27 },
      { date: '2023-04-23', amount: 25 },
      { date: '2023-04-24', amount: 26 },
      { date: '2023-04-25', amount: 27 },
      { date: '2023-04-26', amount: 25 },
    ],
    lastHealthCheck: '2023-04-18',
    vaccinationStatus: 'Due for vaccination',
    alerts: ['Vaccination due in 5 days'],
    image: '/api/placeholder/160/160'
  },
  {
    id: 'C005',
    tagNumber: 'E162',
    name: 'Luna',
    breed: 'Ayrshire',
    dateOfBirth: '2020-07-12',
    age: '3 years',
    status: 'Active',
    healthStatus: 'Monitored',
    milkProduction: [
      { date: '2023-04-20', amount: 20 },
      { date: '2023-04-21', amount: 19 },
      { date: '2023-04-22', amount: 18 },
      { date: '2023-04-23', amount: 17 },
      { date: '2023-04-24', amount: 19 },
      { date: '2023-04-25', amount: 20 },
      { date: '2023-04-26', amount: 21 },
    ],
    lastHealthCheck: '2023-04-20',
    vaccinationStatus: 'Up to date',
    alerts: ['Low milk production trend'],
    image: '/api/placeholder/160/160'
  }
];

// Health status colors
const healthStatusColors = {
  'Healthy': 'bg-green-100 text-green-800',
  'Monitored': 'bg-amber-100 text-amber-800',
  'Under treatment': 'bg-red-100 text-red-800'
};

const CowManagement = () => {
  const [cows, setCows] = useState(mockCows);
  const [selectedCow, setSelectedCow] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    healthStatus: 'All',
    breed: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [view, setView] = useState('grid'); // 'grid' or 'table'

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Filter cows based on search and filters
  const filteredCows = cows.filter(cow => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cow.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cow.breed.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      filters.status === 'All' || 
      cow.status === filters.status;
    
    // Health status filter
    const matchesHealthStatus = 
      filters.healthStatus === 'All' || 
      cow.healthStatus === filters.healthStatus;
    
    // Breed filter
    const matchesBreed = 
      filters.breed === 'All' || 
      cow.breed === filters.breed;
    
    return matchesSearch && matchesStatus && matchesHealthStatus && matchesBreed;
  });

  // Pagination
  const indexOfLastCow = currentPage * itemsPerPage;
  const indexOfFirstCow = indexOfLastCow - itemsPerPage;
  const currentCows = filteredCows.slice(indexOfFirstCow, indexOfLastCow);
  const totalPages = Math.ceil(filteredCows.length / itemsPerPage);

  // Get unique breeds for filter
  const uniqueBreeds = Array.from(new Set(cows.map(cow => cow.breed)));

  // Open cow profile
  const openCowProfile = (cow) => {
    setSelectedCow(cow);
  };

  // Close cow profile
  const closeCowProfile = () => {
    setSelectedCow(null);
  };

  // Toggle add modal
  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  return (
    <div className="h-full bg-gray-100">
      {selectedCow ? (
        <CowProfile cow={selectedCow} onClose={closeCowProfile} />
      ) : (
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Cow Management</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus size={20} className="mr-2" />
              Add New Cow
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Search by name, tag number or breed..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div>
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Dry">Dry</option>
                <option value="Sold">Sold</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div>
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={filters.healthStatus}
                onChange={(e) => handleFilterChange('healthStatus', e.target.value)}
              >
                <option value="All">All Health Status</option>
                <option value="Healthy">Healthy</option>
                <option value="Monitored">Monitored</option>
                <option value="Under treatment">Under treatment</option>
              </select>
            </div>

            <div>
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={filters.breed}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
              >
                <option value="All">All Breeds</option>
                {uniqueBreeds.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle and Count */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstCow + 1}-{Math.min(indexOfLastCow, filteredCows.length)} of {filteredCows.length} cows
            </div>
            <div className="flex space-x-2">
              <button
                className={`p-2 rounded-md ${view === 'grid' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setView('grid')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                className={`p-2 rounded-md ${view === 'table' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setView('table')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cow List */}
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentCows.map(cow => (
                <CowCard key={cow.id} cow={cow} onClick={() => openCowProfile(cow)} />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Milk Production
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCows.map(cow => (
                    <tr key={cow.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCowProfile(cow)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cow.tagNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.breed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.age}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${healthStatusColors[cow.healthStatus]}`}>
                          {cow.healthStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cow.milkProduction[cow.milkProduction.length - 1].amount}L/day
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit size={16} />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

      {/* Add Cow Modal */}
      {isAddModalOpen && (
        <AddCowModal onClose={toggleAddModal} />
      )}
    </div>
  );
};

// Cow Card Component
const CowCard = ({ cow, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{cow.name}</h3>
            <p className="text-sm text-gray-500">Tag: {cow.tagNumber}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${healthStatusColors[cow.healthStatus]}`}>
            {cow.healthStatus}
          </span>
        </div>
        
        <div className="flex items-center mb-4">
          <img 
            src={cow.image} 
            alt={cow.name} 
            className="w-16 h-16 object-cover rounded-full bg-gray-200"
          />
          <div className="ml-4">
            <p className="text-sm text-gray-600">{cow.breed}</p>
            <p className="text-sm text-gray-600">{cow.age}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-600">
              <Droplet size={16} className="mr-1" />
              <span>{cow.milkProduction[cow.milkProduction.length - 1].amount}L/day</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar size={16} className="mr-1" />
              <span>Last check: {new Date(cow.lastHealthCheck).toLocaleDateString()}</span>
            </div>
          </div>
          
          {cow.alerts && cow.alerts.length > 0 && (
            <div className="mt-2 flex items-start text-amber-600 text-sm">
              <AlertTriangle size={16} className="mr-1 mt-0.5 flex-shrink-0" />
              <span>{cow.alerts[0]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Cow Profile Component
const CowProfile = ({ cow, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate average milk production
  const avgMilkProduction = cow.milkProduction.reduce((sum, record) => sum + record.amount, 0) / cow.milkProduction.length;
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-4 p-1 rounded-full hover:bg-green-500 transition-colors duration-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold">{cow.name}</h1>
            <span className="ml-4 px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
              {cow.tagNumber}
            </span>
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Basic Info */}
          <div className="lg:w-1/3 mb-8 lg:mb-0 lg:pr-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 flex flex-col items-center">
                <img 
                  src={cow.image} 
                  alt={cow.name} 
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-800">{cow.name}</h2>
                <p className="text-gray-500">Tag: {cow.tagNumber}</p>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="text-gray-800 font-medium">{cow.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="text-gray-800 font-medium">{formatDate(cow.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="text-gray-800 font-medium">{cow.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-800 font-medium">{cow.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${healthStatusColors[cow.healthStatus]}`}>
                      {cow.healthStatus}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex flex-col space-y-2">
                  <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Edit Details
                  </button>
                  <button className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Record Health Event
                  </button>
                </div>
              </div>
            </div>
            
            {/* Alerts Section */}
            {cow.alerts && cow.alerts.length > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-800 font-medium flex items-center">
                  <AlertTriangle size={18} className="mr-2" />
                  Alerts
                </h3>
                <ul className="mt-2 space-y-2">
                  {cow.alerts.map((alert, index) => (
                    <li key={index} className="text-amber-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Right Column - Tabs & Details */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('milk')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'milk'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Milk Production
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'health'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Health Records
                </button>
                <button
                  onClick={() => setActiveTab('breeding')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'breeding'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Breeding
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="py-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Avg. Milk Production</p>
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{avgMilkProduction.toFixed(1)}L</p>
                        </div>
                        <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                          <Droplet size={20} />
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span>+3% from last week</span>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Health Check</p>
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{new Date(cow.lastHealthCheck).toLocaleDateString()}</p>
                        </div>
                        <div className="p-2 rounded-full bg-red-50 text-red-600">
                          <Heart size={20} />
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-600">
                        {cow.vaccinationStatus}
                      </div>
                    </div>
                    
                    <div className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Next Action</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">Regular checkup</p>
                        </div>
                        <div className="p-2 rounded-full bg-amber-50 text-amber-600">
                          <Calendar size={20} />
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-600">
                        Scheduled for {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <ActivityItem 
                        type="milk" 
                        description={`Milk collection recorded: ${cow.milkProduction[cow.milkProduction.length - 1].amount}L`} 
                        date="Today"
                      />
                      <ActivityItem 
                        type="health" 
                        description="Regular health check completed" 
                        date="5 days ago"
                      />
                      <ActivityItem 
                        type="feed" 
                        description="Feed ration updated" 
                        date="1 week ago"
                      />
                      <ActivityItem 
                        type="treatment" 
                        description="Vaccination administered" 
                        date="2 weeks ago"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Milk Production Tab */}
              {activeTab === 'milk' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Milk Production</h3>
                    <div className="h-64">
                      {/* This would be a chart component in a real application */}
                      <div className="h-full bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-gray-500">Milk production chart would go here</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Production Records</h3>
                      <button className="text-sm text-green-600 hover:text-green-500 font-medium">
                        Record New
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount (L)
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quality
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cow.milkProduction.slice().reverse().map((record, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {record.amount} L
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Good
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index === 0 ? "Morning collection" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Health Records Tab */}
              {activeTab === 'health' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-800">Health Status</h3>
                      <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        Record Health Event
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Current Status</h4>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${healthStatusColors[cow.healthStatus]}`}>
                            {cow.healthStatus}
                          </span>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                          Last health check: {formatDate(cow.lastHealthCheck)}
                        </p>
                        
                        <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Vaccination Status</h4>
                        <p className="text-sm text-gray-800">{cow.vaccinationStatus}</p>
                      </div>
                      
                      <div className="border-l border-gray-200 pl-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Vital Signs (Last Check)</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Temperature:</span>
                            <span className="text-sm font-medium text-gray-800">38.5°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Heart Rate:</span>
                            <span className="text-sm font-medium text-gray-800">65 BPM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Respiratory Rate:</span>
                            <span className="text-sm font-medium text-gray-800">22 breaths/min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Weight:</span>
                            <span className="text-sm font-medium text-gray-800">580 kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Health History</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      <HealthRecord 
                        date="2023-04-15" 
                        type="Regular checkup" 
                        description="All vital signs normal. Cow in good health."
                        performedBy="Dr. Smith"
                      />
                      <HealthRecord 
                        date="2023-03-01" 
                        type="Vaccination" 
                        description="Annual vaccination administered."
                        performedBy="Dr. Johnson"
                      />
                      <HealthRecord 
                        date="2023-01-15" 
                        type="Treatment" 
                        description="Treated for minor hoof issue."
                        performedBy="Dr. Smith"
                      />
                      <HealthRecord 
                        date="2022-10-10" 
                        type="Regular checkup" 
                        description="All vital signs normal. Weight: 560kg."
                        performedBy="Dr. Johnson"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Breeding Tab */}
              {activeTab === 'breeding' && (
                <div>
                  <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Breeding Information</h3>
                    <p className="text-gray-500 mb-4">Breeding history and reproductive information for {cow.name}.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Reproductive Status</h4>
                        <p className="text-sm font-medium text-gray-800">Open</p>
                        
                        <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Last Heat</h4>
                        <p className="text-sm text-gray-800">March 15, 2023</p>
                        
                        <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Next Expected Heat</h4>
                        <p className="text-sm text-gray-800">April 5, 2023</p>
                      </div>
                      
                      <div className="border-l border-gray-200 pl-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Calving History</h4>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-800">2 previous calvings</div>
                          <div className="text-sm text-gray-600">Last calving: October 10, 2022</div>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-500 mt-6 mb-2">Breeding Plan</h4>
                        <p className="text-sm text-gray-800">Scheduled for artificial insemination in next heat cycle</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Breeding Events</h3>
                      <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        Record New Event
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            March 15, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Heat Detection
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Observed standing heat
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Confirmed
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            February 23, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Heat Detection
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            No signs observed
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              No heat
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            October 10, 2022
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Calving
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Female calf, 35kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Healthy
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component for Profile
const ActivityItem = ({ type, description, date }) => {
  const getIcon = () => {
    switch (type) {
      case 'milk':
        return <Droplet size={16} className="text-blue-500" />;
      case 'health':
        return <Heart size={16} className="text-red-500" />;
      case 'feed':
        return <Clipboard size={16} className="text-amber-500" />;
      case 'treatment':
        return <Thermometer size={16} className="text-purple-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="px-6 py-4 flex items-start">
      <div className="p-2 bg-gray-100 rounded-full mr-4 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
};

// Health Record Component
const HealthRecord = ({ date, type, description, performedBy }) => {
  return (
    <div className="px-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-800 font-medium">{type}</p>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-xs text-gray-500 mt-2">Performed by: {performedBy}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{formatDate(date)}</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Add Cow Modal Component
const AddCowModal = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: 'Holstein',
    dateOfBirth: '',
    status: 'Active',
    purchaseDate: '',
    purchasePrice: '',
    initialWeight: '',
    notes: '',
    photo: null
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
    // Here you would make an API call to create the cow
    onClose();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        photo: e.target.files[0]
      });
    }
  };
  
  // Go to next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  // Go to previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Add New Cow</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 1 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  1
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                  Basic Info
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 2 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 2 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  2
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                  Additional Details
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 3 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 3 ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  3
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                  Review
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tagNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      id="tagNumber"
                      name="tagNumber"
                      value={formData.tagNumber}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
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
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                      Breed *
                    </label>
                    <select
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    >
                      <option value="Holstein">Holstein</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Brown Swiss">Brown Swiss</option>
                      <option value="Ayrshire">Ayrshire</option>
                      <option value="Guernsey">Guernsey</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Dry">Dry</option>
                    <option value="Sold">Sold</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo
                  </label>
                  <div className="mt-1 flex items-center">
                    {formData.photo ? (
                      <div className="relative">
                        <img 
                          src={URL.createObjectURL(formData.photo)} 
                          alt="Cow" 
                          className="h-24 w-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, photo: null})}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md">
                        <label htmlFor="file-upload" className="relative cursor-pointer">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="mt-2 block text-xs text-gray-600">
                              Upload
                            </span>
                          </div>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Additional Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="purchasePrice"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="initialWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="initialWeight"
                    name="initialWeight"
                    value={formData.initialWeight}
                    onChange={handleChange}
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
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Any additional information about this cow..."
                  ></textarea>
                </div>
              </div>
            )}
            
            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-800">Review Information</h4>
                <p className="text-gray-600">Please review the information below before submitting.</p>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Tag Number</h5>
                      <p className="text-gray-800">{formData.tagNumber}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Name</h5>
                      <p className="text-gray-800">{formData.name}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Breed</h5>
                      <p className="text-gray-800">{formData.breed}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Date of Birth</h5>
                      <p className="text-gray-800">{formData.dateOfBirth}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Status</h5>
                      <p className="text-gray-800">{formData.status}</p>
                    </div>
                    {formData.purchaseDate && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Purchase Date</h5>
                        <p className="text-gray-800">{formData.purchaseDate}</p>
                      </div>
                    )}
                    {formData.purchasePrice && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Purchase Price</h5>
                        <p className="text-gray-800">${formData.purchasePrice}</p>
                      </div>
                    )}
                    {formData.initialWeight && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500">Initial Weight</h5>
                        <p className="text-gray-800">{formData.initialWeight} kg</p>
                      </div>
                    )}
                  </div>
                  
                  {formData.notes && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Notes</h5>
                      <p className="text-gray-800">{formData.notes}</p>
                    </div>
                  )}
                  
                  {formData.photo && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Photo</h5>
                      <img 
                        src={URL.createObjectURL(formData.photo)} 
                        alt="Cow" 
                        className="h-24 w-24 object-cover rounded-md mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Cow
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CowManagement;