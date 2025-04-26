import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, Clock, Mail, Phone, MapPin, Users, Award, FileText, Briefcase, User,Download,DollarSign } from 'lucide-react';

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
    owner: 'John Smith',
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
    owner: 'John Smith',
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
    owner: 'John Smith',
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
    owner: 'John Smith',
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
    owner: 'John Smith',
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

// Status badge colors
const statusColors = {
  'Active': 'bg-green-100 text-green-800',
  'On Leave': 'bg-amber-100 text-amber-800',
  'Terminated': 'bg-red-100 text-red-800',
  'Dry': 'bg-blue-100 text-blue-800'
};

// Health status colors
const healthStatusColors = {
  'Healthy': 'bg-green-100 text-green-800',
  'Monitored': 'bg-amber-100 text-amber-800',
  'Under treatment': 'bg-red-100 text-red-800'
};

// Attendance status colors
const attendanceStatusColors = {
  'Present': 'bg-green-100 text-green-800',
  'Absent': 'bg-red-100 text-red-800',
  'Late': 'bg-amber-100 text-amber-800',
  'Weekend': 'bg-gray-100 text-gray-800',
  'Holiday': 'bg-blue-100 text-blue-800',
  'Vacation': 'bg-purple-100 text-purple-800'
};

// Utility function to format dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Main cow management component
const CowManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [cows, setCows] = useState(mockCows);
  const [selectedCow, setSelectedCow] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordHealthEventModalOpen, setIsRecordHealthEventModalOpen] = useState(false);
  const [isRecordMilkModalOpen, setIsRecordMilkModalOpen] = useState(false);
  const [isRecordBreedingEventModalOpen, setIsRecordBreedingEventModalOpen] = useState(false);
  const [cowToEdit, setCowToEdit] = useState(null);
  const [cowToDelete, setCowToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    healthStatus: 'All',
    breed: 'All'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [view, setView] = useState('grid'); // 'grid' or 'table'
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  

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

  // Toggle edit modal
  const toggleEditModal = (cow = null, e) => {
    if (e) e.stopPropagation();
    setCowToEdit(cow);
    setIsEditModalOpen(!isEditModalOpen);
  };

  // Toggle delete modal
  const toggleDeleteModal = (cow = null, e) => {
    if (e) e.stopPropagation();
    setCowToDelete(cow);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  // Toggle record health event modal
  const toggleRecordHealthEventModal = () => {
    setIsRecordHealthEventModalOpen(!isRecordHealthEventModalOpen);
  };

  // Add new cow
  const addCow = (newCow) => {
    const id = `C${String(cows.length + 1).padStart(3, '0')}`;
    setCows([...cows, { ...newCow, id }]);
    setSuccessMessage('New cow added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Edit cow
  const editCow = (updatedCow) => {
    setCows(cows.map(cow => cow.id === updatedCow.id ? updatedCow : cow));
    if (selectedCow && selectedCow.id === updatedCow.id) {
      setSelectedCow(updatedCow);
    }
    setSuccessMessage('Cow updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Delete cow
  const deleteCow = (cowId) => {
    setCows(cows.filter(cow => cow.id !== cowId));
    if (selectedCow && selectedCow.id === cowId) {
      setSelectedCow(null);
    }
    setSuccessMessage('Cow deleted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Record health event
  const recordHealthEvent = (cowId, event) => {
    // In a real application, you would update the database
    // For this demo, we'll just update the lastHealthCheck date
    setCows(cows.map(cow => {
      if (cow.id === cowId) {
        return {
          ...cow,
          lastHealthCheck: new Date().toISOString().split('T')[0],
          healthStatus: event.status || cow.healthStatus
        };
      }
      return cow;
    }));
    
    if (selectedCow && selectedCow.id === cowId) {
      setSelectedCow({
        ...selectedCow,
        lastHealthCheck: new Date().toISOString().split('T')[0],
        healthStatus: event.status || selectedCow.healthStatus
      });
    }
    
    setSuccessMessage('Health event recorded successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Toggle record milk production modal
const toggleRecordMilkModal = () => {
  setIsRecordMilkModalOpen(!isRecordMilkModalOpen);
};

// Toggle record breeding event modal
const toggleRecordBreedingEventModal = () => {
  setIsRecordBreedingEventModalOpen(!isRecordBreedingEventModalOpen);
};

// Record milk production
const recordMilkProduction = (cowId, record) => {
  // In a real application, you would update the database
  // For this demo, we'll update the cow's milk production records
  setCows(cows.map(cow => {
    if (cow.id === cowId) {
      return {
        ...cow,
        milkProduction: [...cow.milkProduction, record]
      };
    }
    return cow;
  }));
  
  if (selectedCow && selectedCow.id === cowId) {
    setSelectedCow({
      ...selectedCow,
      milkProduction: [...selectedCow.milkProduction, record]
    });
  }
  
  setSuccessMessage('Milk production recorded successfully!');
  setTimeout(() => setSuccessMessage(''), 3000);
};

// Record breeding event
const recordBreedingEvent = (cowId, event) => {
  // In a real application, you would update the database
  // For this demo, we'll just show a success message
  console.log('Recording breeding event for cow', cowId, event);
  
  // Here you would typically update the cow's breeding history
  // This would require adding a breedingHistory array to your cow model
  // For now, we'll just show a success message
  
  setSuccessMessage('Breeding event recorded successfully!');
  setTimeout(() => setSuccessMessage(''), 3000);
};

  return (
    <div className="h-full bg-gradient-to-br from-green-50 to-blue-50">
      {successMessage && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
          <p>{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-6 right-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-md shadow-lg z-50 animate-fadeIn">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {selectedCow ? (
        <EmployeeProfile 
        cow={selectedCow} 
        onClose={closeCowProfile} 
        onEdit={() => toggleEditModal(selectedCow)}
        onRecordHealthEvent={toggleRecordHealthEventModal} 
        toggleRecordMilkModal={toggleRecordMilkModal}
        toggleRecordBreedingEventModal={toggleRecordBreedingEventModal}
      />
      ) : (
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">Cow Management</h1>
            <button 
              onClick={toggleAddModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 shadow-md"
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                  placeholder="Search by name, tag number or breed..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div>
              <select
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                className={`p-2 rounded-md transition-all duration-300 ${view === 'grid' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-600 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                onClick={() => setView('grid')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                className={`p-2 rounded-md transition-all duration-300 ${view === 'table' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-600 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
                <CowCard 
                  key={cow.id} 
                  cow={cow} 
                  onClick={() => openCowProfile(cow)}
                  onEdit={(e) => toggleEditModal(cow, e)}
                  onDelete={(e) => toggleDeleteModal(cow, e)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-green-50 to-blue-50">
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
                    <tr key={cow.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-200" onClick={() => openCowProfile(cow)}>
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
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                            onClick={(e) => toggleEditModal(cow, e)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            onClick={(e) => toggleDeleteModal(cow, e)}
                          >
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
                className={`px-3 py-1 rounded-md transition-all duration-300 transform ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 shadow'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300 transform hover:scale-110 ${currentPage === page ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 shadow'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md transition-all duration-300 transform ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 shadow'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Cow Modal */}
      {isAddModalOpen && (
        <AddCowModal 
          onClose={toggleAddModal} 
          onAdd={addCow}
        />
      )}

      {/* Edit Cow Modal */}
      {isEditModalOpen && (
        <EditCowModal 
          cow={cowToEdit} 
          onClose={toggleEditModal} 
          onEdit={editCow}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal 
          cow={cowToDelete} 
          onClose={toggleDeleteModal} 
          onDelete={deleteCow}
        />
      )}

      {/* Record Health Event Modal */}
      {isRecordHealthEventModalOpen && (
        <RecordHealthEventModal 
          cow={selectedCow} 
          onClose={toggleRecordHealthEventModal} 
          onSubmit={(event) => recordHealthEvent(selectedCow.id, event)}
        />
      )}
      {/* Record Milk Production Modal */}
      {isRecordMilkModalOpen && (
        <RecordMilkProductionModal 
          cow={selectedCow} 
          onClose={toggleRecordMilkModal} 
          onSubmit={recordMilkProduction}
        />
      )}

      {/* Record Breeding Event Modal */}
      {isRecordBreedingEventModalOpen && (
        <RecordBreedingEventModal 
          cow={selectedCow} 
          onClose={toggleRecordBreedingEventModal} 
          onSubmit={recordBreedingEvent}
        />
      )}
    </div>
  );
};

// Cow Card Component
const CowCard = ({ cow, onClick, onEdit, onDelete }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-blue-700">{cow.name}</h3>
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
            className="w-16 h-16 object-cover rounded-full bg-gray-200 border-2 border-green-100"
          />
          <div className="ml-4">
            <p className="text-sm text-gray-600">{cow.breed}</p>
            <p className="text-sm text-gray-600">{cow.age}</p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-blue-600">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>{cow.milkProduction[cow.milkProduction.length - 1].amount}L/day</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Calendar size={16} className="mr-1" />
              <span>Last check: {new Date(cow.lastHealthCheck).toLocaleDateString()}</span>
            </div>
          </div>
          
          {cow.alerts && cow.alerts.length > 0 && (
            <div className="mt-2 flex items-start text-amber-600 text-sm">
              <svg className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{cow.alerts[0]}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
          <button 
            className="p-1 text-blue-600 hover:text-blue-900 transition-colors duration-200 hover:bg-blue-50 rounded-full"
            onClick={onEdit}
          >
            <Edit size={16} />
          </button>
          <button 
            className="p-1 text-red-600 hover:text-red-900 transition-colors duration-200 hover:bg-red-50 rounded-full"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Employee Profile Component
const EmployeeProfile = ({ cow, onClose, onEdit, onRecordHealthEvent, toggleRecordMilkModal, toggleRecordBreedingEventModal }) => {
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
    <div className="bg-gradient-to-br from-white to-green-50 min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold">{cow.name}</h1>
            {/* <span className="ml-4 px-3 py-1 bg-white text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 font-medium rounded-full text-sm shadow-md">
              {cow.tagNumber}
            </span> */}
          </div>
        </div>
      </div>
      
      {/* Profile Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Left Column - Basic Info */}
          <div className="lg:w-1/3 mb-8 lg:mb-0 lg:pr-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6 flex flex-col items-center">
                <img 
                  src={cow.image} 
                  alt={cow.name} 
                  className="w-32 h-32 object-cover rounded-full bg-gray-200 mb-4 border-4 border-green-100 shadow-md"
                />
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-600">{cow.name}</h2>
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
                    <span className="text-gray-600">Owner:</span>
                    <span className="text-gray-800 font-medium">{cow.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Status:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${healthStatusColors[cow.healthStatus]}`}>
                      {cow.healthStatus}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 w-full flex flex-col space-y-2">
                  <button 
                    onClick={onEdit}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                  >
                    Edit Details
                  </button>
                  <button 
                    onClick={onRecordHealthEvent}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
                  >
                    Record Health Event
                  </button>
                </div>
              </div>
            </div>
            
            {/* Alerts Section */}
            {cow.alerts && cow.alerts.length > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300">
                <h3 className="text-amber-800 font-medium flex items-center">
                  <svg className="h-5 w-5 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('milk')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === 'milk'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Milk Production
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === 'health'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Health Records
                </button>
                <button
                  onClick={() => setActiveTab('breeding')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
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
                    <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Avg. Milk Production</p>
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{avgMilkProduction.toFixed(1)}L</p>
                        </div>
                        <div className="p-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span>+3% from last week</span>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Health Check</p>
                          <p className="text-2xl font-semibold text-gray-800 mt-1">{new Date(cow.lastHealthCheck).toLocaleDateString()}</p>
                        </div>
                        <div className="p-2 rounded-full bg-gradient-to-r from-red-50 to-red-100 text-red-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-600">
                        {cow.vaccinationStatus}
                      </div>
                    </div>
                    
                    <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Next Action</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">Regular checkup</p>
                        </div>
                        <div className="p-2 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 text-xs text-gray-600">
                        Scheduled for {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Recent Activity</h3>
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
                  <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700 mb-4">Daily Milk Production</h3>
                    <div className="h-64">
                      {/* This would be a chart component in a real application */}
                      <div className="h-full bg-gradient-to-r from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Milk production chart would go here</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Production Records</h3>
                      <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={toggleRecordMilkModal}>
                        Record New
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-green-50 to-blue-50">
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
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
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
                  <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Health Status</h3>
                      <button 
                        onClick={onRecordHealthEvent}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
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
                  
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Health History</h3>
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
                  <div className="bg-white shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700 mb-4">Breeding Information</h3>
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
                  
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Breeding Events</h3>
                      <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={toggleRecordBreedingEventModal}>
                        Record New Event
                      </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-green-50 to-blue-50">
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
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
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
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
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
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
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
        return <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
      case 'health':
        return <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'feed':
        return <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
      case 'treatment':
        return <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
      default:
        return null;
    }
  };
  
  return (
    <div className="px-6 py-4 flex items-start hover:bg-gray-50 transition-colors duration-200">
      <div className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full mr-4 mt-1 shadow-sm">
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
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
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


// Add Cow Modal Component
const AddCowModal = ({ onClose, onAdd }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    breed: 'Holstein',
    dateOfBirth: '',
    status: 'Active',
    healthStatus: 'Healthy',
    owner: '',
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
    
    // Create a new cow object
    const newCow = {
      tagNumber: formData.tagNumber,
      name: formData.name,
      breed: formData.breed,
      dateOfBirth: formData.dateOfBirth,
      age: calculateAge(formData.dateOfBirth),
      status: formData.status,
      healthStatus: formData.healthStatus,
      milkProduction: [
        { date: new Date().toISOString().split('T')[0], amount: 0 }
      ],
      lastHealthCheck: new Date().toISOString().split('T')[0],
      vaccinationStatus: 'Up to date',
      image: '/api/placeholder/160/160', // Use placeholder for demo
      notes: formData.notes
    };
    
    onAdd(newCow);
    onClose();
  };
  
  // Calculate age in years based on date of birth
  const calculateAge = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return `${age} years`;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Add New Cow</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
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
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 1 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  1
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                  Basic Info
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 2 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 2 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  2
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                  Additional Details
                </div>
              </div>
              <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${currentStep >= 3 ? 'border-green-600' : 'border-gray-300'}`}></div>
              <div className="flex items-center relative">
                <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${currentStep >= 3 ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-600 text-white' : 'border-gray-300 text-gray-500'} flex items-center justify-center`}>
                  3
                </div>
                <div className={`absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium ${currentStep >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                  Review
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="animate-fadeIn">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    >
                      <option value="Active">Active</option>
                      <option value="Dry">Dry</option>
                      <option value="Sold">Sold</option>
                      <option value="Deceased">Deceased</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">
                      Owner *
                    </label>
                    <input
                      type="text"
                      id="owner"
                      name="owner"
                      value={formData.owner}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 mb-1">
                      Health Status *
                    </label>
                    <select
                      id="healthStatus"
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Monitored">Monitored</option>
                      <option value="Under treatment">Under treatment</option>
                    </select>
                  </div>
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
                          className="h-24 w-24 object-cover rounded-md border-2 border-green-100 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, photo: null})}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow-md transform transition-transform duration-300 hover:scale-110"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:border-green-400 transition-colors duration-300">
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
              <div className="space-y-6 animate-fadeIn">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                        className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all duration-300"
                    placeholder="Any additional information about this cow..."
                  ></textarea>
                </div>
              </div>
            )}
            
            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-blue-700">Review Information</h4>
                <p className="text-gray-600">Please review the information below before submitting.</p>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 shadow-sm">
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
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Owner</h5>
                      <p className="text-gray-800">{formData.owner}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Health Status</h5>
                      <p className="text-gray-800">{formData.healthStatus}</p>
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
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Notes</h5>
                      <p className="text-gray-800">{formData.notes}</p>
                    </div>
                  )}
                  
                  {formData.photo && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Photo</h5>
                      <img 
                        src={URL.createObjectURL(formData.photo)} 
                        alt="Cow" 
                        className="h-24 w-24 object-cover rounded-md mt-2 border border-gray-200 shadow-sm"
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
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                >
                  Cancel
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
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

// EditCowModal Component
const EditCowModal = ({ cow, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tagNumber: cow.tagNumber || '',
    name: cow.name || '',
    breed: cow.breed || 'Holstein',
    dateOfBirth: cow.dateOfBirth || '',
    status: cow.status || 'Active',
    purchaseDate: cow.purchaseDate || '',
    purchasePrice: cow.purchasePrice || '',
    initialWeight: cow.initialWeight || '',
    notes: cow.notes || '',
    photo: cow.photo || null
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
    // Here you would make an API call to update the cow
    console.log('Updated cow data:', formData);
    
    if (onSave) {
      onSave(formData);
    }
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
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Edit Cow</h3>
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
                      src={typeof formData.photo === 'string' ? formData.photo : URL.createObjectURL(formData.photo)} 
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
                Weight (kg)
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// DeleteConfirmationModal Component
const DeleteConfirmationModal = ({ cow, onClose, onDelete }) => {
  const handleDelete = () => {
    // Here you would make an API call to delete the cow
    console.log('Deleting cow:', cow.id);
    
    if (onDelete) {
      onDelete(cow.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Confirm Deletion</h3>
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
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="ml-3 text-lg font-medium text-gray-900">Delete {cow.name} ({cow.tagNumber})</h4>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this cow? This action cannot be undone and all associated data will be permanently removed.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// RecordHealthEventModal Component
const RecordHealthEventModal = ({ cow, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cowId: cow.id || '',
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
    // Here you would make an API call to record the health event
    console.log('Health event data:', formData);
    
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Record Health Event for {cow.name} ({cow.tagNumber})</h3>
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
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  <option value="Scheduled">Scheduled</option>
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
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
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

// Record Milk Production Modal Component
const RecordMilkProductionModal = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Morning',
    amount: '',
    quality: 'Good',
    notes: '',
    sendWhatsAppNotification: false
  });
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  // WhatsApp notification service
  const sendWhatsAppNotification = async (recordData, cowData) => {
    try {
      console.log('Sending WhatsApp notification for milk record:', recordData);
      
      // In a real implementation, make an API call to your WhatsApp service (like Twilio)
      // Example:
      const message = `Hello ${cowData.owner}, your cow ${cowData.name} (${cowData.tagNumber}) has produced ${recordData.amount}L of milk on ${recordData.date}.`;
      
      // Mock API call for demonstration
      /*
      const response = await fetch('https://api.yourmessagingservice.com/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_AUTH_TOKEN'
        },
        body: JSON.stringify({
          to: `whatsapp:+15551234567`, // Get owner's phone number from database
          from: 'whatsapp:+15551234567',  // Your WhatsApp business number
          body: message
        })
      });
      
      const result = await response.json();
      */
      
      // For demo, log the notification details
      console.log('WhatsApp message:', message);
      console.log('WhatsApp notification would be sent to:', cowData.owner);
      
      // Return success
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      return { success: false, message: error.message };
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new milk production record
    const newRecord = {
      date: formData.date,
      shift: formData.shift,
      amount: parseFloat(formData.amount),
      quality: formData.quality,
      notes: formData.notes
    };
    
    onSubmit(cow.id, newRecord);

    if (formData.sendWhatsAppNotification) {
      const notificationResult = sendWhatsAppNotification(formData, cow);
      
      if (notificationResult.success) {
        console.log('Notification sent successfully');
      } else {
        console.error('Failed to send notification:', notificationResult.message);
      }
    }

    alert(formData.sendWhatsAppNotification 
      ? 'Milk record added and notification sent!'
      : 'Milk record added successfully!');

    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-green-700">Record Milk Production</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (L) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                placeholder="Enter amount in liters"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-300"
                placeholder="Any additional notes about this collection..."
              ></textarea>
            </div>
          </div>
          <div className="flex items-center px-6 py-4">
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
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Record Breeding Event Modal Component
const RecordBreedingEventModal = ({ cow, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    eventType: 'Heat Detection',
    details: '',
    result: '',
    notes: '',
    performedBy: ''
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
    
    // Create a new breeding event record
    const newEvent = {
      date: formData.date,
      eventType: formData.eventType,
      details: formData.details,
      result: formData.result,
      notes: formData.notes,
      performedBy: formData.performedBy
    };
    
    onSubmit(cow.id, newEvent);
    onClose();
  };
  
  // Get result options based on event type
  const getResultOptions = () => {
    switch(formData.eventType) {
      case 'Heat Detection':
        return ['Confirmed', 'No heat', 'Uncertain'];
      case 'Insemination':
        return ['Completed', 'Failed', 'Partial'];
      case 'Pregnancy Check':
        return ['Positive', 'Negative', 'Inconclusive'];
      case 'Calving':
        return ['Healthy', 'Complications', 'Stillborn'];
      default:
        return ['Successful', 'Unsuccessful', 'Partial Success'];
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">Record Breeding Event</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                />
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
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                >
                  <option value="Heat Detection">Heat Detection</option>
                  <option value="Insemination">Insemination</option>
                  <option value="Pregnancy Check">Pregnancy Check</option>
                  <option value="Calving">Calving</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">
                Details *
              </label>
              <input
                type="text"
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder="E.g., Observed standing heat, Bull ID, Calf weight"
              />
            </div>
            
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                Result *
              </label>
              <select
                id="result"
                name="result"
                value={formData.result}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
              >
                <option value="">Select a result</option>
                {getResultOptions().map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="performedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Performed By
              </label>
              <input
                type="text"
                id="performedBy"
                name="performedBy"
                value={formData.performedBy}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder="Name of person who performed the procedure"
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-all duration-300"
                placeholder="Any additional notes about this breeding event..."
              ></textarea>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CowManagement;